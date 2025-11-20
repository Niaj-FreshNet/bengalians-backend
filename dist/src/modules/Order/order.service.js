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
exports.OrderServices = void 0;
const client_1 = require("../../../prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const generateInvoice_1 = require("../../helpers/generateInvoice");
// ✅ Get All Orders (with customer + salesman info)
const getAllOrders = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, status } = queryParams, rest = __rest(queryParams, ["searchTerm", "status"]);
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(rest, ['id', 'customer.name']);
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .getQuery();
    const where = prismaQuery.where || {};
    if (searchTerm) {
        where.OR = [
            ...(where.OR || []),
            { name: { contains: String(searchTerm), mode: 'insensitive' } },
            { email: { contains: String(searchTerm), mode: 'insensitive' } },
            { phone: { contains: String(searchTerm), mode: 'insensitive' } },
        ];
    }
    if (status)
        where.status = status;
    const orders = yield client_1.prisma.order.findMany(Object.assign(Object.assign({}, prismaQuery), { where, include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    imageUrl: true,
                },
            },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: {
                        include: {
                            color: { select: { id: true, colorName: true, hexCode: true } },
                        },
                    },
                },
            },
        } }));
    const meta = yield queryBuilder.getPaginationMeta({
        count: (args) => client_1.prisma.order.count({ where: args.where }),
    });
    // Normalize customer info for guest orders
    const normalizedOrders = orders.map((order) => {
        var _a, _b, _c, _d, _e;
        const customerData = (_a = order.customer) !== null && _a !== void 0 ? _a : {
            id: null,
            name: (_b = order.name) !== null && _b !== void 0 ? _b : null,
            phone: (_c = order.phone) !== null && _c !== void 0 ? _c : null,
            email: (_d = order.email) !== null && _d !== void 0 ? _d : null,
            address: (_e = order.address) !== null && _e !== void 0 ? _e : null,
            imageUrl: null,
        };
        return Object.assign(Object.assign({}, order), { customer: customerData });
    });
    return { meta, data: normalizedOrders };
});
// ✅ Get Single Order (with full nested details)
const getOrderById = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield client_1.prisma.order.findUnique({
        where: { id: orderId },
        include: {
            customer: { select: { id: true, name: true, imageUrl: true } },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        },
    });
    if (!order)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    // Normalize customer info for guest/manual orders
    const customerData = order.customer || {
        id: null,
        name: order.name || null,
        phone: order.phone || null,
        email: order.email || null,
        address: order.address || null,
        imageUrl: null,
    };
    return Object.assign(Object.assign({}, order), { customer: customerData });
});
// ✅ Create Order with existing CartItems (UPDATED FOR APPAREL)
const createOrderWithCartItems = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { customerId, cartItemIds, amount, isPaid, method, orderSource, saleType, shippingCost, additionalNotes, customerInfo, shippingAddress, billingAddress, } = payload;
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
        if (item.variant.stock < item.quantity) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Insufficient stock for ${item.product.name} - ${item.variant.color} (Size: ${item.variant.size}). Available: ${item.variant.stock}, Requested: ${item.quantity}`);
        }
    }
    // 3️⃣ Start transaction with extended timeout
    const order = yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const invoice = yield (0, generateInvoice_1.generateInvoice)();
        // Create Order
        const newOrder = yield tx.order.create({
            data: {
                invoice,
                amount: Number(amount),
                isPaid: isPaid || false,
                method: method || '',
                orderSource: orderSource || 'WEBSITE',
                saleType: saleType || 'SINGLE',
                shippingCost: shippingCost || 0,
                additionalNotes: additionalNotes || '',
                // Customer relation handling
                customer: customerId
                    ? { connect: { id: customerId } }
                    : {
                        create: {
                            name: (_a = customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.name) !== null && _a !== void 0 ? _a : '',
                            phone: (_b = customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.phone) !== null && _b !== void 0 ? _b : '',
                            email: (_c = customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.email) !== null && _c !== void 0 ? _c : '',
                            address: (_d = customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.address) !== null && _d !== void 0 ? _d : '',
                        },
                    },
                shipping: {
                    name: (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.name) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.name) || null,
                    phone: (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.phone) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.phone) || null,
                    email: (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.email) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.email) || null,
                    address: (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.address) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.address) || null,
                    district: (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.district) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.district) || null,
                    thana: (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.thana) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.thana) || null,
                },
                billing: {
                    name: (billingAddress === null || billingAddress === void 0 ? void 0 : billingAddress.name) || (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.name) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.name) || null,
                    phone: (billingAddress === null || billingAddress === void 0 ? void 0 : billingAddress.phone) || (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.phone) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.phone) || null,
                    email: (billingAddress === null || billingAddress === void 0 ? void 0 : billingAddress.email) || (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.email) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.email) || null,
                    address: (billingAddress === null || billingAddress === void 0 ? void 0 : billingAddress.address) || (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.address) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.address) || null,
                    district: (billingAddress === null || billingAddress === void 0 ? void 0 : billingAddress.district) || (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.district) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.district) || null,
                    thana: (billingAddress === null || billingAddress === void 0 ? void 0 : billingAddress.thana) || (shippingAddress === null || shippingAddress === void 0 ? void 0 : shippingAddress.thana) || (customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.thana) || null,
                },
                productIds: cartItems.map((ci) => ci.productId),
                cartItems: cartItems.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: Number(item.price),
                })),
            },
        });
        // Update CartItems as ordered
        yield tx.cartItem.updateMany({
            where: { id: { in: cartItems.map((i) => i.id) } },
            data: { orderId: newOrder.id, status: 'ORDERED' },
        });
        // Update stock and create logs for each variant
        for (const item of cartItems) {
            const variantId = item.variantId;
            const productId = item.productId;
            const qty = item.quantity;
            if (!variantId) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Variant ID missing for product ${productId}`);
            }
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
                    notes: `Order ${newOrder.invoice} - Sold ${qty} unit(s)`,
                },
            });
        }
        return newOrder;
    }), {
        timeout: 20000, // 20 seconds
    });
    // 4️⃣ Fetch full order
    const fullOrder = yield client_1.prisma.order.findUnique({
        where: { id: order.id },
        include: {
            customer: { select: { id: true, name: true, imageUrl: true } },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        },
    });
    if (!fullOrder)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
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
// ✅ Update Order Status
const updateOrderStatus = (orderId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield client_1.prisma.order.update({
        where: { id: orderId },
        data: payload,
    });
    return order;
});
// ✅ Cancel Order and Restore Stock
const cancelOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield client_1.prisma.order.findUnique({
        where: { id: orderId },
        include: {
            orderItems: {
                include: {
                    variant: true,
                },
            },
        },
    });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    }
    if (order.status === 'CANCEL') {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Order is already cancelled');
    }
    if (order.status === 'DELIVERED' || order.status === 'COMPLETED') {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot cancel delivered or completed orders. Please process as return.');
    }
    // Restore stock in transaction
    yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Update order status
        yield tx.order.update({
            where: { id: orderId },
            data: { status: 'CANCEL' },
        });
        // Restore stock for each item
        for (const item of order.orderItems) {
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
                        notes: `Order ${order.invoice} cancelled - Stock restored`,
                    },
                });
            }
        }
    }));
    return yield client_1.prisma.order.findUnique({
        where: { id: orderId },
        include: {
            customer: { select: { id: true, name: true, imageUrl: true } },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        },
    });
});
// ✅ Return Order and Restore Stock
const returnOrder = (orderId, returnReason) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield client_1.prisma.order.findUnique({
        where: { id: orderId },
        include: {
            orderItems: {
                include: {
                    variant: true,
                },
            },
        },
    });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    }
    if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Only delivered or completed orders can be returned');
    }
    // Process return in transaction
    yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Update order status to RETURNED
        yield tx.order.update({
            where: { id: orderId },
            data: {
                status: 'RETURNED',
                additionalNotes: returnReason
                    ? `${order.additionalNotes || ''}\nReturn Reason: ${returnReason}`
                    : order.additionalNotes,
            },
        });
        // Restore stock for each item
        for (const item of order.orderItems) {
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
                        change: item.quantity,
                        reason: 'RETURN',
                        notes: `Order ${order.invoice} returned${returnReason ? ` - ${returnReason}` : ''}`,
                    },
                });
            }
        }
    }));
    return yield client_1.prisma.order.findUnique({
        where: { id: orderId },
        include: {
            customer: { select: { id: true, name: true, imageUrl: true } },
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        },
    });
});
// ✅ Get User Orders
const getUserOrders = (userId, queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams);
    const prismaQuery = queryBuilder.buildSort().buildPagination().getQuery();
    const where = { customerId: userId };
    const [orders, totalOrders, totalAmount] = yield Promise.all([
        client_1.prisma.order.findMany(Object.assign(Object.assign({}, prismaQuery), { where, include: {
                orderItems: {
                    include: {
                        product: { select: { id: true, name: true, primaryImage: true } },
                        variant: {
                            include: {
                                color: { select: { id: true, colorName: true, hexCode: true } },
                            },
                        },
                    },
                },
            } })),
        client_1.prisma.order.count({ where }),
        client_1.prisma.order.aggregate({ where, _sum: { amount: true } }),
    ]);
    const meta = yield queryBuilder.getPaginationMeta({
        count: (args) => client_1.prisma.order.count({ where: args.where }),
    });
    return {
        meta,
        totalOrders,
        totalAmount: (_a = totalAmount._sum.amount) !== null && _a !== void 0 ? _a : 0,
        data: orders,
    };
});
// ✅ Get all orders for a specific user (My Orders)
const getMyOrders = (userId, queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams);
    const prismaQuery = queryBuilder.buildSort().buildPagination().getQuery();
    const where = { customerId: userId };
    const [orders, totalOrders, totalAmount] = yield Promise.all([
        client_1.prisma.order.findMany(Object.assign(Object.assign({}, prismaQuery), { where, include: {
                orderItems: {
                    include: {
                        product: { select: { id: true, name: true, primaryImage: true } },
                        variant: {
                            include: {
                                color: { select: { id: true, colorName: true, hexCode: true } },
                            },
                        },
                    },
                },
            } })),
        client_1.prisma.order.count({ where }),
        client_1.prisma.order.aggregate({ where, _sum: { amount: true } }),
    ]);
    const meta = yield queryBuilder.getPaginationMeta({
        count: (args) => client_1.prisma.order.count({ where: args.where }),
    });
    return {
        meta,
        totalOrders,
        totalAmount: (_a = totalAmount._sum.amount) !== null && _a !== void 0 ? _a : 0,
        data: orders,
    };
});
// ✅ Get a single order belonging to logged-in user
const getMyOrder = (userId, orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield client_1.prisma.order.findFirst({
        where: { id: orderId, customerId: userId },
        include: {
            orderItems: {
                include: {
                    product: { select: { id: true, name: true, primaryImage: true } },
                    variant: true,
                },
            },
        },
    });
    if (!order)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    return order;
});
// ✅ Get all customers who have orders (for admin)
const getAllCustomers = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams);
    const prismaQuery = queryBuilder.buildSort().buildPagination().getQuery();
    const customers = yield client_1.prisma.user.findMany(Object.assign(Object.assign({}, prismaQuery), { where: {
            customerOrders: {
                some: {},
            },
        }, select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            imageUrl: true,
            _count: { select: { customerOrders: true } },
        } }));
    const meta = yield queryBuilder.getPaginationMeta({
        count: (args) => client_1.prisma.user.count({
            where: {
                customerOrders: { some: {} },
            },
        }),
    });
    return { meta, data: customers };
});
exports.OrderServices = {
    getAllOrders,
    getOrderById,
    createOrderWithCartItems,
    updateOrderStatus,
    cancelOrder,
    returnOrder,
    getUserOrders,
    getMyOrders,
    getMyOrder,
    getAllCustomers,
};
