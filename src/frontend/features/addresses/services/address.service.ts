import { ensureUserExists } from '@/lib/ensure-user';

import { AddressRepository } from '../repositories/address.repository';
import { CreateAddressInput, UpdateAddressInput } from '../schemas/address.schema';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}

export class AddressService {
  /**
   * Fetches all active saved addresses for a customer.
   */
  static async getAddresses(userId: string): Promise<ServiceResponse> {
    try {
      const addresses = await AddressRepository.findManyByUserId(userId);
      return {
        success: true,
        message: 'Addresses retrieved successfully.',
        statusCode: 200,
        data: addresses,
      };
    } catch (error: any) {
      console.error('[ADDRESS_SERVICE_GET_ALL_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve addresses.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches single address by ID after verifying ownership.
   */
  static async getAddressById(userId: string, addressId: string): Promise<ServiceResponse> {
    try {
      const validUserId = await ensureUserExists(userId);
      const address = await AddressRepository.findById(addressId);

      if (!address || (address.userId !== userId && address.userId !== validUserId)) {
        return {
          success: false,
          message: 'Address not found or access denied.',
          statusCode: 404,
        };
      }

      return {
        success: true,
        message: 'Address retrieved successfully.',
        statusCode: 200,
        data: address,
      };
    } catch (error: any) {
      console.error('[ADDRESS_SERVICE_GET_BY_ID_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve address details.',
        statusCode: 500,
      };
    }
  }

  /**
   * Adds a new address for a customer enforcing maximum 10 addresses limit.
   */
  static async createAddress(userId: string, input: CreateAddressInput): Promise<ServiceResponse> {
    try {
      // 1. Fetch Existing Active Addresses for User
      const existingAddresses = await AddressRepository.findManyByUserId(userId);

      // 2. Check Maximum Address Limit (10 per customer)
      if (existingAddresses.length >= 10) {
        return {
          success: false,
          message:
            'Maximum limit of 10 saved addresses reached. Please delete an existing address before adding a new one.',
          statusCode: 400,
        };
      }

      // 3. Duplicate Address Check (line1, pincode, city)
      const targetType = (input.type || 'HOME').toUpperCase();
      const cleanLine1 = input.addressLine1.trim().toLowerCase();
      const cleanPincode = input.pincode.trim();
      const cleanCity = input.city.trim().toLowerCase();

      const isDuplicate = existingAddresses.some((addr) => {
        const addrLine1 = (addr.addressLine1 || '').trim().toLowerCase();
        const addrPincode = (addr.pincode || '').trim();
        const addrCity = (addr.city || '').trim().toLowerCase();
        return addrLine1 === cleanLine1 && addrPincode === cleanPincode && addrCity === cleanCity;
      });

      if (isDuplicate) {
        return {
          success: false,
          message: 'This address already exists in your saved addresses list.',
          statusCode: 400,
        };
      }

      // 4. Label Limits: Max 1 HOME, Max 1 WORK
      if (targetType === 'HOME') {
        const hasHome = existingAddresses.some((a) => (a.type || 'HOME').toUpperCase() === 'HOME');
        if (hasHome) {
          return {
            success: false,
            message:
              'You can only save 1 Home address. Please edit your existing Home address or select a different label (Work or Other).',
            statusCode: 400,
          };
        }
      }

      if (targetType === 'WORK') {
        const hasWork = existingAddresses.some((a) => (a.type || '').toUpperCase() === 'WORK');
        if (hasWork) {
          return {
            success: false,
            message:
              'You can only save 1 Work address. Please edit your existing Work address or select a different label (Other).',
            statusCode: 400,
          };
        }
      }

      // 5. If first address, auto-promote to Default
      const isFirstAddress = existingAddresses.length === 0;
      const validLabel = (
        targetType === 'WORK' ? 'WORK' : targetType === 'OTHER' ? 'OTHER' : 'HOME'
      ) as 'HOME' | 'WORK' | 'OTHER';
      const finalInput = {
        ...input,
        type: validLabel,
        isDefault: input.isDefault || isFirstAddress,
      };

      const newAddress = await AddressRepository.create(userId, finalInput);

      return {
        success: true,
        message: 'Address added successfully.',
        statusCode: 201,
        data: newAddress,
      };
    } catch (error: any) {
      console.error('[ADDRESS_SERVICE_CREATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to add address.',
        statusCode: 500,
      };
    }
  }

  /**
   * Updates an existing address after verifying ownership.
   */
  static async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput,
  ): Promise<ServiceResponse> {
    try {
      const validUserId = await ensureUserExists(userId).catch(() => userId);
      const existing = await AddressRepository.findById(addressId);
      const allowedUserIds = new Set([userId, validUserId, 'guest_customer_session']);

      if (!existing || !allowedUserIds.has(existing.userId)) {
        return {
          success: false,
          message: 'Address not found or access denied.',
          statusCode: 404,
        };
      }

      if (input.type) {
        const targetType = input.type.toUpperCase();
        const existingAddresses = await AddressRepository.findManyByUserId(userId);

        if (targetType === 'HOME') {
          const hasOtherHome = existingAddresses.some(
            (a) => a.id !== addressId && (a.type || 'HOME').toUpperCase() === 'HOME',
          );
          if (hasOtherHome) {
            return {
              success: false,
              message:
                'You can only save 1 Home address. Please edit your existing Home address or select a different label.',
              statusCode: 400,
            };
          }
        }

        if (targetType === 'WORK') {
          const hasOtherWork = existingAddresses.some(
            (a) => a.id !== addressId && (a.type || '').toUpperCase() === 'WORK',
          );
          if (hasOtherWork) {
            return {
              success: false,
              message:
                'You can only save 1 Work address. Please edit your existing Work address or select a different label.',
              statusCode: 400,
            };
          }
        }
      }

      const updatedAddress = await AddressRepository.update(addressId, userId, input);

      return {
        success: true,
        message: 'Address updated successfully.',
        statusCode: 200,
        data: updatedAddress,
      };
    } catch (error: any) {
      console.error('[ADDRESS_SERVICE_UPDATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to update address.',
        statusCode: 500,
      };
    }
  }

  /**
   * Soft deletes an address after verifying ownership. Auto-promotes next address to default if needed.
   */
  static async deleteAddress(userId: string, addressId: string): Promise<ServiceResponse> {
    try {
      const validUserId = await ensureUserExists(userId).catch(() => userId);
      const existing = await AddressRepository.findById(addressId);
      const allowedUserIds = new Set([userId, validUserId, 'guest_customer_session']);

      if (!existing || !allowedUserIds.has(existing.userId)) {
        return {
          success: false,
          message: 'Address not found or access denied.',
          statusCode: 404,
        };
      }

      const wasDefault = existing.isDefault;
      await AddressRepository.softDelete(addressId, userId);

      // If deleted address was default, auto-promote next available active address
      if (wasDefault) {
        const remaining = await AddressRepository.findManyByUserId(userId);
        if (remaining.length > 0) {
          await AddressRepository.setDefault(userId, remaining[0].id);
        }
      }

      return {
        success: true,
        message: 'Address deleted successfully.',
        statusCode: 200,
      };
    } catch (error: any) {
      console.error('[ADDRESS_SERVICE_DELETE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to delete address.',
        statusCode: 500,
      };
    }
  }

  /**
   * Sets a specific address as default for a customer.
   */
  static async setDefaultAddress(userId: string, addressId: string): Promise<ServiceResponse> {
    try {
      const validUserId = await ensureUserExists(userId).catch(() => userId);
      const existing = await AddressRepository.findById(addressId);
      const allowedUserIds = new Set([userId, validUserId, 'guest_customer_session']);

      if (!existing || !allowedUserIds.has(existing.userId)) {
        return {
          success: false,
          message: 'Address not found or access denied.',
          statusCode: 404,
        };
      }

      const updatedDefault = await AddressRepository.setDefault(userId, addressId);

      return {
        success: true,
        message: 'Default address updated successfully.',
        statusCode: 200,
        data: updatedDefault,
      };
    } catch (error: any) {
      console.error('[ADDRESS_SERVICE_SET_DEFAULT_ERROR]', error);
      return {
        success: false,
        message: 'Failed to set default address.',
        statusCode: 500,
      };
    }
  }
}
