"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesRoutes = void 0;
const express_1 = require("express");
const sales_controller_1 = require("./sales.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
// Create a manual sale (done by SALESMAN or ADMIN)
router.post('/create-sale', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), sales_controller_1.SalesController.createSale);
// Get all sales (admin overview)
router.get('/get-all-sales', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), sales_controller_1.SalesController.getAllSales);
// Get sales by salesman (each salesman sees his own)
router.get('/my-sales', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), sales_controller_1.SalesController.getMySales);
router.get('/get-sale-by-id/:id', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), sales_controller_1.SalesController.getSaleById);
// Get sales by customer phone/name (walk-in tracking)
router.get('/get-sales-by-customer/:phone', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), sales_controller_1.SalesController.getSalesByCustomer);
// Update sale status (delivered/cancelled etc.)
router.patch('/update-sale-status/:id', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), sales_controller_1.SalesController.updateSaleStatus);
// Analytics for sales performance
router.get('/get-sales-analytics', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), sales_controller_1.SalesController.getSalesAnalytics);
exports.SalesRoutes = router;
