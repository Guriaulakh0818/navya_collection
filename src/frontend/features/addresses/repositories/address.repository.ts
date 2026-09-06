import { ensureUserExists } from '@/lib/ensure-user';
import { prisma } from '@/lib/prisma';

import { CreateAddressInput, UpdateAddressInput } from '../schemas/address.schema';

export class AddressRepository {
  /**
   * Finds all active addresses ordered by isDefault (desc) and createdAt (desc).
   */
  static async findManyByUserId(userId: string) {
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

    // Ensure ONLY ONE address has isDefault: true
    let hasFoundDefault = false;
    return dbAddresses.map((addr) => {
      if (addr.isDefault) {
        if (!hasFoundDefault) {
          hasFoundDefault = true;
          return { ...addr, isDefault: true };
        }
        return { ...addr, isDefault: false };
      }
      return addr;
    });
  }

  /**
   * Counts active addresses to enforce maximum 10 addresses limit.
   */
  static async countByUserId(userId: string): Promise<number> {
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
  }

  /**
   * Finds a single address by ID.
   */
  static async findById(id: string) {
    return await prisma.address.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * Creates a new address for a user. Guaranteed to save in database.
   */
  static async create(userId: string, data: CreateAddressInput) {
    const validUserId = await ensureUserExists(userId).catch(() => userId);

    return await prisma.$transaction(async (tx) => {
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
  }

  /**
   * Updates an existing address. If setting isDefault to true, un-sets existing default address.
   */
  static async update(id: string, userId: string, data: UpdateAddressInput) {
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
  }

  /**
   * Soft deletes an address.
   */
  static async softDelete(id: string, _userId: string) {
    return await prisma.address.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isDefault: false,
      },
    });
  }

  /**
   * Atomically sets a specific address as default for a user.
   */
  static async setDefault(userId: string, targetId: string) {
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
  }
}
