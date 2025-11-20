"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountValidation = void 0;
// src/validations/discount.validation.ts
const zod_1 = require("zod");
exports.DiscountValidation = {
    createDiscountZodSchema: zod_1.z.object({
        body: zod_1.z.object({
            productId: zod_1.z.string(),
            variantId: zod_1.z.string().optional(),
            code: zod_1.z.string().optional(),
            type: zod_1.z.enum(["percentage", "fixed"]),
            value: zod_1.z.number().positive(),
            maxUsage: zod_1.z.number().int().optional(),
            startDate: zod_1.z.string().datetime().optional(),
            endDate: zod_1.z.string().datetime().optional(),
        }),
    }),
    updateDiscountZodSchema: zod_1.z.object({
        body: zod_1.z.object({
            productId: zod_1.z.string().optional(),
            variantId: zod_1.z.string().optional(),
            code: zod_1.z.string().optional(),
            type: zod_1.z.enum(["percentage", "fixed"]).optional(),
            value: zod_1.z.number().positive().optional(),
            maxUsage: zod_1.z.number().int().optional(),
            startDate: zod_1.z.string().datetime().optional(),
            endDate: zod_1.z.string().datetime().optional(),
        }),
    }),
};
