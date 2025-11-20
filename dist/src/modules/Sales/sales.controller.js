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
exports.SalesController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const sales_service_1 = require("./sales.service");
// Create a manual sale
const createSale = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    const userId = req.user.id; // SALESMAN or ADMIN creating the sale
    const result = yield sales_service_1.SaleServices.createSale(payload, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Sale added successfully' : 'Sale creation failed',
        data: result !== null && result !== void 0 ? result : null,
    });
}));
// Get all sales (admin)
const getAllSales = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield sales_service_1.SaleServices.getAllSales(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Sales fetched successfully' : 'Failed to fetch sales',
        data: result !== null && result !== void 0 ? result : [],
    });
}));
// Get sales for current salesman
const getMySales = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield sales_service_1.SaleServices.getMySales(userId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Sales fetched successfully' : 'Failed to fetch sales',
        data: result !== null && result !== void 0 ? result : [],
    });
}));
// Get Order By ID (Admin)
const getSaleById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield sales_service_1.SaleServices.getSaleById(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: true,
        message: 'Sale fetched successfully',
        data: result,
    });
}));
// Get sales by customer phone or name
const getSalesByCustomer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone } = req.params;
    const result = yield sales_service_1.SaleServices.getSalesByCustomer(phone, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Customer sales fetched successfully' : 'No sales found for this customer',
        data: result !== null && result !== void 0 ? result : [],
    });
}));
// Update sale status
const updateSaleStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const saleId = req.params.id;
    const payload = req.body; // e.g., { status: "DELIVERED" }
    const result = yield sales_service_1.SaleServices.updateSaleStatus(saleId, payload);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Sale status updated successfully' : 'Failed to update sale status',
        data: result !== null && result !== void 0 ? result : null,
    });
}));
// Sales analytics for admin
const getSalesAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield sales_service_1.SaleServices.getSalesAnalytics(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Sales analytics fetched successfully' : 'Failed to fetch analytics',
        data: result !== null && result !== void 0 ? result : {},
    });
}));
exports.SalesController = {
    createSale,
    getAllSales,
    getMySales,
    getSaleById,
    getSalesByCustomer,
    updateSaleStatus,
    getSalesAnalytics,
};
