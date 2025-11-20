import { z } from 'zod';
import {
  PERFUME_GENDERS,
  PERFORMANCE_LEVELS,
  LONGEVITY_LEVELS,
  PROJECTION_LEVELS,
  SILLAGE_LEVELS,
  COMMON_ACCORDS,
  BEST_FOR_OCCASIONS,
  PRODUCT_VALIDATION
} from '../modules/Product/product.constant';

// Perfume Notes Schema
const perfumeNotesSchema = z.object({
  top: z.array(z.string().min(1)).max(10).optional(),
  middle: z.array(z.string().min(1)).max(10).optional(),
  base: z.array(z.string().min(1)).max(10).optional(),
}).optional();

// Product Variant Schema
const productVariantSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  size: z.string()
    .min(1, `Size is required`).max(50),
  color: z.string()
    .min(1, `Color is required`).max(50),
  price: z.number()
    .min(PRODUCT_VALIDATION.MIN_PRICE, `Price must be at least ${PRODUCT_VALIDATION.MIN_PRICE}`)
    .max(PRODUCT_VALIDATION.MAX_PRICE, `Price cannot exceed ${PRODUCT_VALIDATION.MAX_PRICE}`),
  stock: z.number()
    .min(PRODUCT_VALIDATION.MIN_STOCK, `Stock cannot be negative`)
    .max(PRODUCT_VALIDATION.MAX_STOCK, `Stock cannot exceed ${PRODUCT_VALIDATION.MAX_STOCK}`),
});

// Create Product Schema
const createProductZodSchema = z.object({
  name: z.string()
    .min(PRODUCT_VALIDATION.NAME_MIN_LENGTH, `Name must be at least ${PRODUCT_VALIDATION.NAME_MIN_LENGTH} characters`)
    .max(PRODUCT_VALIDATION.NAME_MAX_LENGTH, `Name cannot exceed ${PRODUCT_VALIDATION.NAME_MAX_LENGTH} characters`),

  description: z.string()
    .min(PRODUCT_VALIDATION.DESCRIPTION_MIN_LENGTH, `Description must be at least ${PRODUCT_VALIDATION.DESCRIPTION_MIN_LENGTH} characters`)
    .max(PRODUCT_VALIDATION.DESCRIPTION_MAX_LENGTH, `Description cannot exceed ${PRODUCT_VALIDATION.DESCRIPTION_MAX_LENGTH} characters`),

  videoUrl: z.string().url().optional().or(z.literal('')),

  tags: z.array(z.string().min(1))
    .max(PRODUCT_VALIDATION.MAX_TAGS, `Cannot have more than ${PRODUCT_VALIDATION.MAX_TAGS} tags`)
    .optional()
    .default([]),

  // Perfume specifications
  origin: z.string().min(1).max(100).optional(),
  brand: z.string().min(1).max(100).optional(),
  // gender: z.enum(PERFUME_GENDERS as any).optional(),
  bestFor: z.array(z.string().min(1))
    .max(PRODUCT_VALIDATION.MAX_BEST_FOR, `Cannot have more than ${PRODUCT_VALIDATION.MAX_BEST_FOR} occasions`)
    .optional()
    .default([]),

  categoryId: z.string().min(1, 'Category ID is required'),
  published: z.boolean().optional().default(false),

  variants: z.array(productVariantSchema)
    .min(1, 'At least one variant is required')
    .max(20, 'Cannot have more than 20 variants'),
});

// Update Product Schema
const updateProductZodSchema = z.object({
  name: z.string()
    .min(PRODUCT_VALIDATION.NAME_MIN_LENGTH, `Name must be at least ${PRODUCT_VALIDATION.NAME_MIN_LENGTH} characters`)
    .max(PRODUCT_VALIDATION.NAME_MAX_LENGTH, `Name cannot exceed ${PRODUCT_VALIDATION.NAME_MAX_LENGTH} characters`)
    .optional(),

  description: z.string()
    .min(PRODUCT_VALIDATION.DESCRIPTION_MIN_LENGTH, `Description must be at least ${PRODUCT_VALIDATION.DESCRIPTION_MIN_LENGTH} characters`)
    .max(PRODUCT_VALIDATION.DESCRIPTION_MAX_LENGTH, `Description cannot exceed ${PRODUCT_VALIDATION.DESCRIPTION_MAX_LENGTH} characters`)
    .optional(),

  videoUrl: z.string().url().optional().or(z.literal('')),

  tags: z.array(z.string().min(1))
    .max(PRODUCT_VALIDATION.MAX_TAGS, `Cannot have more than ${PRODUCT_VALIDATION.MAX_TAGS} tags`)
    .optional(),

  // Perfume specifications
  origin: z.string().min(1).max(100).optional(),
  brand: z.string().min(1).max(100).optional(),
  gender: z.enum(PERFUME_GENDERS as any).optional(),
  bestFor: z.array(z.string().min(1))
    .max(PRODUCT_VALIDATION.MAX_BEST_FOR, `Cannot have more than ${PRODUCT_VALIDATION.MAX_BEST_FOR} occasions`)
    .optional(),

  categoryId: z.string().min(1).optional(),
  // published: z.boolean().optional(),
  published: z
    .preprocess((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    }, z.boolean())
    .optional(),

  imagesToKeep: z.array(z.string().url()).optional(),

  variants: z.array(productVariantSchema)
    .min(1, 'At least one variant is required')
    .max(20, 'Cannot have more than 20 variants')
    .optional(),
});

// Query Validation Schema
const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  gender: z.enum(PERFUME_GENDERS as any).optional(),
  origin: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  tags: z.string().optional(), // comma-separated
  bestFor: z.string().optional(), // comma-separated
  stock: z.enum(['in', 'out']).optional(),
  sortBy: z.enum([
    'name',
    'name_desc',
    'price_asc',
    'price_desc',
    'newest',
    'oldest',
    'popularity'
  ]).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(12),
});

// Stock Update Schema
const stockUpdateSchema = z.object({
  body: z.object({
    newStock: z.number()
      .min(PRODUCT_VALIDATION.MIN_STOCK, 'Stock cannot be negative')
      .max(PRODUCT_VALIDATION.MAX_STOCK, `Stock cannot exceed ${PRODUCT_VALIDATION.MAX_STOCK}`),
    reason: z.string().max(200).optional(),
  })
});

// const updateProductStockZodSchema = z.object({
//   body: z.object({
//     addedStock: z.number().min(1, 'Stock change must be positive'),
//     reason: z.string().min(1, 'Reason is required'),
//   }),
// });

// ID Parameter Schema
const mongoIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
  })
});

export const ProductValidation = {
  createProductZodSchema,
  updateProductZodSchema,
  productQuerySchema,
  stockUpdateSchema,
  mongoIdSchema,
  productVariantSchema,
  perfumeNotesSchema
};