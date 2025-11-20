"use strict";
// src/controllers/discount.controller.ts
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
exports.DiscountController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const discount_service_1 = require("./discount.service");
const createDiscount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield discount_service_1.DiscountServices.createDiscount(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: "Discount created",
        data: result,
    });
}));
const getAllAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield discount_service_1.DiscountServices.getAllAdmin();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Discounts fetched",
        data: result,
    });
}));
const updateDiscount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield discount_service_1.DiscountServices.updateDiscount(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Discount updated",
        data: result,
    });
}));
const deleteDiscount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield discount_service_1.DiscountServices.deleteDiscount(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Discount deleted",
    });
}));
const applyDiscount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, items } = req.body;
    const result = yield discount_service_1.DiscountServices.applyDiscount(code, items);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Discount applied",
        data: result,
    });
}));
exports.DiscountController = {
    createDiscount,
    getAllAdmin,
    updateDiscount,
    deleteDiscount,
    applyDiscount,
};
