"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockRoutes = void 0;
const express_1 = require("express");
const stock_controller_1 = require("./stock.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
// Get all products with stock
router.get('/get-all-products', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), stock_controller_1.StockController.getAllProducts);
// Get low stock products
router.get('/get-low-stock-products', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), stock_controller_1.StockController.getLowStockProducts);
// Add stock
router.post('/add-stock', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), stock_controller_1.StockController.addStock);
// Get stock logs for a product
router.get('/get-stock-logs/:productId', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), stock_controller_1.StockController.getStockLogs);
exports.StockRoutes = router;
