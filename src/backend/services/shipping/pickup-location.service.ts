import { shiprocketClient } from '@/backend/lib/shiprocket';
import { prisma } from '@/lib/prisma';

import { SHIPROCKET_CONSTANTS } from './constants';
import { ShiprocketLogger } from './logger';

export interface CreatePickupLocationInput {
  shopId: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  isPrimary?: boolean;
}

function normalizeIndianState(rawState: string): string {
  const clean = (rawState || '').trim().toLowerCase();
  if (clean.startsWith('har') || clean === 'hr') return 'Haryana';
  if (clean.startsWith('pun') || clean === 'pb') return 'Punjab';
  if (clean.startsWith('del') || clean === 'dl') return 'Delhi';
  if (clean.startsWith('raj') || clean === 'rj') return 'Rajasthan';
  if (clean.startsWith('uttar p') || clean === 'up') return 'Uttar Pradesh';
  if (clean.startsWith('uttarak') || clean.startsWith('uttaranchal') || clean === 'uk')
    return 'Uttarakhand';
  if (clean.startsWith('mah') || clean === 'mh') return 'Maharashtra';
  if (clean.startsWith('guj') || clean === 'gj') return 'Gujarat';
  if (clean.startsWith('him') || clean === 'hp') return 'Himachal Pradesh';
  if (clean.startsWith('jam') || clean === 'jk') return 'Jammu and Kashmir';
  if (clean.startsWith('cha') || clean === 'ch') return 'Chandigarh';
  if (clean.startsWith('bih') || clean === 'br') return 'Bihar';
  if (clean.startsWith('mad') || clean === 'mp') return 'Madhya Pradesh';
  if (clean.startsWith('wes') || clean === 'wb') return 'West Bengal';
  if (clean.startsWith('kar') || clean === 'ka') return 'Karnataka';
  if (clean.startsWith('tel') || clean === 'ts' || clean === 'tg') return 'Telangana';
  if (clean.startsWith('tam') || clean === 'tn') return 'Tamil Nadu';
  if (clean.startsWith('and') || clean === 'ap') return 'Andhra Pradesh';
  if (clean.startsWith('ker') || clean === 'kl') return 'Kerala';
  if (clean.startsWith('odi') || clean.startsWith('ori') || clean === 'od' || clean === 'or')
    return 'Odisha';
  if (clean.startsWith('ass') || clean === 'as') return 'Assam';
  if (clean.startsWith('goa') || clean === 'ga') return 'Goa';
  if (clean.startsWith('jha') || clean === 'jh') return 'Jharkhand';
  if (clean.startsWith('chh') || clean === 'cg' || clean === 'ct') return 'Chhattisgarh';
  return rawState?.trim() || 'Haryana';
}

export class PickupLocationService {
  /**
   * Registers a Navya Pickup Location with Shiprocket via the official `/settings/company/addpickup` API.
   */
  static async registerWithShiprocket(pickupLocationId: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const location = await prisma.pickupLocation.findUnique({
        where: { id: pickupLocationId },
        include: { shop: { include: { owner: true, sellerProfile: true } } },
      });

      if (!location) {
        return { success: false, message: 'Pickup location not found.' };
      }

      // Check credentials configured
      if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
        ShiprocketLogger.warn(
          '[PICKUP_REGISTRATION_SKIPPED] Shiprocket credentials not configured.',
        );
        return {
          success: false,
          message: 'Shiprocket credentials not configured in environment.',
        };
      }

      // Clean pickup nickname (alphanumeric and hyphens/underscores only, max 30 chars)
      const rawPickupName =
        location.shiprocketPickupName || location.locationCode || `PKP_${location.id.slice(-6)}`;
      const shiprocketPickupName = rawPickupName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);

      // Clean contact name - prioritize primary seller account owner name
      const rawContactName =
        location.shop?.owner?.name ||
        location.shop?.bankAccountHolder ||
        location.contactName ||
        location.shop?.sellerProfile?.legalName ||
        location.shop?.name ||
        'Store Manager';
      const contactName = rawContactName.trim().slice(0, 50) || 'Store Manager';

      // Keep local pickup location contact name synchronized with owner name
      if (location.contactName !== contactName) {
        await prisma.pickupLocation
          .update({
            where: { id: location.id },
            data: { contactName },
          })
          .catch(() => {});
      }

      // Clean phone number (extract 10 digits)
      const rawPhone =
        location.contactPhone ||
        location.shop?.phone ||
        location.shop?.owner?.mobile ||
        '9991983125';
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10) || '9991983125';

      // Clean email
      const cleanEmail =
        location.contactEmail ||
        location.shop?.email ||
        location.shop?.owner?.email ||
        'seller@navyacollection.store';

      // Clean street address (Shiprocket requires minimum 10 characters)
      let rawAddress = location.addressLine1 || location.shop?.fullAddress || 'Main Market Road';
      if (rawAddress.trim().length < 10) {
        rawAddress = `${rawAddress.trim()}, Near Main Market`;
      }

      const cleanCity = (location.city || location.shop?.city || 'Hisar').trim();
      const cleanState = normalizeIndianState(location.state || location.shop?.state || 'Haryana');
      const cleanPincode = (location.pincode || location.shop?.pincode || '125001')
        .replace(/\D/g, '')
        .slice(0, 6);

      const payload = {
        pickup_location: shiprocketPickupName,
        name: contactName,
        email: cleanEmail,
        phone: cleanPhone,
        address: rawAddress.trim(),
        address_2: location.addressLine2 || '',
        city: cleanCity,
        state: cleanState,
        country: 'India',
        pin_code: cleanPincode,
      };

      ShiprocketLogger.info(
        `[SHIPROCKET_ADD_PICKUP_REQUEST] Registering: ${shiprocketPickupName}`,
        undefined,
        payload,
      );

      const response = await shiprocketClient.post('/settings/company/addpickup', payload);
      const isSuccess = response.status === 200 || response.status === 201;
      const respData = response.data || {};
      const respMsg = (respData.message || respData.success || '').toString().toLowerCase();

      // Verify if successful or already exists
      if (isSuccess && respData.success !== false) {
        await prisma.pickupLocation.update({
          where: { id: location.id },
          data: {
            shiprocketPickupName,
            shiprocketStatus: 'CONNECTED',
            shiprocketResponse: respData,
          },
        });

        // Also update primary pickup name on Shop for quick lookup
        if (location.isPrimary || !location.shop?.shiprocketPickupName) {
          await prisma.shop.update({
            where: { id: location.shopId },
            data: { shiprocketPickupName },
          });
        }

        return {
          success: true,
          message: respData.message || 'Pickup location registered with Shiprocket successfully.',
          data: respData,
        };
      }

      // If already exists on Shiprocket
      if (respMsg.includes('already exists') || respMsg.includes('already added')) {
        await prisma.pickupLocation.update({
          where: { id: location.id },
          data: {
            shiprocketPickupName,
            shiprocketStatus: 'CONNECTED',
            shiprocketResponse: respData,
          },
        });

        return {
          success: true,
          message: 'Pickup location is already registered on Shiprocket.',
          data: respData,
        };
      }

      // Failed response from Shiprocket
      await prisma.pickupLocation.update({
        where: { id: location.id },
        data: {
          shiprocketStatus: 'FAILED',
          shiprocketResponse: respData,
        },
      });

      return {
        success: false,
        message: respData.message || 'Failed to register pickup location with Shiprocket.',
        data: respData,
      };
    } catch (error: any) {
      const errResponse = error.response?.data || {};
      const rawErrMsg =
        errResponse?.message ||
        (typeof errResponse?.errors === 'object' ? JSON.stringify(errResponse.errors) : '') ||
        error.message ||
        '';
      const errMsg = rawErrMsg.toLowerCase();

      ShiprocketLogger.error('[SHIPROCKET_ADD_PICKUP_ERROR]', undefined, {
        error: error.message,
        response: errResponse,
      });

      // ONLY treat as CONNECTED if Shiprocket explicitly confirms it already exists
      if (errMsg.includes('already exists') || errMsg.includes('already added')) {
        await prisma.pickupLocation
          .update({
            where: { id: pickupLocationId },
            data: {
              shiprocketStatus: 'CONNECTED',
              shiprocketResponse: errResponse || { note: 'Already registered on Shiprocket' },
            },
          })
          .catch(() => {});

        return {
          success: true,
          message: 'Pickup location already exists on Shiprocket and is now connected.',
          data: errResponse,
        };
      }

      let detailedMsg = errResponse.message || error.message;
      if (errResponse.errors) {
        if (typeof errResponse.errors === 'string') {
          detailedMsg += ` (${errResponse.errors})`;
        } else if (typeof errResponse.errors === 'object') {
          const errorDetails = Object.entries(errResponse.errors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('; ');
          detailedMsg += ` - ${errorDetails}`;
        }
      }

      await prisma.pickupLocation
        .update({
          where: { id: pickupLocationId },
          data: {
            shiprocketStatus: 'FAILED',
            shiprocketResponse: {
              ...(typeof errResponse === 'object' ? errResponse : {}),
              message: detailedMsg,
              error: error.message,
            },
          },
        })
        .catch(() => {});

      return {
        success: false,
        message: detailedMsg || 'Error registering pickup location with Shiprocket.',
        data: errResponse,
      };
    }
  }

  /**
   * Syncs and registers pickup locations for all shops in the database.
   */
  static async syncAllShopPickupLocations(): Promise<{
    success: boolean;
    totalShops: number;
    synced: number;
    failed: number;
    details: Array<{ shopName: string; locationCode: string; status: string; message: string }>;
  }> {
    const shops = await prisma.shop.findMany({
      where: { deletedAt: null },
      include: { pickupLocations: true },
    });

    const results: Array<{
      shopName: string;
      locationCode: string;
      status: string;
      message: string;
    }> = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (const shop of shops) {
      let primaryLocation =
        shop.pickupLocations.find((p) => p.isPrimary) || shop.pickupLocations[0];

      // If shop has no pickup location record, create one from shop profile
      if (!primaryLocation) {
        const shopCode = shop.shopCode || `SHOP_${shop.id.slice(-6).toUpperCase()}`;
        const locationCode = `${shopCode}-PKP1`;

        primaryLocation = await prisma.pickupLocation.create({
          data: {
            shopId: shop.id,
            locationCode,
            name: `${shop.name} Warehouse`,
            addressLine1: shop.fullAddress || 'Main Market Road',
            city: shop.city || 'Hisar',
            state: shop.state || 'Haryana',
            pincode: shop.pincode || '125001',
            country: 'India',
            contactName: shop.bankAccountHolder || shop.name || 'Store Manager',
            contactPhone: shop.phone || '9991983125',
            contactEmail: shop.email || 'seller@navyacollection.store',
            isPrimary: true,
            status: 'ACTIVE',
            shiprocketPickupName: locationCode,
            shiprocketStatus: 'PENDING',
          },
        });
      }

      // Register with Shiprocket
      const regRes = await this.registerWithShiprocket(primaryLocation.id);
      if (regRes.success) {
        syncedCount++;
        results.push({
          shopName: shop.name,
          locationCode: primaryLocation.locationCode,
          status: 'CONNECTED',
          message: regRes.message,
        });
      } else {
        failedCount++;
        results.push({
          shopName: shop.name,
          locationCode: primaryLocation.locationCode,
          status: 'FAILED',
          message: regRes.message,
        });
      }
    }

    return {
      success: failedCount === 0,
      totalShops: shops.length,
      synced: syncedCount,
      failed: failedCount,
      details: results,
    };
  }

  /**
   * Syncs and registers the pickup location for a single shop in the database.
   */
  static async syncShopPickupLocation(shopId: string): Promise<{
    success: boolean;
    message: string;
    pickupLocation?: any;
    data?: any;
  }> {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { pickupLocations: true, owner: true, sellerProfile: true },
    });

    if (!shop) {
      return { success: false, message: 'Shop not found.' };
    }

    let primaryLocation = shop.pickupLocations.find((p) => p.isPrimary) || shop.pickupLocations[0];

    const contactName =
      shop.owner?.name ||
      shop.bankAccountHolder ||
      shop.pickupLocations?.[0]?.contactName ||
      shop.sellerProfile?.legalName ||
      shop.name ||
      'Store Manager';

    if (primaryLocation) {
      primaryLocation = await prisma.pickupLocation.update({
        where: { id: primaryLocation.id },
        data: {
          name: `${shop.name} Hub`,
          addressLine1: shop.fullAddress || primaryLocation.addressLine1 || 'Main Market Road',
          city: shop.city || primaryLocation.city || 'Hisar',
          state: shop.state || primaryLocation.state || 'Haryana',
          pincode: shop.pincode || primaryLocation.pincode || '125001',
          contactName,
          contactPhone:
            shop.phone || shop.owner?.mobile || primaryLocation.contactPhone || '9991983125',
          contactEmail:
            shop.email ||
            shop.owner?.email ||
            primaryLocation.contactEmail ||
            'seller@navyacollection.store',
        },
      });
    } else {
      const shopCode = shop.shopCode || `SHOP_${shop.id.slice(-6).toUpperCase()}`;
      const locationCode = `${shopCode}-PKP1`;

      primaryLocation = await prisma.pickupLocation.create({
        data: {
          shopId: shop.id,
          locationCode,
          name: `${shop.name} Hub`,
          addressLine1: shop.fullAddress || 'Main Market Road',
          city: shop.city || 'Hisar',
          state: shop.state || 'Haryana',
          pincode: shop.pincode || '125001',
          country: 'India',
          contactName,
          contactPhone: shop.phone || shop.owner?.mobile || '9991983125',
          contactEmail: shop.email || shop.owner?.email || 'seller@navyacollection.store',
          isPrimary: true,
          status: 'ACTIVE',
          shiprocketPickupName: locationCode,
          shiprocketStatus: 'PENDING',
        },
      });
    }

    const regRes = await this.registerWithShiprocket(primaryLocation.id);
    return {
      success: regRes.success,
      message: regRes.message,
      pickupLocation: primaryLocation,
      data: regRes.data,
    };
  }

  /**
   * Creates a new branch pickup location for a seller shop and registers it.
   */
  static async createPickupLocation(input: CreatePickupLocationInput) {
    const shop = await prisma.shop.findUnique({
      where: { id: input.shopId },
      include: { pickupLocations: true },
    });

    if (!shop) {
      throw new Error('Shop not found.');
    }

    const shopCode = shop.shopCode || `NAVYA-SHOP-${shop.id.slice(-6).toUpperCase()}`;
    const nextIndex = (shop.pickupLocations?.length || 0) + 1;
    const locationCode = `${shopCode}-PKP${nextIndex}`;

    // If marked as primary, reset existing primary locations
    if (input.isPrimary) {
      await prisma.pickupLocation.updateMany({
        where: { shopId: input.shopId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const pickupLocation = await prisma.pickupLocation.create({
      data: {
        shopId: input.shopId,
        locationCode,
        name: input.name,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        country: input.country || 'India',
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail,
        isPrimary: input.isPrimary ?? shop.pickupLocations.length === 0,
        status: 'ACTIVE',
        shiprocketPickupName: locationCode,
        shiprocketStatus: 'PENDING',
      },
    });

    // Attempt background registration with Shiprocket
    this.registerWithShiprocket(pickupLocation.id).catch((err) => {
      console.warn('[BACKGROUND_PICKUP_REGISTRATION_FAILED]', err);
    });

    return pickupLocation;
  }
}
