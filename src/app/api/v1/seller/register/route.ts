import { Role, ShopStatus, SubscriptionTier, VerificationBadge } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import { createUserSession } from '@/backend/lib/session';
import { NotificationService } from '@/backend/services/notification.service';
import { prisma } from '@/lib/prisma';
import { sellerRegistrationSchema } from '@/shared/validations/seller-registration.schema';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validationResult = sellerRegistrationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { basicInfo, shopDetails, businessType, address, bankDetails, documents } =
      validationResult.data;

    // Check for existing user with email or mobile
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: basicInfo.email }, { mobile: basicInfo.mobile }],
      },
    });

    if (
      existingUser &&
      existingUser.approvalStatus === 'APPROVED' &&
      existingUser.role === Role.SELLER
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'An approved seller account with this email or mobile already exists. Please login.',
        },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(basicInfo.password, 10);

    // Generate unique slug for shop
    let baseSlug = shopDetails.shopName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) {
      baseSlug = 'seller-shop';
    }

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.shop.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    // Atomic transaction to create or update User, SellerProfile, Shop, ShopAddress, SellerDocument & System Notification
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or update User
      let user;
      if (existingUser) {
        user = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: basicInfo.fullName,
            email: basicInfo.email,
            mobile: basicInfo.mobile,
            ...(basicInfo.password ? { password: passwordHash } : {}),
            role: Role.SELLER,
            approvalStatus: 'PENDING_APPROVAL',
          },
        });
      } else {
        user = await tx.user.create({
          data: {
            name: basicInfo.fullName,
            email: basicInfo.email,
            mobile: basicInfo.mobile,
            password: passwordHash,
            role: Role.SELLER,
            approvalStatus: 'PENDING_APPROVAL',
            mustChangePassword: false,
          },
        });
      }

      // 2. Upsert SellerProfile safely
      const sellerProfile = await tx.sellerProfile.upsert({
        where: { userId: user.id },
        update: {
          businessName: shopDetails.shopName,
          legalName: businessType.legalName,
          gstin: businessType.gstin || null,
          panNumber: businessType.pan,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          businessAddress: `${address.fullAddress}${address.landmark ? `, Near ${address.landmark}` : ''}`,
          bankAccountHolder: bankDetails.accountHolderName,
          bankAccountNumber: bankDetails.accountNumber,
          bankIfscCode: bankDetails.ifscCode,
          bankName: bankDetails.bankName,
          commissionRate: 10.0,
          subscriptionTier: SubscriptionTier.STARTER,
        },
        create: {
          userId: user.id,
          businessName: shopDetails.shopName,
          legalName: businessType.legalName,
          gstin: businessType.gstin || null,
          panNumber: businessType.pan,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          businessAddress: `${address.fullAddress}${address.landmark ? `, Near ${address.landmark}` : ''}`,
          bankAccountHolder: bankDetails.accountHolderName,
          bankAccountNumber: bankDetails.accountNumber,
          bankIfscCode: bankDetails.ifscCode,
          bankName: bankDetails.bankName,
          commissionRate: 10.0,
          subscriptionTier: SubscriptionTier.STARTER,
        },
      });

      // 3. Upsert Shop safely
      const existingShop = await tx.shop.findFirst({
        where: { ownerId: user.id },
      });

      let shop;
      if (existingShop) {
        shop = await tx.shop.update({
          where: { id: existingShop.id },
          data: {
            sellerProfileId: sellerProfile.id,
            name: shopDetails.shopName,
            description: shopDetails.description,
            logo: shopDetails.logo || null,
            banner: shopDetails.banner || null,
            phone: shopDetails.phone,
            email: shopDetails.email,
            gstin: businessType.gstin || null,
            panNumber: businessType.pan,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            fullAddress: `${address.fullAddress}${address.landmark ? `, Near ${address.landmark}` : ''}`,
            bankAccountHolder: bankDetails.accountHolderName,
            bankAccountNumber: bankDetails.accountNumber,
            bankIfscCode: bankDetails.ifscCode,
            bankName: bankDetails.bankName,
            status: ShopStatus.PENDING_VERIFICATION,
          },
        });
      } else {
        shop = await tx.shop.create({
          data: {
            ownerId: user.id,
            sellerProfileId: sellerProfile.id,
            name: shopDetails.shopName,
            slug: uniqueSlug,
            description: shopDetails.description,
            logo: shopDetails.logo || null,
            banner: shopDetails.banner || null,
            phone: shopDetails.phone,
            email: shopDetails.email,
            gstin: businessType.gstin || null,
            panNumber: businessType.pan,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            fullAddress: `${address.fullAddress}${address.landmark ? `, Near ${address.landmark}` : ''}`,
            bankAccountHolder: bankDetails.accountHolderName,
            bankAccountNumber: bankDetails.accountNumber,
            bankIfscCode: bankDetails.ifscCode,
            bankName: bankDetails.bankName,
            status: ShopStatus.PENDING_VERIFICATION,
            verificationBadge: VerificationBadge.NONE,
            commissionRate: 10.0,
            subscriptionTier: SubscriptionTier.STARTER,
            rating: 0.0,
            reviewCount: 0,
          },
        });
      }

      // 4. Upsert ShopAddress
      const existingShopAddress = await tx.shopAddress.findFirst({
        where: { shopId: shop.id },
      });

      if (existingShopAddress) {
        await tx.shopAddress.update({
          where: { id: existingShopAddress.id },
          data: {
            addressLine1: address.fullAddress,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          },
        });
      } else {
        await tx.shopAddress.create({
          data: {
            shopId: shop.id,
            title: 'Primary Pickup Warehouse',
            addressLine1: address.fullAddress,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            isPrimary: true,
          },
        });
      }

      // 5. Create SellerDocuments if provided
      if (documents && (documents.gstCertificate || documents.panCard || documents.shopPhoto)) {
        if (documents.gstCertificate) {
          await tx.sellerDocument.create({
            data: {
              shopId: shop.id,
              documentType: 'GST_CERTIFICATE',
              fileUrl: documents.gstCertificate,
              status: 'PENDING',
            },
          });
        }
        if (documents.panCard) {
          await tx.sellerDocument.create({
            data: {
              shopId: shop.id,
              documentType: 'PAN_CARD',
              fileUrl: documents.panCard,
              status: 'PENDING',
            },
          });
        }
        if (documents.shopPhoto) {
          await tx.sellerDocument.create({
            data: {
              shopId: shop.id,
              documentType: 'SHOP_PHOTO',
              fileUrl: documents.shopPhoto,
              status: 'PENDING',
            },
          });
        }
      }

      return { user, shop, sellerProfile };
    });

    // Trigger Admin Email Alert and Seller Initial Notification asynchronously
    try {
      await NotificationService.notifyAdminNewSellerRegistration({
        sellerName: basicInfo.fullName,
        shopName: result.shop.name,
        mobile: basicInfo.mobile,
        email: basicInfo.email,
        city: address.city,
        state: address.state,
        submissionTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        shopId: result.shop.id,
      });

      await NotificationService.notifySellerStatusChange(
        result.user.id,
        basicInfo.email,
        result.shop.name,
        'PENDING',
      );
    } catch (notifErr) {
      console.warn('⚠️ Non-critical Notification Dispatch Warning:', notifErr);
    }

    // Create session cookie for newly registered seller
    await createUserSession({
      id: result.user.id,
      phone: result.user.mobile,
      role: Role.SELLER,
    });

    const response = NextResponse.json(
      {
        success: true,
        message:
          'Seller application submitted successfully! Your shop is currently pending admin review.',
        data: {
          userId: result.user.id,
          shopId: result.shop.id,
          shopName: result.shop.name,
          slug: result.shop.slug,
          status: result.shop.status,
          approvalStatus: result.user.approvalStatus,
        },
      },
      { status: 201 },
    );

    return response;
  } catch (error: any) {
    console.error('❌ Seller Registration API Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'An error occurred while processing your seller application.',
      },
      { status: 500 },
    );
  }
}
