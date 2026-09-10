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
        include: { shop: true },
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

      // Clean phone number (extract 10 digits)
      const rawPhone = location.contactPhone || location.shop?.phone || '9991983125';
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10) || '9991983125';

      const payload = {
        pickup_location: shiprocketPickupName,
        name: (location.contactName || location.name || 'Store Manager').slice(0, 50),
        email: location.contactEmail || location.shop?.email || 'seller@navyacollection.store',
        phone: cleanPhone,
        address: location.addressLine1 || location.shop?.fullAddress || 'Main Market Road',
        address_2: location.addressLine2 || '',
        city: location.city || location.shop?.city || 'Hisar',
        state: location.state || location.shop?.state || 'Haryana',
        country: location.country || 'India',
        pin_code: (location.pincode || location.shop?.pincode || '125001').trim(),
      };

      ShiprocketLogger.info(
        `[SHIPROCKET_ADD_PICKUP_REQUEST] Registering: ${shiprocketPickupName}`,
        undefined,
        payload,
      );

      const response = await shiprocketClient.post('/settings/company/addpickup', payload);
      const isSuccess = response.status === 200 || response.status === 201;
      const respMsg = (response.data?.message || response.data?.success || '')
        .toString()
        .toLowerCase();

      if (isSuccess || respMsg.includes('already') || respMsg.includes('exist')) {
        await prisma.pickupLocation.update({
          where: { id: location.id },
          data: {
            shiprocketPickupName,
            shiprocketStatus: 'CONNECTED',
            shiprocketResponse: response.data,
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
          message: 'Pickup location registered with Shiprocket successfully.',
          data: response.data,
        };
      }

      await prisma.pickupLocation.update({
        where: { id: location.id },
        data: {
          shiprocketStatus: 'FAILED',
          shiprocketResponse: response.data,
        },
      });

      return {
        success: false,
        message: response.data?.message || 'Failed to register pickup location with Shiprocket.',
        data: response.data,
      };
    } catch (error: any) {
      const errResponse = error.response?.data;
      const errMsg = (errResponse?.message || error.message || '').toLowerCase();

      ShiprocketLogger.error('[SHIPROCKET_ADD_PICKUP_ERROR]', undefined, {
        error: error.message,
        response: errResponse,
      });

      // If already registered in Shiprocket, treat as CONNECTED
      if (
        errMsg.includes('already') ||
        errMsg.includes('exist') ||
        errResponse?.status_code === 422
      ) {
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

      await prisma.pickupLocation
        .update({
          where: { id: pickupLocationId },
          data: {
            shiprocketStatus: 'FAILED',
            shiprocketResponse: errResponse || { error: error.message },
          },
        })
        .catch(() => {});

      return {
        success: false,
        message: errResponse?.message || error.message || 'Error registering pickup location.',
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

    if (!primaryLocation) {
      const shopCode = shop.shopCode || `SHOP_${shop.id.slice(-6).toUpperCase()}`;
      const locationCode = `${shopCode}-PKP1`;

      const contactName =
        shop.bankAccountHolder ||
        shop.sellerProfile?.legalName ||
        shop.owner?.name ||
        shop.name ||
        'Store Manager';

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
