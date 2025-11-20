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
exports.ExpenseController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const expense_service_1 = require("./expense.service");
// Create an expense
const createExpense = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    const userId = req.user.id; // ADMIN or SUPER_ADMIN creating the expense
    const result = yield expense_service_1.ExpenseServices.createExpense(payload, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Expense added successfully' : 'Expense creation failed',
        data: result !== null && result !== void 0 ? result : null,
    });
}));
// Get all expenses
const getAllExpenses = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield expense_service_1.ExpenseServices.getAllExpenses(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Expenses fetched successfully' : 'Failed to fetch expenses',
        data: result !== null && result !== void 0 ? result : [],
    });
}));
// Get expense by ID
const getExpenseById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield expense_service_1.ExpenseServices.getExpenseById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Expense fetched successfully' : 'Expense not found',
        data: result !== null && result !== void 0 ? result : null,
    });
}));
// Update expense status
const updateExpenseStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const expenseId = req.params.id;
    const payload = req.body; // e.g., { status: "COMPLETED" }
    const result = yield expense_service_1.ExpenseServices.updateExpenseStatus(expenseId, payload);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Expense status updated successfully' : 'Failed to update expense status',
        data: result !== null && result !== void 0 ? result : null,
    });
}));
// Expense analytics
const getExpenseAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield expense_service_1.ExpenseServices.getExpenseAnalytics(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Expense analytics fetched successfully' : 'Failed to fetch analytics',
        data: result !== null && result !== void 0 ? result : {},
    });
}));
exports.ExpenseController = {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpenseStatus,
    getExpenseAnalytics,
};
