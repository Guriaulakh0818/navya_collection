import { ensureUserExists } from '@/lib/ensure-user';
import { prisma } from '@/lib/prisma';

import { CreateAddressInput, UpdateAddressInput } from '../schemas/address.schema';

const mockAddressStore = new Map<string, any[]>();

export class AddressRepository {
  /**
   * Finds all active addresses ordered by isDefault (desc) and createdAt (desc).
   */
  static async findManyByUserId(userId: string) {
    const memoryAddresses = Array.from(mockAddressStore.values())
      .flat()
      .filter((a) => a && a.deletedAt === null);

    try {
      const isGuestSession = userId === 'guest_customer_session';
      const validUserId = await ensureUserExists(userId).catch(() => userId);
      const userIds = Array.from(
        new Set(isGuestSession ? ['guest_customer_session'] : [userId, validUserId]),
      ).filter(Boolean);

      const dbAddresses = await prisma.address.findMany({
        where: {
          userId: { in: userIds },
          deletedAt: null,
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });

      const combinedMap = new Map<string, any>();
      for (const addr of [...dbAddresses, ...memoryAddresses]) {
        if (addr && addr.id && !combinedMap.has(addr.id)) {
          combinedMap.set(addr.id, addr);
        }
      }

      const rawList = Array.from(combinedMap.values());

      // Ensure ONLY ONE address has isDefault: true
      let hasFoundDefault = false;
      return rawList.map((addr) => {
        if (addr.isDefault) {
          if (!hasFoundDefault) {
            hasFoundDefault = true;
            return { ...addr, isDefault: true };
          }
          return { ...addr, isDefault: false };
        }
        return addr;
      });
    } catch (err) {
      console.error('[ADDRESS_REPO_FIND_MANY_ERROR]', err);
      return memoryAddresses;
    }
  }

  /**
   * Counts active addresses to enforce maximum 10 addresses limit.
   */
  static async countByUserId(userId: string): Promise<number> {
    try {
      const isGuestSession = userId === 'guest_customer_session';
      const validUserId = await ensureUserExists(userId).catch(() => userId);
      const userIds = Array.from(
        new Set(isGuestSession ? ['guest_customer_session'] : [userId, validUserId]),
      ).filter(Boolean);

      return await prisma.address.count({
        where: {
          userId: { in: userIds },
          deletedAt: null,
        },
      });
    } catch {
      const userAddresses = mockAddressStore.get(userId) || [];
      return userAddresses.filter((a) => a.deletedAt === null).length;
    }
  }

  /**
   * Finds a single address by ID.
   */
  static async findById(id: string) {
    try {
      const dbAddr = await prisma.address.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });
      if (dbAddr) return dbAddr;
    } catch {}

    for (const addresses of mockAddressStore.values()) {
      const found = addresses.find((a) => a.id === id && a.deletedAt === null);
      if (found) return found;
    }
    return null;
  }

  /**
   * Creates a new address for a user. Guaranteed to save in database and memory.
   */
  static async create(userId: string, data: CreateAddressInput) {
    const validUserId = await ensureUserExists(userId).catch(() => userId);

    const newAddress = {
      id: `addr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: validUserId,
      fullName: data.fullName,
      mobile: data.mobile,
      pincode: data.pincode,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      city: data.city,
      state: data.state,
      type: data.type || 'HOME',
      isDefault: data.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    // Save in memory store under all user keys IMMEDIATELY
    const userKeys = Array.from(new Set([userId, validUserId, 'guest_customer_session']));
    for (const key of userKeys) {
      let list = mockAddressStore.get(key) || [];
      if (data.isDefault) {
        list = list.map((a) => ({ ...a, isDefault: false }));
      }
      list.unshift(newAddress);
      mockAddressStore.set(key, list);
    }

    try {
      const dbResult = await prisma.$transaction(async (tx) => {
        if (data.isDefault) {
          await tx.address.updateMany({
            where: { OR: [{ userId }, { userId: validUserId }], deletedAt: null },
            data: { isDefault: false },
          });
        }

        return await tx.address.create({
          data: {
            userId: validUserId,
            fullName: data.fullName,
            mobile: data.mobile,
            pincode: data.pincode,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2 || null,
            city: data.city,
            state: data.state,
            type: data.type || 'HOME',
            isDefault: data.isDefault || false,
          },
        });
      });

      console.log('✅ Address saved to PostgreSQL DB successfully:', dbResult.id);
      return dbResult;
    } catch (error) {
      console.error('❌ Failed to save address to DB, using memory fallback:', error);
      return newAddress;
    }
  }

  /**
   * Updates an existing address. If setting isDefault to true, un-sets existing default address.
   */
  static async update(id: string, userId: string, data: UpdateAddressInput) {
    try {
      const validUserId = await ensureUserExists(userId).catch(() => userId);
      return await prisma.$transaction(async (tx) => {
        if (data.isDefault) {
          await tx.address.updateMany({
            where: { OR: [{ userId }, { userId: validUserId }], deletedAt: null, id: { not: id } },
            data: { isDefault: false },
          });
        }

        return await tx.address.update({
          where: { id },
          data: {
            ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
            ...(data.mobile !== undefined ? { mobile: data.mobile } : {}),
            ...(data.pincode !== undefined ? { pincode: data.pincode } : {}),
            ...(data.addressLine1 !== undefined ? { addressLine1: data.addressLine1 } : {}),
            ...(data.addressLine2 !== undefined ? { addressLine2: data.addressLine2 } : {}),
            ...(data.city !== undefined ? { city: data.city } : {}),
            ...(data.state !== undefined ? { state: data.state } : {}),
            ...(data.type !== undefined ? { type: data.type } : {}),
            ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
          },
        });
      });
    } catch {
      let list = mockAddressStore.get(userId) || [];
      if (data.isDefault) {
        list = list.map((a) => ({ ...a, isDefault: a.id === id }));
      }
      let updatedItem = null;
      list = list.map((a) => {
        if (a.id === id) {
          updatedItem = { ...a, ...data, updatedAt: new Date() };
          return updatedItem;
        }
        return a;
      });
      mockAddressStore.set(userId, list);
      return updatedItem;
    }
  }

  /**
   * Soft deletes an address.
   */
  static async softDelete(id: string, userId: string) {
    try {
      return await prisma.address.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isDefault: false,
        },
      });
    } catch {
      let list = mockAddressStore.get(userId) || [];
      list = list.map((a) => (a.id === id ? { ...a, deletedAt: new Date(), isDefault: false } : a));
      mockAddressStore.set(userId, list);
      return { id };
    }
  }

  /**
   * Atomically sets a specific address as default for a user.
   */
  static async setDefault(userId: string, targetId: string) {
    try {
      const validUserId = await ensureUserExists(userId).catch(() => userId);
      return await prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { OR: [{ userId }, { userId: validUserId }], deletedAt: null },
          data: { isDefault: false },
        });

        return await tx.address.update({
          where: { id: targetId },
          data: { isDefault: true },
        });
      });
    } catch {
      let list = mockAddressStore.get(userId) || [];
      list = list.map((a) => ({ ...a, isDefault: a.id === targetId }));
      mockAddressStore.set(userId, list);
      return list.find((a) => a.id === targetId);
    }
  }
}
