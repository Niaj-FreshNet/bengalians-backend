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
exports.OrderController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const order_service_1 = require("./order.service");
const order_constant_1 = require("./order.constant");
// Create Order (Customer OR Guest)
const createOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null; // Optional Auth user
    const { cartItemIds, amount, isPaid, method, saleType, shippingCost, additionalNotes, shippingAddress, billingAddress, orderSource, customerInfo } = req.body;
    // Validation
    if (!cartItemIds || !Array.isArray(cartItemIds) || cartItemIds.length === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, order_constant_1.ORDER_ERROR_MESSAGES.EMPTY_ORDER);
    }
    if (!amount || amount <= 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, order_constant_1.ORDER_ERROR_MESSAGES.TOTAL_AMOUNT_INVALID);
    }
    // ✅ Build payload
    const payload = {
        customerId: userId, // can be null for guests
        amount,
        isPaid: isPaid || false,
        method,
        orderSource: orderSource || 'WEBSITE',
        cartItemIds,
        customerInfo: customerInfo || null, // for guest user data (name, phone, etc.)
        saleType,
        shippingCost,
        additionalNotes,
        shippingAddress,
        billingAddress,
    };
    // ✅ Create order through service
    const result = yield order_service_1.OrderServices.createOrderWithCartItems(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Order created successfully',
        data: result,
    });
}));
// Get All Orders (Admin)
const getAllOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_service_1.OrderServices.getAllOrders(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Orders fetched successfully' : 'Orders fetching failed',
        data: result || [],
    });
}));
// Get Order By ID (Admin)
const getOrderById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_service_1.OrderServices.getOrderById(req.params.id);
    if (!result)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, order_constant_1.ORDER_ERROR_MESSAGES.NOT_FOUND);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order fetched successfully',
        data: result,
    });
}));
// Get User Orders (Admin view)
const getUserOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_service_1.OrderServices.getUserOrders(req.params.id, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Orders fetched successfully',
        data: result,
    });
}));
// Update Order Status (Admin)
const updateOrderStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_service_1.OrderServices.updateOrderStatus(req.params.id, req.body);
    if (!result)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, order_constant_1.ORDER_ERROR_MESSAGES.STATUS_UPDATE_FAILED);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order status updated successfully',
        data: result,
    });
}));
// Get Logged-in User Orders
const getMyOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield order_service_1.OrderServices.getMyOrders(userId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Orders fetched successfully',
        data: result,
    });
}));
// Get Logged-in User Single Order
const getMyOrderByID = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield order_service_1.OrderServices.getMyOrder(userId, req.params.id);
    if (!result)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, order_constant_1.ORDER_ERROR_MESSAGES.NOT_FOUND);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order fetched successfully',
        data: result,
    });
}));
// Get All Customers (Admin)
const getAllCustomers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_service_1.OrderServices.getAllCustomers(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Customers fetched successfully',
        data: result,
    });
}));
exports.OrderController = {
    createOrder,
    getAllOrders,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    getMyOrders,
    getMyOrderByID,
    getAllCustomers,
};
