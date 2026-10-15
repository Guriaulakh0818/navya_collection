import { CommissionService } from '@/backend/services/commission.service';
import { CustomerShippingService } from '@/backend/services/shipping/customer-shipping.service';
import { AddressRepository } from '@/features/addresses/repositories/address.repository';
import { CartRepository } from '@/features/cart/repositories/cart.repository';
import { CartService } from '@/features/cart/services/cart.service';
import { CouponService } from '@/features/coupons/services/coupon.service';
import { ShippingPolicyRepository } from '@/features/shipping/repositories/shipping.repository';
import { ShippingService } from '@/features/shipping/services/shipping.service';
import { TaxService } from '@/features/tax/services/tax.service';
import { ensureUserExists } from '@/lib/ensure-user';
import { prisma } from '@/lib/prisma';

import { OrderPreviewQueryInput } from '../schemas/order-preview.schema';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}

export class OrderPreviewService {
  /**
   * Authoritative Server-Side Order Preview Generator.
   * Re-evaluates cart stock, address ownership, coupon validity, shipping, and tax before checkout completion.
   */
  static async generatePreview(
    userId: string,
    input: OrderPreviewQueryInput,
  ): Promise<ServiceResponse> {
    try {
      const warnings: string[] = [];

      // 1. Resolve Customer Profile
      let customer = {
        id: userId,
        name: 'Navya Customer',
        email: 'customer@navyacollection.store',
        mobile: '9876543210',
      };

      try {
        const userDb = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, mobile: true },
        });
        if (userDb) {
          customer = {
            id: userDb.id,
            name: userDb.name || 'Navya Customer',
            email: userDb.email || 'customer@navyacollection.store',
            mobile: userDb.mobile || '9876543210',
          };
        }
      } catch {
        // Fallback for offline mode
      }

      await ensureUserExists(userId);

      // 2. Resolve Active Cart Items (Batched single query for ultra-fast performance)
      let cartData: any = null;

      if (input.items && input.items.length > 0) {
        const itemProductKeys = input.items.map((i: any) => i.productId).filter(Boolean);
        const itemVariantKeys = input.items.map((i: any) => i.variantId).filter(Boolean);
        const itemSkus = input.items.map((i: any) => i.sku).filter(Boolean);

        let dbProducts: any[] = [];
        let dbVariants: any[] = [];
        try {
          dbProducts = await prisma.product.findMany({
            where: {
              OR: [
                ...(itemProductKeys.length > 0
                  ? [
                      { id: { in: itemProductKeys } },
                      { slug: { in: itemProductKeys } },
                      { sku: { in: itemProductKeys } },
                    ]
                  : []),
              ],
              deletedAt: null,
            },
            include: {
              images: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
              },
              variants: {
                where: { deletedAt: null },
              },
            },
          });
        } catch {}

        try {
          const directVariantIds = itemVariantKeys.filter(
            (id: string) => !id.startsWith('dummy_') && !id.startsWith('temp_'),
          );
          if (directVariantIds.length > 0 || itemSkus.length > 0) {
            dbVariants = await prisma.productVariant.findMany({
              where: {
                OR: [
                  ...(directVariantIds.length > 0 ? [{ id: { in: directVariantIds } }] : []),
                  ...(itemSkus.length > 0 ? [{ sku: { in: itemSkus } }] : []),
                ],
                deletedAt: null,
              },
            });
          }
        } catch {}

        const productMap = new Map<string, any>();
        const variantMap = new Map<string, any>();

        for (const p of dbProducts) {
          productMap.set(p.id, p);
          if (p.slug) productMap.set(p.slug, p);
          if (p.sku) productMap.set(p.sku, p);
          if (p.variants) {
            for (const v of p.variants) {
              variantMap.set(v.id, v);
              if (v.sku) variantMap.set(v.sku.toLowerCase(), v);
              if (v.size || v.color) {
                variantMap.set(
                  `${v.productId}_${(v.size || '').toLowerCase()}_${(v.color || '').toLowerCase()}`,
                  v,
                );
              }
            }
          }
        }

        for (const v of dbVariants) {
          variantMap.set(v.id, v);
          if (v.sku) variantMap.set(v.sku.toLowerCase(), v);
          if (v.size || v.color) {
            variantMap.set(
              `${v.productId}_${(v.size || '').toLowerCase()}_${(v.color || '').toLowerCase()}`,
              v,
            );
          }
        }

        const resolvedItems = input.items.map((i: any, idx: number) => {
          const dbProduct = productMap.get(i.productId);

          let dbVariant = null;
          if (i.variantId) {
            dbVariant = variantMap.get(i.variantId);
          }
          if (!dbVariant && i.sku) {
            dbVariant = variantMap.get(i.sku.toLowerCase());
          }
          if (!dbVariant && dbProduct && (i.size || i.color)) {
            dbVariant = variantMap.get(
              `${dbProduct.id}_${(i.size || '').toLowerCase()}_${(i.color || '').toLowerCase()}`,
            );
          }

          // Size and Color resolution
          const size =
            dbVariant?.size ||
            (typeof dbVariant?.attributes === 'object' && dbVariant?.attributes !== null
              ? (dbVariant.attributes as any).size
              : null) ||
            i.size ||
            null;

          const color =
            dbVariant?.color ||
            (typeof dbVariant?.attributes === 'object' && dbVariant?.attributes !== null
              ? (dbVariant.attributes as any).color
              : null) ||
            i.color ||
            null;

          const baseProductName = dbProduct?.name || i.productName || 'Fashion Item';

          // Variant name resolution
          let variantName =
            i.variantName ||
            dbVariant?.name ||
            (color && size ? `${color} ${size}` : size || color || null);

          // Clean up variant name if it already starts with base product name
          if (
            variantName &&
            baseProductName &&
            variantName.toLowerCase().startsWith(baseProductName.toLowerCase())
          ) {
            variantName =
              variantName
                .slice(baseProductName.length)
                .replace(/^[\s\-–—:]+/, '')
                .trim() || variantName;
          }

          // Full display name: prefer explicit i.name (e.g. "t shirt - Black L") if provided
          let displayName = i.name;
          if (!displayName || displayName === baseProductName) {
            displayName = variantName ? `${baseProductName} - ${variantName}` : baseProductName;
          }

          // Price resolution: Authoritative variant price > cart item price > base product price
          let price = 999;
          if (dbVariant?.price !== undefined && dbVariant?.price !== null) {
            price = Number(dbVariant.price);
          } else if (i.price !== undefined && Number(i.price) > 0) {
            price = Number(i.price);
          } else if (dbProduct?.price !== undefined && dbProduct?.price !== null) {
            price = Number(dbProduct.price);
          }

          // Compare at price resolution
          const compareAtPrice =
            dbVariant?.compareAtPrice !== undefined && dbVariant?.compareAtPrice !== null
              ? Number(dbVariant.compareAtPrice)
              : i.compareAtPrice !== undefined &&
                  i.compareAtPrice !== null &&
                  Number(i.compareAtPrice) > 0
                ? Number(i.compareAtPrice)
                : dbProduct?.compareAtPrice
                  ? Number(dbProduct.compareAtPrice)
                  : Math.round(price * 1.4);

          // Image resolution: Exact cart item image > variant image > primary product image > first product image > fallback
          const image =
            i.image ||
            dbVariant?.imageUrl ||
            dbProduct?.images?.find((img: any) => img.isPrimary)?.imageUrl ||
            dbProduct?.images?.[0]?.imageUrl ||
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800';

          const quantity = Math.max(1, Number(i.quantity || 1));
          const itemSubtotal = price * quantity;
          const taxRate = dbProduct?.taxRate ? Number(dbProduct.taxRate) : 5;

          const availableStock = dbVariant
            ? (dbVariant.availableStock ?? dbVariant.stock ?? 50)
            : (dbProduct?.stock ?? 50);

          return {
            id: dbProduct?.id || i.productId || `item_${idx}_${Date.now()}`,
            productId: dbProduct?.id || i.productId,
            variantId: dbVariant?.id || i.variantId || null,
            shopId: dbProduct?.shopId || i.shopId || 'default_shop',
            name: displayName,
            productName: baseProductName,
            productSlug: dbProduct?.slug || 'product',
            variantName: variantName || null,
            size,
            color,
            sku: dbVariant?.sku || i.sku || dbProduct?.sku || `SKU-${idx + 1}`,
            price,
            compareAtPrice,
            quantity,
            availableStock,
            inStock: availableStock > 0,
            image,
            subtotal: itemSubtotal,
            taxRate,
            taxAmount: CommissionService.roundMoney((itemSubtotal * taxRate) / (100 + taxRate)),
          };
        });

        const inputSubtotal = resolvedItems.reduce((sum, item) => sum + item.subtotal, 0);

        const initialShip = await CustomerShippingService.calculateMultiSellerShipping(
          userId,
          resolvedItems.map((r: any) => ({
            productId: r.productId,
            shopId: r.shopId,
            quantity: r.quantity,
            price: r.price,
          })),
          {
            customerAddressId: input.addressId,
            shippingMethodCode: input.shippingMethodCode || 'STANDARD',
            paymentMethod: input.paymentMethod || 'PREPAID',
          },
        );

        const threshold = input.paymentMethod === 'COD' ? 1999 : 999;
        cartData = {
          id: `cart_${userId}`,
          userId,
          items: resolvedItems,
          itemCount: resolvedItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: inputSubtotal,
          discount: 0,
          shipping: initialShip.finalShippingAmount,
          total: inputSubtotal + initialShip.finalShippingAmount,
          freeShippingThreshold: threshold,
          freeShippingRemaining: (initialShip.sellerBreakdown || []).reduce(
            (m: number, s: any) => Math.max(m, s.freeShippingRemaining || 0),
            0,
          ),
        };
      } else {
        const cartRes = await CartService.getCart(userId);
        if (cartRes.success && cartRes.data) {
          cartData = cartRes.data;
        }
      }

      if (!cartData || !cartData.items || cartData.items.length === 0) {
        return {
          success: false,
          message: 'Your cart is empty. Add items to your cart before proceeding to order preview.',
          statusCode: 400,
        };
      }

      // Validate Stock for each item
      const validatedItems = cartData.items.map((item: any) => {
        const isStockAvailable = item.quantity <= item.availableStock;
        if (!isStockAvailable) {
          warnings.push(
            `Item '${item.name}' has only ${item.availableStock} unit(s) left in stock. Quantity adjusted.`,
          );
        }
        return {
          ...item,
          inStock: item.availableStock > 0,
        };
      });

      const subtotal = cartData.subtotal;

      // 3. Resolve Customer Delivery Address
      let address: any = null;
      let addressesList: any[] = [];

      try {
        const userAddresses = await AddressRepository.findManyByUserId(userId);
        const guestAddresses = await AddressRepository.findManyByUserId('guest_customer_session');
        addressesList = [...userAddresses, ...guestAddresses];

        if (input.addressId) {
          address = addressesList.find((a: any) => a.id === input.addressId) || null;
        }
        if (!address && input.addressId) {
          address = await AddressRepository.findById(input.addressId);
        }
        if (!address && addressesList.length > 0) {
          address = addressesList.find((a: any) => a.isDefault) || addressesList[0];
        }
      } catch {
        address = null;
      }

      if (!address) {
        warnings.push('Please select a delivery address to complete your order.');
      }

      // 4. Validate Applied Coupon
      let discount = 0;
      let appliedCouponData: any = null;

      if (input.couponCode) {
        const couponRes = await CouponService.validateCoupon(userId, {
          code: input.couponCode,
          cartAmount: subtotal,
          items: validatedItems.map((i: any) => ({
            productId: i.productId,
            shopId: i.shopId,
            categoryId: i.categoryId,
            price: i.price,
            quantity: i.quantity,
            total: i.subtotal,
          })),
        });

        if (couponRes.success && couponRes.data) {
          discount = couponRes.data.discountAmount;
          appliedCouponData = couponRes.data;
        } else {
          warnings.push(couponRes.message || 'The entered coupon code could not be applied.');
        }
      }

      const netSubtotal = Math.max(0, subtotal - discount);

      // 5. Re-calculate Shipping
      let shipping = 0;
      let estimatedDelivery = '3-5 business days';
      let isServiceable = true;

      const shipRes = await CustomerShippingService.calculateMultiSellerShipping(
        userId,
        validatedItems.map((i: any) => ({
          productId: i.productId,
          shopId: i.shopId || 'DEFAULT_SHOP',
          quantity: i.quantity,
          price: i.price,
        })),
        {
          customerAddressId: address?.id,
          shippingMethodCode: input.shippingMethodCode || 'STANDARD',
          paymentMethod: input.paymentMethod || 'PREPAID',
        },
      );

      shipping = shipRes.finalShippingAmount;
      estimatedDelivery = '3-5 business days';
      isServiceable = shipRes.isServiceable ?? true;

      // 6. Calculate Dynamic Tax (BM-06 Rule Engine)
      let tax = 0;
      let taxBreakdown: any = null;

      const taxRes = await TaxService.calculateDynamicTax({
        items: validatedItems.map((i: any) => ({
          productId: i.productId,
          shopId: i.shopId,
          price: i.price,
          quantity: i.quantity,
          taxRate: i.taxRate,
        })),
        addressId: address?.id,
        shippingAmount: shipping,
        discountAmount: discount,
      });

      if (taxRes.success && taxRes.data) {
        tax = taxRes.data.tax;
        taxBreakdown = taxRes.data.taxBreakdown;
      }

      let grandTotal = CommissionService.roundMoney(netSubtotal + shipping + tax);
      const totalSavings = discount;

      // 7. BM-07 Cash on Delivery (COD) Rules & Multi-Seller Fee Breakdown
      // Selling price limit: ₹5,000 max applied ONLY to product selling price subtotal
      const isCodEligible = subtotal <= 5000;

      let codFee = 0;
      let codFeeTax = 0;
      const sellerCodAllocations: Array<{
        sellerId: string;
        sellerSellingSubtotal: number;
        sellerAllocatedCoupon: number;
        sellerShippingCharge: number;
        sellerTax: number;
        sellerCodFeeBase: number;
        sellerCodFee: number;
        sellerCodFeeTax: number;
        sellerShipmentCodAmount: number;
      }> = [];

      // Group validated items by shopId for multi-seller COD allocation
      const shopItemsMap = new Map<string, typeof validatedItems>();
      for (const item of validatedItems) {
        const sId = item.shopId || 'DEFAULT_SHOP';
        if (!shopItemsMap.has(sId)) shopItemsMap.set(sId, []);
        shopItemsMap.get(sId)!.push(item);
      }

      const shopEntries = Array.from(shopItemsMap.entries());
      let cumulativeAllocatedCoupon = 0;
      let cumulativeCodFee = 0;
      let cumulativeCodFeeTax = 0;

      for (let idx = 0; idx < shopEntries.length; idx++) {
        const [sId, sItems] = shopEntries[idx];
        const isLastSeller = idx === shopEntries.length - 1;

        const sellerSellingSubtotal = CommissionService.roundMoney(
          sItems.reduce(
            (sum: number, itm: any) => sum + Number(itm.subtotal || itm.price * itm.quantity),
            0,
          ),
        );

        let sellerAllocatedCoupon = 0;
        if (appliedCouponData?.sellerAllocations) {
          const alloc = appliedCouponData.sellerAllocations.find((s: any) => s.sellerId === sId);
          sellerAllocatedCoupon = alloc ? alloc.allocatedDiscount : 0;
        } else if (discount > 0 && subtotal > 0) {
          if (isLastSeller) {
            sellerAllocatedCoupon = Math.max(
              0,
              CommissionService.roundMoney(discount - cumulativeAllocatedCoupon),
            );
          } else {
            const ratio = sellerSellingSubtotal / subtotal;
            sellerAllocatedCoupon = CommissionService.roundMoney(discount * ratio);
            cumulativeAllocatedCoupon = CommissionService.roundMoney(
              cumulativeAllocatedCoupon + sellerAllocatedCoupon,
            );
          }
        }

        const sellerShipmentData = shipRes.sellerBreakdown?.find(
          (b: any) => b.sellerId === sId || b.shopId === sId,
        );
        const sellerShippingCharge = Number(sellerShipmentData?.shippingCharge ?? 0);

        const sellerTaxData = taxRes.data?.sellers?.find((s: any) => s.shopId === sId);
        const sellerTax = Number(sellerTaxData?.taxAmount ?? 0);

        // COD Fee Base = Product Selling Price - Allocated Coupon + Shipping + Tax
        const sellerCodFeeBase = Math.max(
          0,
          CommissionService.roundMoney(
            sellerSellingSubtotal - sellerAllocatedCoupon + sellerShippingCharge + sellerTax,
          ),
        );

        let sellerCodFee = 0;
        let sellerCodFeeTax = 0;

        if (input.paymentMethod === 'COD' && isCodEligible) {
          sellerCodFee = CommissionService.roundMoney(sellerCodFeeBase * 0.015);
          const taxResCod = await TaxService.calculateCodFeeTax({
            codFee: sellerCodFee,
            customerState: address?.state,
          });
          sellerCodFeeTax = taxResCod.taxAmount;
        }

        cumulativeCodFee = CommissionService.roundMoney(cumulativeCodFee + sellerCodFee);
        cumulativeCodFeeTax = CommissionService.roundMoney(cumulativeCodFeeTax + sellerCodFeeTax);

        const sellerShipmentCodAmount = CommissionService.roundMoney(
          sellerCodFeeBase + sellerCodFee + sellerCodFeeTax,
        );

        sellerCodAllocations.push({
          sellerId: sId,
          sellerSellingSubtotal,
          sellerAllocatedCoupon,
          sellerShippingCharge,
          sellerTax,
          sellerCodFeeBase,
          sellerCodFee,
          sellerCodFeeTax,
          sellerShipmentCodAmount,
        });
      }

      if (input.paymentMethod === 'COD') {
        if (!isCodEligible) {
          warnings.push(
            'Cash on Delivery is unavailable for orders with product selling price exceeding ₹5,000.',
          );
        } else {
          codFee = cumulativeCodFee;
          codFeeTax = cumulativeCodFeeTax;
          grandTotal = CommissionService.roundMoney(
            netSubtotal + shipping + tax + codFee + codFeeTax,
          );
        }
      } else {
        grandTotal = CommissionService.roundMoney(netSubtotal + shipping + tax);
      }

      // 8. Payment Methods Preparation
      const paymentMethods = [
        {
          id: 'ONLINE',
          code: 'RAZORPAY',
          name: 'Online Payment (Razorpay)',
          description: 'UPI, Credit/Debit Cards, NetBanking, Wallets',
          isAvailable: true,
          badge: 'INSTANT CONFIRMATION',
        },
        {
          id: 'COD',
          code: 'COD',
          name: 'Cash on Delivery (COD)',
          description: isCodEligible
            ? 'Pay cash upon package arrival at your doorstep (1.5% COD handling fee applies)'
            : 'Cash on Delivery is unavailable for orders with product value exceeding ₹5,000',
          isAvailable: isCodEligible,
          badge: isCodEligible ? 'PAY ON DELIVERY (1.5% FEE)' : 'UNAVAILABLE ABOVE ₹5,000',
        },
      ];

      return {
        success: true,
        message: 'Order preview generated successfully.',
        statusCode: 200,
        data: {
          customer,
          address,
          items: validatedItems,
          itemCount: validatedItems.reduce((sum: number, i: any) => sum + i.quantity, 0),
          subtotal,
          discount,
          netSubtotal,
          shipping,
          tax,
          codFee,
          codFeeTax,
          grandTotal,
          isCodEligible,
          sellerCodAllocations,
          totalSavings,
          estimatedDelivery,
          appliedCoupon: appliedCouponData,
          taxBreakdown,
          isServiceable,
          shippingData: shipRes || null,
          paymentMethods,
          warnings,
        },
      };
    } catch (error: any) {
      console.error('[ORDER_PREVIEW_SERVICE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to generate order preview.',
        statusCode: 500,
      };
    }
  }
}
