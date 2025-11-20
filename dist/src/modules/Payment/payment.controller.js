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
exports.PaymentController = void 0;
const stripe_1 = __importDefault(require("../../config/stripe"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../prisma/client");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const payment_service_1 = require("./payment.service");
const config_1 = __importDefault(require("../../config"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const createCheckoutSession = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cart: cartItems, phone, address, zipcode, note } = req.body;
    const userId = req.user.id;
    // Get user email from DB
    const user = yield client_1.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
    });
    if (!user)
        throw new AppError_1.default(404, 'User not found');
    // Extract variant IDs
    const variantIds = cartItems.map((item) => item.variantId);
    // Fetch variants and related products
    const variants = yield client_1.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
    });
    if (!variants || variants.length !== cartItems.length) {
        throw new AppError_1.default(404, 'Some product variants not found');
    }
    // Quantity check
    // for (const item of cartItems) {
    //   const variant = variants.find((v) => v.id === item.variantId);
    //   if (!variant) {
    //     throw new AppError(404, `Variant not found for ID: ${item.variantId}`);
    //   }
    //   if (variant.quantity < item.quantity) {
    //     throw new AppError(
    //       400,
    //       `Insufficient stock for variant (Size: ${variant.size}, Color: ${variant.color}) of product "${variant.product.name}". Available: ${variant.quantity}, Requested: ${item.quantity}`,
    //     );
    //   }
    // }
    // Stripe line items
    const line_items = cartItems.map((item) => {
        var _a, _b;
        const variant = variants.find((v) => v.id === item.variantId);
        return {
            price_data: {
                currency: 'usd',
                unit_amount: Math.round(variant.price * 100),
                product_data: {
                    // name: `${variant.product.name} (${variant.size} / ${variant.color})`,
                    name: `${variant.product.name} (${variant.size})`,
                    description: variant.product.description,
                    images: [encodeURI((_b = (_a = variant.product.primaryImage) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : '')],
                },
            },
            quantity: item.quantity,
        };
    });
    // Create checkout session
    const session = yield stripe_1.default.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: user.email,
        success_url: `${config_1.default.client_url}/success`,
        cancel_url: `${config_1.default.client_url}/cancel`,
        line_items,
        metadata: {
            userId,
            cart: JSON.stringify(cartItems),
            phone: phone || '',
            zipcode: zipcode || '',
            note: note || '',
            address: JSON.stringify(address || {}),
        },
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Checkout Session Created Successfully',
        data: { url: session.url },
    });
}));
// Webhook
const webhook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('webhook called!!');
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event = req.body;
    try {
        event = stripe_1.default.webhooks.constructEvent(req.body, sig, webhookSecret);
        console.log('Webhook verified:', event.type);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err);
        res
            .status(400)
            .send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return;
    }
    if (event.type === 'checkout.session.completed') {
        yield payment_service_1.PaymentServices.handleCheckoutSessionCompleted(event.data.object);
    }
    res.status(200).json({ status: 'success' });
}));
const getAllPaymentHistory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const userId = req.user.id;
    // const payments = await prisma.payment.findMany({
    //   where: {
    //     userId,
    //   },
    //   include: {
    //     user: true,
    //     products: true,
    //   },
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    // });
    // sendResponse(res, {
    //   statusCode: 200,
    //   success: true,
    //   message: 'Payment history retrieved successfully',
    //   Data: payments,
    // });
}));
exports.PaymentController = {
    createCheckoutSession,
    webhook,
    getAllPaymentHistory,
};
