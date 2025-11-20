"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDER_ERROR_MESSAGES = exports.CACHE_KEYS = exports.QUERY_DEFAULTS = exports.ORDER_VALIDATION = exports.PAYMENT_STATUSES = exports.PAYMENT_METHODS = exports.ORDER_STATUSES = exports.orderSortOptions = exports.orderInclude = exports.orderRangeFilter = exports.orderNestedFilters = exports.orderSearchFields = exports.orderFilterFields = void 0;
// Basic filtering fields for orders
exports.orderFilterFields = [
    'status',
    'paymentStatus',
    'paymentMethod'
];
// Searchable fields (for admin panel / reporting)
exports.orderSearchFields = [
    'id',
    'orderNumber',
    'customerName',
    'customerEmail',
    'customerPhone'
];
// Nested filters for related fields
exports.orderNestedFilters = [
    {
        key: 'customer',
        searchOption: 'exact',
        queryFields: ['name', 'email', 'phone']
    },
    {
        key: 'salesman',
        searchOption: 'exact',
        queryFields: ['name', 'email']
    },
    {
        key: 'items',
        queryFields: ['productName', 'sku']
    }
];
// Range filters for analytics
exports.orderRangeFilter = [
    {
        field: 'totalAmount',
        maxQueryKey: 'maxTotal',
        minQueryKey: 'minTotal',
        dataType: 'number',
    },
    {
        field: 'createdAt',
        maxQueryKey: 'endDate',
        minQueryKey: 'startDate',
        dataType: 'date',
    }
];
// Prisma include config for order queries
exports.orderInclude = {
    customer: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true
        }
    },
    salesman: {
        select: {
            id: true,
            name: true,
            email: true
        }
    },
    orderItems: {
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    primaryImage: true,
                    discounts: true, // product-level discounts
                }
            },
            variant: {
                include: {
                    discounts: true // variant-level discounts
                }
            }
        }
    },
    orderDiscounts: {
        include: {
            discount: true // include discount details
        }
    },
    payments: true // include payments for this order
};
// Sort options mapping
exports.orderSortOptions = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    amount_asc: { totalAmount: 'asc' },
    amount_desc: { totalAmount: 'desc' },
    status: { status: 'asc' }
};
// Order status constants
exports.ORDER_STATUSES = [
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED'
];
// Payment methods
exports.PAYMENT_METHODS = [
    'CASH_ON_DELIVERY',
    'CREDIT_CARD',
    'BANK_TRANSFER',
    'MOBILE_PAYMENT'
];
// Payment status
exports.PAYMENT_STATUSES = [
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
];
// Validation constants
exports.ORDER_VALIDATION = {
    MIN_TOTAL_AMOUNT: 0.01,
    MAX_TOTAL_AMOUNT: 999999,
    MAX_ITEMS: 100,
    MAX_DISCOUNT: 100, // percentage
    MAX_NOTE_LENGTH: 1000
};
// Query defaults
exports.QUERY_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
    RECENT_ORDERS_LIMIT: 10
};
// Cache keys
exports.CACHE_KEYS = {
    ALL_ORDERS: 'orders:all',
    RECENT_ORDERS: 'orders:recent',
    ORDER_STATS: 'orders:stats',
    CUSTOMER_ORDERS: 'orders:customer',
};
// Error messages
exports.ORDER_ERROR_MESSAGES = {
    NOT_FOUND: 'Order not found',
    INVALID_STATUS: 'Invalid order status provided',
    INVALID_PAYMENT_METHOD: 'Invalid payment method provided',
    INVALID_PAYMENT_STATUS: 'Invalid payment status provided',
    EMPTY_ORDER: 'Order must contain at least one item',
    INSUFFICIENT_STOCK: 'Insufficient stock for one or more items',
    CUSTOMER_REQUIRED: 'Customer information is required',
    MAX_ITEMS_EXCEEDED: 'Order exceeds maximum allowed items',
    TOTAL_AMOUNT_INVALID: 'Total amount is invalid',
    STATUS_UPDATE_FAILED: 'Order status update failed',
};
exports.default = {
    orderFilterFields: exports.orderFilterFields,
    orderSearchFields: exports.orderSearchFields,
    orderNestedFilters: exports.orderNestedFilters,
    orderRangeFilter: exports.orderRangeFilter,
    orderInclude: exports.orderInclude,
    orderSortOptions: exports.orderSortOptions,
    ORDER_STATUSES: exports.ORDER_STATUSES,
    PAYMENT_METHODS: exports.PAYMENT_METHODS,
    PAYMENT_STATUSES: exports.PAYMENT_STATUSES,
    ORDER_VALIDATION: exports.ORDER_VALIDATION,
    QUERY_DEFAULTS: exports.QUERY_DEFAULTS,
    CACHE_KEYS: exports.CACHE_KEYS,
    ORDER_ERROR_MESSAGES: exports.ORDER_ERROR_MESSAGES
};
