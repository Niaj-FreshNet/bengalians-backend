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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentServices = void 0;
const emails_1 = require("../../helpers/emailSender/emails");
const client_1 = require("../../../prisma/client");
const generateInvoice_1 = require("../../helpers/generateInvoice");
const handleCheckoutSessionCompleted = (session) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Inside handleCheckoutSessionCompleted');
    const userId = session.metadata.userId;
    const cartItems = JSON.parse(session.metadata.cart); // [{ variantId, quantity }]
    // Fetch address, phone, note from metadata, with fallback to empty values
    const address = session.metadata.address
        ? JSON.parse(session.metadata.address)
        : {};
    const phone = session.metadata.phone || '';
    const zipcode = session.metadata.zipcode || '';
    const note = session.metadata.note || '';
    // Format address into string
    const formattedAddress = [
        address.line1 || '',
        address.line2 || '',
        address.city || '',
        address.country || '',
    ]
        .filter(Boolean)
        .join(', ');
    // Step 1: Extract variantIds
    const variantIds = cartItems.map((item) => item.variantId);
    // Step 2: Fetch variant details from DB (include product)
    const variants = yield client_1.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
    });
    // Step 3: Merge variant + product details with quantity from cart
    const detailedCartItems = cartItems.map((item) => {
        const variant = variants.find((v) => v.id === item.variantId);
        if (!variant) {
            throw new Error(`Variant not found for ID: ${item.variantId}`);
        }
        return {
            variantId: variant.id,
            productId: variant.product.id,
            productName: variant.product.name,
            productImageUrls: variant.product.primaryImage,
            size: variant.size,
            // color: variant.color,
            quantity: item.quantity,
            price: variant.price,
        };
    });
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
    // Step 4: Save the order
    const order = yield client_1.prisma.order.create({
        data: {
            invoice: yield (0, generateInvoice_1.generateInvoice)(), // ✅ required field
            orderSource: "WEBSITE", // ✅ or another valid enum value
            saleType: "SINGLE", // ✅ if your model requires it
            customerId: userId,
            name: session.customer_details.name,
            method: "Stripe",
            email: session.customer_details.email,
            address: formattedAddress,
            phone,
            additionalNotes: note,
            amount: totalAmount,
            isPaid: true,
            cartItems: detailedCartItems,
        },
    });
    // Step 5: Reduce variant quantity and update product sales count
    for (const item of cartItems) {
        // Decrement variant quantity
        // await prisma.productVariant.update({
        //   where: { id: item.variantId },
        //   data: {
        //     quantity: { decrement: item.quantity },
        //   },
        // });
        // Increment product salesCount separately
        const variant = variants.find((v) => v.id === item.variantId);
        if (variant && variant.productId) {
            yield client_1.prisma.product.update({
                where: { id: variant.productId },
                data: {
                    salesCount: { increment: item.quantity },
                },
            });
        }
    }
    // Step 6: Send confirmation email (optional)
    yield (0, emails_1.sendOrderConfirmationEmail)(session.customer_details.email, {
        email: session.customer_details.email,
        id: order.id,
        date: new Date(order.createdAt).toLocaleDateString(),
        amount: totalAmount,
        address: formattedAddress,
        zipcode,
        phone,
        note,
        cartItems: detailedCartItems,
    });
    // step 7: send mail to admin
    yield (0, emails_1.sendOrderNotificationToAdmin)(process.env.ADMIN_EMAIL, {
        email: session.customer_details.email,
        id: order.id,
        date: new Date(order.createdAt).toLocaleDateString(),
        amount: totalAmount,
        address: formattedAddress,
        zipcode,
        phone,
        note,
        cartItems: detailedCartItems,
    });
});
exports.PaymentServices = { handleCheckoutSessionCompleted };
