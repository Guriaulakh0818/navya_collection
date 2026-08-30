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

      const shiprocketPickupName = location.locationCode;

      const payload = {
        pickup_location: shiprocketPickupName,
        name: location.contactName || location.name,
        email: location.contactEmail || location.shop.email || 'seller@navyacollection.store',
        phone: location.contactPhone || location.shop.phone,
        address: location.addressLine1,
        address_2: location.addressLine2 || '',
        city: location.city,
        state: location.state,
        country: location.country || 'India',
        pin_code: location.pincode,
      };

      ShiprocketLogger.info(
        `[SHIPROCKET_ADD_PICKUP_REQUEST] Registering: ${shiprocketPickupName}`,
        undefined,
        payload,
      );

      const response = await shiprocketClient.post('/settings/company/addpickup', payload);

      if (response.status === 200 || response.status === 201) {
        await prisma.pickupLocation.update({
          where: { id: location.id },
          data: {
            shiprocketPickupName,
            shiprocketStatus: 'CONNECTED',
            shiprocketResponse: response.data,
          },
        });

        // Also update primary pickup name on Shop for quick lookup
        if (location.isPrimary) {
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
      ShiprocketLogger.error('[SHIPROCKET_ADD_PICKUP_ERROR]', undefined, {
        error: error.message,
        response: error.response?.data,
      });

      await prisma.pickupLocation
        .update({
          where: { id: pickupLocationId },
          data: {
            shiprocketStatus: 'FAILED',
            shiprocketResponse: error.response?.data || { error: error.message },
          },
        })
        .catch(() => {});

      return {
        success: false,
        message:
          error.response?.data?.message || error.message || 'Error registering pickup location.',
      };
    }
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
