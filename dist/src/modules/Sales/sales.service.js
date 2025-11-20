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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleServices = void 0;
// src/app/modules/sales/sales.service.ts
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const client_1 = require("../../../prisma/client");
const client_2 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const generateInvoice_1 = require("../../helpers/generateInvoice");
// Treat "sales" as orders with a non-WEBSITE orderSource
const MANUAL_SOURCES = [
    client_2.OrderSource.SHOWROOM,
    client_2.OrderSource.WHOLESALE,
    client_2.OrderSource.MANUAL,
];
// -------------------------------
// Create a manual sale (Order) - UPDATED FOR APPAREL
// -------------------------------
const createSale = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { customerId, salesmanId, saleType, cartItemIds, amount, isPaid, method, orderSource, customerInfo, } = payload;
    console.log(payload, userId);
    // 1️⃣ Fetch valid cart items with variant details
    const cartItems = yield client_1.prisma.cartItem.findMany({
        where: { id: { in: cartItemIds }, status: 'IN_CART' },
        include: {
            product: true,
            variant: true,
        },
    });
    if (cartItems.length === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'No valid cart items found.');
    }
    // 2️⃣ Validate stock availability for each variant
    for (const item of cartItems) {
        if (!item.variant) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Variant not found for cart item ${item.id}`);
        }
        if (!item.variantId) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Variant ID missing for product ${item.product.name}`);
        }
        if (item.variant.stock < item.quantity) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Insufficient stock for ${item.product.name} - ${item.variant.color} (Size: ${item.variant.size}). Available: ${item.variant.stock}, Requested: ${item.quantity}`);
        }
    }
    // 3️⃣ Generate invoice
    const invoice = yield (0, generateInvoice_1.generateInvoice)();
    // 4️⃣ Transaction: create order + update stocks + link cart items
    const newOrder = yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const created = yield tx.order.create({
            data: {
                invoice,
                customerId: customerId || null,
                salesmanId: userId || null,
                saleType: saleType || client_2.SaleType.SINGLE,
                amount: Number(amount),
                isPaid: isPaid || false,
                method: method || null,
                orderSource: orderSource || client_2.OrderSource.MANUAL,
                name: (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.name) || null,
                phone: (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.phone) || null,
                email: (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.email) || null,
                address: (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.address) || null,
                productIds: cartItems.map((ci) => ci.productId),
                cartItems: cartItems.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: item.price,
                })),
            },
        });
        // Update cart items status → ORDERED
        yield tx.cartItem.updateMany({
            where: { id: { in: cartItemIds } },
            data: { orderId: created.id, status: 'ORDERED' },
        });
        // Update stock and create logs for each variant
        for (const item of cartItems) {
            const variantId = item.variantId;
            const productId = item.productId;
            const qty = item.quantity;
            // ✅ Update VARIANT stock (apparel tracks stock per variant)
            yield tx.productVariant.update({
                where: { id: variantId },
                data: {
                    stock: { decrement: qty },
                },
            });
            // ✅ Update Product salesCount
            yield tx.product.update({
                where: { id: productId },
                data: {
                    salesCount: { increment: qty },
                },
            });
            // ✅ Log stock change at variant level
            yield tx.stockLog.create({
                data: {
                    productId,
                    variantId,
                    change: -qty, // Negative for sale
                    reason: 'SALE',
                    notes: `Manual Sale ${created.invoice} - Sold ${qty} unit(s) by ${orderSource}`,
                },
            });
        }
        return created;
    }), { timeout: 20000 } // ⏳ 20 seconds to ensure completion
    );
    // 5️⃣ Fetch full order with relations
    const fullOrder = yield client_1.prisma.order.findUnique({
        where: { id: newOrder.id },
        include: {
            customer: { select: { id: true, name: true, imageUrl: true } },
            salesman: { select: { id: true, name: true, imageUrl: true } },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        },
    });
    if (!fullOrder)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found after creation.');
    const customerData = fullOrder.customer || {
        id: null,
        name: fullOrder.name || null,
        phone: fullOrder.phone || null,
        email: fullOrder.email || null,
        address: fullOrder.address || null,
        imageUrl: null,
    };
    return Object.assign(Object.assign({}, fullOrder), { customer: customerData });
});
// -------------------------------
// Admin: get all manual sales
// -------------------------------
const getAllSales = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = queryParams, { searchTerm, status, source } = _a, rest = __rest(_a, ["searchTerm", "status", "source"]);
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(rest);
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .getQuery();
    const where = Object.assign(Object.assign({}, prismaQuery.where), (source
        ? { orderSource: source }
        : { orderSource: { in: MANUAL_SOURCES } }));
    if (status)
        where.status = status;
    if (searchTerm && searchTerm.trim()) {
        const s = searchTerm.trim();
        where.OR = [
            { name: { contains: s, mode: 'insensitive' } },
            { phone: { contains: s, mode: 'insensitive' } },
            { address: { contains: s, mode: 'insensitive' } },
            {
                salesman: {
                    OR: [
                        { name: { contains: s, mode: 'insensitive' } },
                        { email: { contains: s, mode: 'insensitive' } },
                    ],
                },
            },
        ];
    }
    const data = yield client_1.prisma.order.findMany(Object.assign(Object.assign({}, prismaQuery), { where, include: {
            salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        } }));
    const meta = yield queryBuilder.getPaginationMeta({
        count: (args) => { var _a; return client_1.prisma.order.count({ where: Object.assign(Object.assign({}, where), ((_a = args === null || args === void 0 ? void 0 : args.where) !== null && _a !== void 0 ? _a : {})) }); },
    });
    return { meta, data };
});
// -------------------------------
// Salesman: my sales
// -------------------------------
const getMySales = (salesmanId, queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const _b = queryParams, { searchTerm, status, source } = _b, rest = __rest(_b, ["searchTerm", "status", "source"]);
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(rest);
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .getQuery();
    const where = Object.assign(Object.assign(Object.assign({}, prismaQuery.where), { salesmanId }), (source
        ? { orderSource: source }
        : { orderSource: { in: MANUAL_SOURCES } }));
    if (status)
        where.status = status;
    if (searchTerm && searchTerm.trim()) {
        const s = searchTerm.trim();
        where.OR = [
            { name: { contains: s, mode: 'insensitive' } },
            { phone: { contains: s, mode: 'insensitive' } },
            { address: { contains: s, mode: 'insensitive' } },
        ];
    }
    const data = yield client_1.prisma.order.findMany(Object.assign(Object.assign({}, prismaQuery), { where, include: {
            salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        } }));
    const [count, sum] = yield Promise.all([
        client_1.prisma.order.count({ where }),
        client_1.prisma.order.aggregate({ where, _sum: { amount: true } }),
    ]);
    const meta = yield queryBuilder.getPaginationMeta({
        count: (args) => { var _a; return client_1.prisma.order.count({ where: Object.assign(Object.assign({}, where), ((_a = args === null || args === void 0 ? void 0 : args.where) !== null && _a !== void 0 ? _a : {})) }); },
    });
    return {
        meta,
        totalSales: count,
        totalAmount: (_a = sum._sum.amount) !== null && _a !== void 0 ? _a : 0,
        data,
    };
});
// -------------------------------
// Admin: sales by customer phone
// -------------------------------
const getSalesByCustomer = (phone, queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams);
    const prismaQuery = queryBuilder.buildSort().buildPagination().getQuery();
    const where = {
        phone: { contains: phone, mode: 'insensitive' },
        orderSource: { in: MANUAL_SOURCES },
    };
    const data = yield client_1.prisma.order.findMany(Object.assign(Object.assign({}, prismaQuery), { where, include: {
            salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        } }));
    const meta = yield queryBuilder.getPaginationMeta({
        count: (args) => { var _a; return client_1.prisma.order.count({ where: Object.assign(Object.assign({}, where), ((_a = args === null || args === void 0 ? void 0 : args.where) !== null && _a !== void 0 ? _a : {})) }); },
    });
    return { meta, data };
});
// -------------------------------
// Update sale status / payment
// -------------------------------
const updateSaleStatus = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Only allow valid enum if provided
    const data = {};
    if (payload.status)
        data.status = payload.status;
    if (typeof payload.isPaid === 'boolean')
        data.isPaid = payload.isPaid;
    const updated = yield client_1.prisma.order.update({
        where: { id },
        data,
        include: {
            salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        },
    });
    return updated;
});
// -------------------------------
// Cancel Manual Sale and Restore Stock
// -------------------------------
const cancelSale = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const sale = yield client_1.prisma.order.findUnique({
        where: { id },
        include: {
            orderItems: {
                include: {
                    variant: true,
                },
            },
        },
    });
    if (!sale) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Sale not found');
    }
    if (!MANUAL_SOURCES.includes(sale.orderSource)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'This is not a manual sale. Use order cancellation instead.');
    }
    if (sale.status === 'CANCEL') {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Sale is already cancelled');
    }
    if (sale.status === 'DELIVERED' || sale.status === 'COMPLETED') {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot cancel delivered or completed sales. Please process as return.');
    }
    // Restore stock in transaction
    yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Update sale status
        yield tx.order.update({
            where: { id },
            data: { status: 'CANCEL' },
        });
        // Restore stock for each item
        for (const item of sale.orderItems) {
            if (item.variantId) {
                // Restore variant stock
                yield tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stock: { increment: item.quantity },
                    },
                });
                // Update product salesCount
                yield tx.product.update({
                    where: { id: item.productId },
                    data: {
                        salesCount: { decrement: item.quantity },
                    },
                });
                // Log stock restoration
                yield tx.stockLog.create({
                    data: {
                        productId: item.productId,
                        variantId: item.variantId,
                        change: item.quantity, // Positive for restoration
                        reason: 'CANCEL',
                        notes: `Manual Sale ${sale.invoice} cancelled - Stock restored`,
                    },
                });
            }
        }
    }));
    return yield client_1.prisma.order.findUnique({
        where: { id },
        include: {
            salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        },
    });
});
// -------------------------------
// Admin: sales analytics
// -------------------------------
const getSalesAnalytics = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { startDate, endDate, salesmanId } = queryParams;
    const where = {
        orderSource: { in: MANUAL_SOURCES },
    };
    if (salesmanId)
        where.salesmanId = salesmanId;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate)
            where.createdAt.gte = new Date(startDate);
        if (endDate)
            where.createdAt.lte = new Date(endDate);
    }
    const [count, sum, byStatus, bySource, topProducts] = yield Promise.all([
        client_1.prisma.order.count({ where }),
        client_1.prisma.order.aggregate({ where, _sum: { amount: true } }),
        client_1.prisma.order.groupBy({
            by: ['status'],
            _count: { _all: true },
            _sum: { amount: true },
            where,
        }),
        client_1.prisma.order.groupBy({
            by: ['orderSource'],
            _count: { _all: true },
            _sum: { amount: true },
            where,
        }),
        // Get top selling products in manual sales
        client_1.prisma.cartItem.groupBy({
            by: ['productId'],
            where: {
                order: where,
                status: 'ORDERED',
            },
            _sum: { quantity: true },
            _count: { _all: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 10,
        }),
    ]);
    // Fetch product details for top products
    const productIds = topProducts.map((tp) => tp.productId);
    const products = yield client_1.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, primaryImage: true },
    });
    const topProductsWithDetails = topProducts.map((tp) => {
        var _a;
        return ({
            product: products.find((p) => p.id === tp.productId),
            totalQuantity: (_a = tp._sum.quantity) !== null && _a !== void 0 ? _a : 0,
            orderCount: tp._count._all,
        });
    });
    return {
        totalSales: count,
        totalAmount: (_a = sum._sum.amount) !== null && _a !== void 0 ? _a : 0,
        byStatus,
        bySource,
        topProducts: topProductsWithDetails,
    };
});
// -------------------------------
// Get salesman performance
// -------------------------------
const getSalesmanPerformance = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate } = queryParams;
    const where = {
        orderSource: { in: MANUAL_SOURCES },
        salesmanId: { not: null },
    };
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate)
            where.createdAt.gte = new Date(startDate);
        if (endDate)
            where.createdAt.lte = new Date(endDate);
    }
    const salesBySalesman = yield client_1.prisma.order.groupBy({
        by: ['salesmanId'],
        where,
        _count: { _all: true },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
    });
    // Fetch salesman details
    const salesmanIds = salesBySalesman
        .map((s) => s.salesmanId)
        .filter((id) => id !== null);
    const salesmen = yield client_1.prisma.user.findMany({
        where: { id: { in: salesmanIds } },
        select: { id: true, name: true, email: true, imageUrl: true },
    });
    const performance = salesBySalesman.map((s) => {
        var _a;
        return ({
            salesman: salesmen.find((sm) => sm.id === s.salesmanId),
            totalSales: s._count._all,
            totalAmount: (_a = s._sum.amount) !== null && _a !== void 0 ? _a : 0,
            averageSaleAmount: s._sum.amount && s._count._all
                ? Math.round((s._sum.amount / s._count._all) * 100) / 100
                : 0,
        });
    });
    return performance;
});
// (Optional) Single sale fetch
const getSaleById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const sale = yield client_1.prisma.order.findUnique({
        where: { id },
        include: {
            salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
            customer: { select: { id: true, name: true, imageUrl: true } },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        },
    });
    if (!sale) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Sale not found');
    }
    // Normalize customer data
    const customerData = sale.customer || {
        id: null,
        name: sale.name || null,
        phone: sale.phone || null,
        email: sale.email || null,
        address: sale.address || null,
        imageUrl: null,
    };
    return Object.assign(Object.assign({}, sale), { customer: customerData });
});
exports.SaleServices = {
    // creation
    createSale,
    // lists
    getAllSales,
    getMySales,
    getSalesByCustomer,
    // update
    updateSaleStatus,
    cancelSale,
    // analytics
    getSalesAnalytics,
    getSalesmanPerformance,
    // optional
    getSaleById,
};
