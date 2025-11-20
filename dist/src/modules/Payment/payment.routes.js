"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
router.post('/create-checkout-session', (0, auth_1.default)('ADMIN', 'USER'), payment_controller_1.PaymentController.createCheckoutSession);
router.post('/get-all-payment-history', (0, auth_1.default)('ADMIN'), payment_controller_1.PaymentController.getAllPaymentHistory);
exports.PaymentRoutes = router;
