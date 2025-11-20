// src/modules/Discount/discount.service.ts
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../../prisma/client";

export interface IDiscountPayload {
  productId: string;
  variantId?: string;
  code?: string;
  type: "percentage" | "fixed";
  value: number;
  maxUsage?: number;
  startDate?: string;
  endDate?: string;
}

export const DiscountServices = {
  // ── CREATE DISCOUNT ─────────────────────────────
  async createDiscount(payload: IDiscountPayload) {
    const { productId, variantId, code } = payload;

    // Validate product existence
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found");

    // Validate variant existence if provided
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant) throw new AppError(httpStatus.NOT_FOUND, "Variant not found");
    }

    // Validate code uniqueness for promo discounts
    if (code) {
      const exists = await prisma.discount.findUnique({ where: { code } });
      if (exists) throw new AppError(httpStatus.BAD_REQUEST, "Discount code already exists");
    }

    // ✅ Convert numeric values properly
    const numericValue = Number(payload.value);
    const numericMaxUsage = payload.maxUsage ? Number(payload.maxUsage) : undefined;
    if (isNaN(numericValue)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Discount value must be a valid number");
    }

    // Create discount
    return prisma.discount.create({
      data: {
        ...payload,
        value: numericValue,
        maxUsage: numericMaxUsage,
      },
    });
  },

  // ── GET ALL FOR ADMIN ───────────────────────────
  async getAllAdmin() {
    return prisma.discount.findMany({
      include: {
        product: { select: { name: true } },
        variant: { select: { sku: true, size: true,} },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // ── UPDATE DISCOUNT ────────────────────────────
  async updateDiscount(id: string, payload: Partial<IDiscountPayload>) {
    const discount = await prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new AppError(httpStatus.NOT_FOUND, "Discount not found");

    const numericValue = payload.value ? Number(payload.value) : undefined;
    const numericMaxUsage = payload.maxUsage ? Number(payload.maxUsage) : undefined;

    return prisma.discount.update({
      where: { id },
      data: {
        ...payload,
        ...(numericValue !== undefined && { value: numericValue }),
        ...(numericMaxUsage !== undefined && { maxUsage: numericMaxUsage }),
      },
    });
  },

  // ── DELETE DISCOUNT ────────────────────────────
  async deleteDiscount(id: string) {
    const discount = await prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new AppError(httpStatus.NOT_FOUND, "Discount not found");

    await prisma.discount.delete({ where: { id } });
  },

  // ── APPLY DISCOUNT AT CHECKOUT ─────────────────
  async applyDiscount(
    code: string | undefined,
    items: { productId: string; variantId?: string; price: number; qty: number }[]
  ) {
    const now = new Date();

    const allDiscounts = await prisma.discount.findMany({
      where: {
        OR: [
          { code },
          { code: null },
        ],
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
    });

    if (code && !allDiscounts.some(d => d.code === code)) {
      throw new AppError(httpStatus.NOT_FOUND, "Invalid discount code");
    }

    const results = items.map(item => {
      const originalPrice = item.price;

      const autoDiscount = allDiscounts.find(
        d => !d.code && (d.variantId ? d.variantId === item.variantId : d.productId === item.productId)
      );

      const promoDiscount = allDiscounts.find(
        d => d.code === code && (d.variantId ? d.variantId === item.variantId : d.productId === item.productId)
      );

      let discountedPrice = originalPrice;

      const apply = (d?: typeof allDiscounts[number]) => {
        if (!d) return;
        if (d.type === "percentage") discountedPrice *= 1 - d.value / 100;
        else discountedPrice = Math.max(0, discountedPrice - d.value);
      };

      apply(autoDiscount);
      apply(promoDiscount);

      return {
        ...item,
        originalPrice,
        discountedPrice,
        appliedDiscounts: [autoDiscount, promoDiscount].filter(Boolean),
      };
    });

    const discountAmount = results.reduce(
      (sum, i) => sum + (i.originalPrice - i.discountedPrice) * i.qty,
      0
    );

    return { items: results, discountAmount };
  },

  // ── GET AUTO DISCOUNT FOR PRODUCT LISTINGS ─────
  async getAutoDiscount(productId: string, variantId?: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true, discounts: true },
    });
    if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found");

    const now = new Date();
    const activeDiscounts = product.discounts.filter(d => {
      const started = !d.startDate || d.startDate <= now;
      const notEnded = !d.endDate || d.endDate >= now;
      return started && notEnded && !d.code;
    });
    if (activeDiscounts.length === 0) return { discountedPrice: null };

    let originalPrice = 0;
    let discountToApply = null;

    if (variantId) {
      const variant = product.variants.find(v => v.id === variantId);
      if (!variant) throw new AppError(httpStatus.NOT_FOUND, "Variant not found");
      originalPrice = variant.price;
      discountToApply =
        activeDiscounts.find(d => d.variantId === variantId) ||
        activeDiscounts.find(d => !d.variantId);
    } else {
      const prices = product.variants.map(v => v.price);
      originalPrice = Math.min(...prices);
      discountToApply = activeDiscounts.find(d => !d.variantId);
    }

    if (!discountToApply) return { discountedPrice: null };

    let discountedPrice = originalPrice;
    if (discountToApply.type === "percentage") discountedPrice = originalPrice * (1 - discountToApply.value / 100);
    else discountedPrice = Math.max(0, originalPrice - discountToApply.value);

    return {
      originalPrice,
      discountedPrice,
      discount: discountToApply,
      priceRange: !variantId
        ? { min: Math.min(...product.variants.map(v => v.price)), max: Math.max(...product.variants.map(v => v.price)) }
        : undefined,
    };
  },
};
