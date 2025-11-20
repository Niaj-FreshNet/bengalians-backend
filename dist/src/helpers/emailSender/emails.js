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
exports.sendOrderNotificationToAdmin = exports.sendOrderConfirmationEmail = exports.sendFeedbackEmail = exports.sendPasswordResetSuccessEmail = exports.sendPasswordResetEmail = exports.sendWelcomeEmail = exports.sendVerificationEmail = void 0;
const brevo_config_1 = require("./brevo.config");
const emailTemplates_1 = require("./emailTemplates");
const sendVerificationEmail = (to, token) => __awaiter(void 0, void 0, void 0, function* () {
    const template = emailTemplates_1.VERIFICATION_EMAIL_TEMPLATE.replace('{verificationCode}', token);
    const response = yield (0, brevo_config_1.sendEmail)([{ email: to }], 'Verify Your Account', template);
    return response;
});
exports.sendVerificationEmail = sendVerificationEmail;
const sendWelcomeEmail = (to, name) => __awaiter(void 0, void 0, void 0, function* () {
    const template = emailTemplates_1.WELCOME_EMAIL_TEMPLATE.replace('{name}', name);
    const response = yield (0, brevo_config_1.sendEmail)([{ email: to }], 'Welcome to Your App', template);
    return response;
});
exports.sendWelcomeEmail = sendWelcomeEmail;
//forgot password
const sendPasswordResetEmail = (to, token) => __awaiter(void 0, void 0, void 0, function* () {
    const template = emailTemplates_1.PASSWORD_RESET_REQUEST_TEMPLATE.replace('{resetURL}', token);
    const response = yield (0, brevo_config_1.sendEmail)([{ email: to }], 'Password Reset Request', template);
    return response;
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendPasswordResetSuccessEmail = (to) => __awaiter(void 0, void 0, void 0, function* () {
    const template = emailTemplates_1.PASSWORD_RESET_SUCCESS_TEMPLATE;
    const response = yield (0, brevo_config_1.sendEmail)([{ email: to }], 'Password Reset Success', template);
    return response;
});
exports.sendPasswordResetSuccessEmail = sendPasswordResetSuccessEmail;
const sendFeedbackEmail = (name, email, subject, message) => __awaiter(void 0, void 0, void 0, function* () {
    const template = emailTemplates_1.CONTACT_FORM_TEMPLATE.replace('{name}', name)
        .replace('{subject}', subject)
        .replace('{message}', message)
        .replace(/{email}/g, email);
    const response = yield (0, brevo_config_1.sendEmail)([{ email: 'azizultushar98@gmail.com' }], `New Contact Message: ${subject}`, template);
    console.log(`see response`, response);
    return response;
});
exports.sendFeedbackEmail = sendFeedbackEmail;
const sendOrderConfirmationEmail = (to, order) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, address, zipcode, phone, amount, cartItems } = order;
    // Build item list with updated fields
    const itemsHTML = cartItems
        .map((item) => {
        var _a;
        return `
        <li style="display: flex; align-items: center; margin-bottom: 15px;">
          <img src="${((_a = item.productImageUrls) === null || _a === void 0 ? void 0 : _a[0]) || ''}" alt="${item.productName}" 
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px; margin-right: 15px;" />
          <div>
            <p style="margin: 0 0 5px 0; font-weight: bold;">${item.productName}</p>
            <p style="margin: 0;">Size: ${item.size} | Color: ${item.color}</p>
            <p style="margin: 0;">Quantity: ${item.quantity}</p>
            ${item.price
            ? `<p style="margin: 0;">Unit Price: $${item.price.toFixed(2)}</p>`
            : ''}
          </div>
        </li>`;
    })
        .join('');
    // Inject values into the email template
    const template = emailTemplates_1.ORDER_CONFIRMATION_TEMPLATE.replace(/{email}/g, email)
        .replace(/{address}/g, address || 'N/A')
        .replace(/{zipcode}/g, zipcode || 'N/A')
        .replace(/{phone}/g, phone || 'N/A')
        .replace(/{amount}/g, (amount || 0).toFixed(2))
        .replace(/{items}/g, itemsHTML);
    // Send the email
    const response = yield (0, brevo_config_1.sendEmail)([{ email: to }], 'Your Order Confirmation', template);
    return response;
});
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
const sendOrderNotificationToAdmin = (to, order) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, address, zipcode, phone, amount, cartItems, id, date, note } = order;
    // Build item list with updated fields
    const itemsHTML = cartItems
        .map((item) => {
        var _a;
        return `
        <li style="display: flex; align-items: center; margin-bottom: 15px;">
          <img src="${((_a = item.productImageUrls) === null || _a === void 0 ? void 0 : _a[0]) || ''}" alt="${item.productName}" 
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px; margin-right: 15px;" />
          <div>
            <p style="margin: 0 0 5px 0; font-weight: bold;">${item.productName}</p>
            <p style="margin: 0;">Size: ${item.size} | Color: ${item.color}</p>
            <p style="margin: 0;">Quantity: ${item.quantity}</p>
            ${item.price
            ? `<p style="margin: 0;">Unit Price: $${item.price.toFixed(2)}</p>`
            : ''}
          </div>
        </li>`;
    })
        .join('');
    const template = emailTemplates_1.ORDER_NOTIFICATION_TO_ADMIN_TEMPLATE.replace(/{orderId}/g, id)
        .replace(/{email}/g, email)
        .replace(/{address}/g, address || 'N/A')
        .replace(/{zipcode}/g, zipcode || 'N/A')
        .replace(/{phone}/g, phone || 'N/A')
        .replace(/{date}/g, date || '')
        .replace(/{note}/g, note || 'N/A')
        .replace(/{amount}/g, (amount || 0).toFixed(2))
        .replace(/{items}/g, itemsHTML);
    return yield (0, brevo_config_1.sendEmail)([{ email: to }], 'New Order Received', template);
});
exports.sendOrderNotificationToAdmin = sendOrderNotificationToAdmin;
