"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCT_ERROR_MESSAGES = exports.CACHE_KEYS = exports.QUERY_DEFAULTS = exports.PRODUCT_VALIDATION = exports.BEST_FOR_OCCASIONS = exports.COMMON_ACCORDS = exports.SILLAGE_LEVELS = exports.PROJECTION_LEVELS = exports.LONGEVITY_LEVELS = exports.PERFORMANCE_LEVELS = exports.PERFUME_NOTES_CATEGORIES = exports.PERFUME_GENDERS = exports.productSortOptions = exports.productAdminInclude = exports.productDetailInclude = exports.productInclude = exports.productRangeFilter = exports.productNestedFilters = exports.productArraySearchFields = exports.productSearchFields = exports.productFilterFields = void 0;
// Basic filtering fields
exports.productFilterFields = [
    'published',
    'brand',
    'gender',
    'origin',
    'performance',
    'longevity',
    'projection',
    'sillage',
    'stock'
];
// Searchable fields
exports.productSearchFields = [
    'name',
    'description',
    'brand',
    'origin'
];
// Array fields that can be searched
exports.productArraySearchFields = [
    'tags',
    'accords',
    'bestFor'
];
// Nested filters for related fields
exports.productNestedFilters = [
    {
        key: 'category',
        searchOption: 'exact',
        queryFields: ['categoryName']
    },
    {
        key: 'variants',
        // searchOption: 'range',
        queryFields: ['price', 'stock']
    }
];
// Range filters
exports.productRangeFilter = [
    {
        field: 'price',
        nestedField: 'variants',
        maxQueryKey: 'maxPrice',
        minQueryKey: 'minPrice',
        dataType: 'number',
    },
    {
        field: 'stock',
        nestedField: 'variants',
        maxQueryKey: 'maxStock',
        minQueryKey: 'minStock',
        dataType: 'number',
    }
];
// Prisma include config for basic product queries
exports.productInclude = {
    category: {
        select: {
            id: true,
            categoryName: true,
            imageUrl: true
        }
    },
    // ✅ Include related materials
    ProductFabric: {
        include: {
            fabric: {
                select: {
                    id: true,
                    fabricName: true,
                },
            },
        },
    },
    Review: {
        where: {
            isPublished: true
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc'
        }
    },
    variants: {
        include: {
            discounts: true, // variant-level
        },
    },
    discounts: true, // product-level
};
// Detailed include for single product view
exports.productDetailInclude = {
    category: true,
    ProductFabric: { include: { fabric: true } },
    Review: {
        where: { isPublished: true },
        include: {
            user: { select: { id: true, name: true, imageUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
    },
    discounts: true, // product-level
    variants: {
        include: {
            discounts: true, // variant-level
        },
    },
};
// Admin include for management
exports.productAdminInclude = {
    category: true,
    // Review: {
    //   include: {
    //     user: {
    //       select: {
    //         id: true,
    //         name: true,
    //         email: true,
    //         imageUrl: true
    //       },
    //     },
    //   },
    // },
    Review: true,
    // stock: true,
    discounts: true, // product-level
    variants: {
        include: {
            discounts: true, // variant-level
        },
    },
    // wishlist: true,
    comboVariants: true
};
// Sort options mapping
exports.productSortOptions = {
    name: { name: 'asc' },
    name_desc: { name: 'desc' },
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    popularity: { salesCount: 'desc' },
    price_asc: 'custom', // Handled in service
    price_desc: 'custom', // Handled in service
};
// Perfume-specific constants
exports.PERFUME_GENDERS = [
    'UNISEX',
    'MALE',
    'FEMALE'
];
exports.PERFUME_NOTES_CATEGORIES = [
    'top',
    'middle',
    'base'
];
exports.PERFORMANCE_LEVELS = [
    'POOR',
    'WEAK',
    'MODERATE',
    'GOOD',
    'EXCELLENT',
    'BEAST_MODE'
];
exports.LONGEVITY_LEVELS = [
    'VERY_WEAK',
    'WEAK',
    'MODERATE',
    'LONG_LASTING',
    'ETERNAL'
];
exports.PROJECTION_LEVELS = [
    'INTIMATE',
    'CLOSE',
    'MODERATE',
    'STRONG',
    'NUCLEAR'
];
exports.SILLAGE_LEVELS = [
    'SOFT',
    'MODERATE',
    'HEAVY',
    'ENORMOUS'
];
exports.COMMON_ACCORDS = [
    'FLORAL',
    'FRESH',
    'ORIENTAL',
    'WOODY',
    'FRUITY',
    'GOURMAND',
    'AROMATIC',
    'CITRUS',
    'SPICY',
    'AQUATIC',
    'GREEN',
    'POWDERY',
    'SMOKY',
    'LEATHER',
    'VANILLA',
    'AMBER',
    'MUSK'
];
exports.BEST_FOR_OCCASIONS = [
    'DAILY_WEAR',
    'OFFICE',
    'EVENING',
    'DATE_NIGHT',
    'SPECIAL_OCCASIONS',
    'SUMMER',
    'WINTER',
    'SPRING',
    'FALL',
    'CLUBBING',
    'FORMAL_EVENTS',
    'CASUAL',
    'SPORT',
    'TRAVEL'
];
// Validation constants
exports.PRODUCT_VALIDATION = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 200,
    DESCRIPTION_MIN_LENGTH: 10,
    DESCRIPTION_MAX_LENGTH: 2000,
    MAX_TAGS: 20,
    MAX_ACCORDS: 10,
    MAX_BEST_FOR: 15,
    MAX_IMAGES: 10,
    MIN_PRICE: 0.01,
    MAX_PRICE: 999999,
    MIN_STOCK: 0,
    MAX_STOCK: 999999,
    MAX_SIZE: 10000, // in ml or gm
    MIN_SIZE: 0.1
};
// Query defaults
exports.QUERY_DEFAULTS = {
    PAGE: 1,
    LIMIT: 12,
    MAX_LIMIT: 100,
    TRENDING_LIMIT: 10,
    RELATED_LIMIT: 6,
    NEW_ARRIVALS_DAYS: 30,
    LOW_STOCK_THRESHOLD: 10
};
// Cache keys
exports.CACHE_KEYS = {
    ALL_PRODUCTS: 'products:all',
    TRENDING_PRODUCTS: 'products:trending',
    NEW_ARRIVALS: 'products:new-arrivals',
    FEATURED_PRODUCTS: 'products:featured',
    NAVBAR_PRODUCTS: 'products:navbar',
    PRODUCT_FILTERS: 'products:filters',
    BESTSELLERS: 'products:bestsellers'
};
// Error messages
exports.PRODUCT_ERROR_MESSAGES = {
    NOT_FOUND: 'Product not found',
    PRODUCT_NOT_FOUND: 'Product not found',
    VARIANT_NOT_FOUND: 'Product variant not found',
    INSUFFICIENT_STOCK: 'Insufficient stock available',
    INVALID_VARIANT_DATA: 'Invalid variant data provided',
    INVALID_PERFUME_NOTES: 'Invalid perfume notes structure',
    DUPLICATE_SKU: 'SKU already exists',
    CATEGORY_REQUIRED: 'Category is required',
    MATERIAL_REQUIRED: 'Material is required',
    VARIANTS_REQUIRED: 'At least one variant is required',
    IMAGE_REQUIRED: 'At least one product image is required',
    INVALID_PRICE_RANGE: 'Invalid price range',
    INVALID_STOCK_VALUE: 'Invalid stock value',
    PRODUCT_PUBLISHED_CANNOT_DELETE: 'Cannot delete published product with active orders'
};
exports.default = {
    productFilterFields: exports.productFilterFields,
    productSearchFields: exports.productSearchFields,
    productArraySearchFields: exports.productArraySearchFields,
    productNestedFilters: exports.productNestedFilters,
    // productRangeFilter,
    productInclude: exports.productInclude,
    productDetailInclude: exports.productDetailInclude,
    productAdminInclude: exports.productAdminInclude,
    productSortOptions: exports.productSortOptions,
    PERFUME_GENDERS: exports.PERFUME_GENDERS,
    PERFUME_NOTES_CATEGORIES: exports.PERFUME_NOTES_CATEGORIES,
    PERFORMANCE_LEVELS: exports.PERFORMANCE_LEVELS,
    LONGEVITY_LEVELS: exports.LONGEVITY_LEVELS,
    PROJECTION_LEVELS: exports.PROJECTION_LEVELS,
    SILLAGE_LEVELS: exports.SILLAGE_LEVELS,
    COMMON_ACCORDS: exports.COMMON_ACCORDS,
    BEST_FOR_OCCASIONS: exports.BEST_FOR_OCCASIONS,
    PRODUCT_VALIDATION: exports.PRODUCT_VALIDATION,
    QUERY_DEFAULTS: exports.QUERY_DEFAULTS,
    CACHE_KEYS: exports.CACHE_KEYS,
    PRODUCT_ERROR_MESSAGES: exports.PRODUCT_ERROR_MESSAGES
};
