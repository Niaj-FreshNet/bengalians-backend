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
exports.CartItemServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../prisma/client");
exports.CartItemServices = {
    // ✅ Add a product/variant to cart - UPDATED FOR APPAREL
    addToCart(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // ✅ Validate variant exists and get price
            const variant = yield client_1.prisma.productVariant.findUnique({
                where: { id: payload.variantId },
                select: {
                    id: true,
                    size: true,
                    color: true, // scalar field, use select instead of include
                    stock: true,
                    price: true,
                    product: { select: { id: true, name: true, published: true } },
                },
            });
            if (!variant) {
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Product variant not found');
            }
            // Check if product is published
            if (!variant.product.published) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'This product is not available');
            }
            // ✅ Check stock availability
            if (variant.stock < payload.quantity) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Insufficient stock. Only ${variant.stock} items available for ${variant.product.name} - ${variant.color} (Size: ${variant.size})`);
            }
            const price = variant.price;
            // ✅ Check if the item already exists (same user/guest + product + variant)
            const existingItem = yield client_1.prisma.cartItem.findFirst({
                where: {
                    productId: payload.productId,
                    variantId: payload.variantId,
                    userId: (_a = payload.userId) !== null && _a !== void 0 ? _a : null,
                    status: 'IN_CART',
                },
            });
            if (existingItem) {
                const newQuantity = existingItem.quantity + payload.quantity;
                // Check if new quantity exceeds stock
                if (newQuantity > variant.stock) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot add ${payload.quantity} more. Only ${variant.stock - existingItem.quantity} items available`);
                }
                // ✅ If exists, just update quantity
                return client_1.prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: {
                        quantity: newQuantity,
                        updatedAt: new Date(),
                    },
                    include: {
                        product: { select: { id: true, name: true, primaryImage: true, slug: true } },
                        variant: {
                            select: {
                                id: true,
                                size: true,
                                color: true, // scalar field
                                stock: true,
                                price: true,
                                product: { select: { name: true } }, // relation
                            },
                        },
                    },
                });
            }
            // ✅ Create new cart item
            return client_1.prisma.cartItem.create({
                data: {
                    userId: (_b = payload.userId) !== null && _b !== void 0 ? _b : null,
                    productId: payload.productId,
                    variantId: payload.variantId,
                    quantity: payload.quantity,
                    price,
                    status: 'IN_CART',
                },
                include: {
                    product: { select: { id: true, name: true, primaryImage: true, slug: true } },
                    variant: {
                        select: {
                            id: true,
                            size: true,
                            color: true, // scalar field
                            stock: true,
                            price: true,
                            product: { select: { name: true } }, // relation
                        },
                    },
                },
            });
        });
    },
    // ✅ Get user (or guest) cart
    // ✅ Get user (or guest) cart
    getUserCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cartItems = yield client_1.prisma.cartItem.findMany({
                where: {
                    userId: userId !== null && userId !== void 0 ? userId : null,
                    status: 'IN_CART',
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            primaryImage: true,
                            slug: true,
                            published: true,
                        },
                    },
                    variant: {
                        select: {
                            id: true,
                            sku: true,
                            size: true,
                            color: true, // scalar field (string)
                            stock: true,
                            price: true,
                            // Relation
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            // ⛔ Fix subtotal: item.price is NOT available directly on cartItem
            // Because your schema stores variant price, unless you also keep price on cartItem
            // If you DO store price on cartItem, leave it as item.price
            // If NOT, use item.variant.price instead
            const subtotal = cartItems.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            return {
                items: cartItems,
                summary: {
                    subtotal,
                    totalItems,
                    itemCount: cartItems.length,
                },
            };
        });
    },
    // ✅ Update quantity of cart item - WITH STOCK VALIDATION
    updateCartItem(id, quantity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (quantity < 1) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Quantity must be at least 1');
            }
            const item = yield client_1.prisma.cartItem.findUnique({
                where: { id },
                include: {
                    variant: {
                        select: {
                            id: true,
                            size: true,
                            color: true, // scalar
                            stock: true,
                            price: true,
                            product: { select: { name: true } },
                        },
                    },
                },
            });
            if (!item) {
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Cart item not found');
            }
            if (!item.variant) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Variant not found for this cart item');
            }
            // Check stock availability
            if (quantity > item.variant.stock) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot set quantity to ${quantity}. Only ${item.variant.stock} items available for ${item.variant.product.name} - ${item.variant.color} (Size: ${item.variant.size})`);
            }
            return client_1.prisma.cartItem.update({
                where: { id },
                data: { quantity, updatedAt: new Date() },
                include: {
                    product: { select: { id: true, name: true, primaryImage: true, slug: true } },
                    variant: true,
                },
            });
        });
    },
    // ✅ Remove a specific cart item
    removeCartItem(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield client_1.prisma.cartItem.findUnique({ where: { id } });
            if (!item) {
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Cart item not found');
            }
            return client_1.prisma.cartItem.delete({ where: { id } });
        });
    },
    // ✅ Clear entire cart for user
    clearCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield client_1.prisma.cartItem.deleteMany({
                where: {
                    userId: userId !== null && userId !== void 0 ? userId : null,
                    status: 'IN_CART',
                },
            });
            return { deletedCount: result.count };
        });
    },
    // ✅ Validate cart before checkout
    validateCart(cartItemIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const cartItems = yield client_1.prisma.cartItem.findMany({
                where: {
                    id: { in: cartItemIds },
                    status: 'IN_CART',
                },
                include: {
                    product: {
                        select: { id: true, name: true, published: true },
                    },
                    variant: true,
                },
            });
            if (cartItems.length === 0) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'No valid cart items found');
            }
            const issues = [];
            // Check each item for stock availability and product status
            for (const item of cartItems) {
                // Check if product is published
                if (!item.product.published) {
                    issues.push(`${item.product.name} is no longer available`);
                    continue;
                }
                // Check if variant exists
                if (!item.variant) {
                    issues.push(`Variant not found for ${item.product.name}`);
                    continue;
                }
                // Check stock
                if (item.variant.stock < item.quantity) {
                    issues.push(`Insufficient stock for ${item.product.name} - ${item.variant.color} (Size: ${item.variant.size}). Available: ${item.variant.stock}, Requested: ${item.quantity}`);
                }
            }
            if (issues.length > 0) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cart validation failed:\n${issues.join('\n')}`);
            }
            return {
                valid: true,
                items: cartItems,
                totalAmount: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            };
        });
    },
    // ✅ Get cart item by ID
    getCartItem(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield client_1.prisma.cartItem.findUnique({
                where: { id },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            primaryImage: true,
                            slug: true,
                            published: true,
                        },
                    },
                    variant: true,
                },
            });
            if (!item) {
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Cart item not found');
            }
            return item;
        });
    },
    // ✅ Merge guest cart with user cart (after login)
    mergeGuestCart(guestCartItems, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const items = yield client_1.prisma.cartItem.findMany({
                where: {
                    id: { in: guestCartItems },
                    status: 'IN_CART',
                    userId: null, // Only guest items
                },
                include: {
                    variant: true,
                },
            });
            if (items.length === 0)
                return { mergedCount: 0 };
            let mergedCount = 0;
            for (const item of items) {
                // Check if user already has this variant in cart
                const existingUserItem = yield client_1.prisma.cartItem.findFirst({
                    where: {
                        userId,
                        productId: item.productId,
                        variantId: item.variantId,
                        status: 'IN_CART',
                    },
                });
                if (existingUserItem) {
                    // Merge quantities (with stock check)
                    const newQuantity = existingUserItem.quantity + item.quantity;
                    const maxStock = (_b = (_a = item.variant) === null || _a === void 0 ? void 0 : _a.stock) !== null && _b !== void 0 ? _b : 0;
                    yield client_1.prisma.cartItem.update({
                        where: { id: existingUserItem.id },
                        data: {
                            quantity: Math.min(newQuantity, maxStock),
                            updatedAt: new Date(),
                        },
                    });
                    // Delete guest cart item
                    yield client_1.prisma.cartItem.delete({ where: { id: item.id } });
                }
                else {
                    // Transfer ownership to user
                    yield client_1.prisma.cartItem.update({
                        where: { id: item.id },
                        data: { userId, updatedAt: new Date() },
                    });
                }
                mergedCount++;
            }
            return { mergedCount };
        });
    },
    // ✅ Get cart count for user
    getCartCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield client_1.prisma.cartItem.count({
                where: {
                    userId: userId !== null && userId !== void 0 ? userId : null,
                    status: 'IN_CART',
                },
            });
            return { count };
        });
    },
};
