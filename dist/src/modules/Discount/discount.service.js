"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountServices = void 0;
// src/modules/Discount/discount.service.ts
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../prisma/client");
exports.DiscountServices = {
    // ── CREATE DISCOUNT ─────────────────────────────
    createDiscount(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const { productId, variantId, code } = payload;
            // Validate product existence
            const product = yield client_1.prisma.product.findUnique({
                where: { id: productId },
            });
            if (!product)
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
            // Validate variant existence if provided
            if (variantId) {
                const variant = yield client_1.prisma.productVariant.findUnique({ where: { id: variantId } });
                if (!variant)
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Variant not found");
            }
            // Validate code uniqueness for promo discounts
            if (code) {
                const exists = yield client_1.prisma.discount.findUnique({ where: { code } });
                if (exists)
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Discount code already exists");
            }
            // ✅ Convert numeric values properly
            const numericValue = Number(payload.value);
            const numericMaxUsage = payload.maxUsage ? Number(payload.maxUsage) : undefined;
            if (isNaN(numericValue)) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Discount value must be a valid number");
            }
            // Create discount
            return client_1.prisma.discount.create({
                data: Object.assign(Object.assign({}, payload), { value: numericValue, maxUsage: numericMaxUsage }),
            });
        });
    },
    // ── GET ALL FOR ADMIN ───────────────────────────
    getAllAdmin() {
        return __awaiter(this, void 0, void 0, function* () {
            return client_1.prisma.discount.findMany({
                include: {
                    product: { select: { name: true } },
                    variant: { select: { sku: true, size: true, } },
                },
                orderBy: { createdAt: "desc" },
            });
        });
    },
    // ── UPDATE DISCOUNT ────────────────────────────
    updateDiscount(id, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const discount = yield client_1.prisma.discount.findUnique({ where: { id } });
            if (!discount)
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Discount not found");
            const numericValue = payload.value ? Number(payload.value) : undefined;
            const numericMaxUsage = payload.maxUsage ? Number(payload.maxUsage) : undefined;
            return client_1.prisma.discount.update({
                where: { id },
                data: Object.assign(Object.assign(Object.assign({}, payload), (numericValue !== undefined && { value: numericValue })), (numericMaxUsage !== undefined && { maxUsage: numericMaxUsage })),
            });
        });
    },
    // ── DELETE DISCOUNT ────────────────────────────
    deleteDiscount(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const discount = yield client_1.prisma.discount.findUnique({ where: { id } });
            if (!discount)
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Discount not found");
            yield client_1.prisma.discount.delete({ where: { id } });
        });
    },
    // ── APPLY DISCOUNT AT CHECKOUT ─────────────────
    applyDiscount(code, items) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const allDiscounts = yield client_1.prisma.discount.findMany({
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
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Invalid discount code");
            }
            const results = items.map(item => {
                const originalPrice = item.price;
                const autoDiscount = allDiscounts.find(d => !d.code && (d.variantId ? d.variantId === item.variantId : d.productId === item.productId));
                const promoDiscount = allDiscounts.find(d => d.code === code && (d.variantId ? d.variantId === item.variantId : d.productId === item.productId));
                let discountedPrice = originalPrice;
                const apply = (d) => {
                    if (!d)
                        return;
                    if (d.type === "percentage")
                        discountedPrice *= 1 - d.value / 100;
                    else
                        discountedPrice = Math.max(0, discountedPrice - d.value);
                };
                apply(autoDiscount);
                apply(promoDiscount);
                return Object.assign(Object.assign({}, item), { originalPrice,
                    discountedPrice, appliedDiscounts: [autoDiscount, promoDiscount].filter(Boolean) });
            });
            const discountAmount = results.reduce((sum, i) => sum + (i.originalPrice - i.discountedPrice) * i.qty, 0);
            return { items: results, discountAmount };
        });
    },
    // ── GET AUTO DISCOUNT FOR PRODUCT LISTINGS ─────
    getAutoDiscount(productId, variantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const product = yield client_1.prisma.product.findUnique({
                where: { id: productId },
                include: { variants: true, discounts: true },
            });
            if (!product)
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
            const now = new Date();
            const activeDiscounts = product.discounts.filter(d => {
                const started = !d.startDate || d.startDate <= now;
                const notEnded = !d.endDate || d.endDate >= now;
                return started && notEnded && !d.code;
            });
            if (activeDiscounts.length === 0)
                return { discountedPrice: null };
            let originalPrice = 0;
            let discountToApply = null;
            if (variantId) {
                const variant = product.variants.find(v => v.id === variantId);
                if (!variant)
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Variant not found");
                originalPrice = variant.price;
                discountToApply =
                    activeDiscounts.find(d => d.variantId === variantId) ||
                        activeDiscounts.find(d => !d.variantId);
            }
            else {
                const prices = product.variants.map(v => v.price);
                originalPrice = Math.min(...prices);
                discountToApply = activeDiscounts.find(d => !d.variantId);
            }
            if (!discountToApply)
                return { discountedPrice: null };
            let discountedPrice = originalPrice;
            if (discountToApply.type === "percentage")
                discountedPrice = originalPrice * (1 - discountToApply.value / 100);
            else
                discountedPrice = Math.max(0, originalPrice - discountToApply.value);
            return {
                originalPrice,
                discountedPrice,
                discount: discountToApply,
                priceRange: !variantId
                    ? { min: Math.min(...product.variants.map(v => v.price)), max: Math.max(...product.variants.map(v => v.price)) }
                    : undefined,
            };
        });
    },
};
