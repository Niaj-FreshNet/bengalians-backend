"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseRoutes = void 0;
const express_1 = require("express");
const expense_controller_1 = require("./expense.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
// Create an expense
router.post('/create-expense', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), expense_controller_1.ExpenseController.createExpense);
// Get all expenses (admin overview)
router.get('/get-all-expenses', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), expense_controller_1.ExpenseController.getAllExpenses);
// Get expense by ID
router.get('/get-expense-by-id/:id', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), expense_controller_1.ExpenseController.getExpenseById);
// Update expense status
router.patch('/update-expense-status/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), expense_controller_1.ExpenseController.updateExpenseStatus);
// Analytics for expenses
router.get('/get-expense-analytics', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), expense_controller_1.ExpenseController.getExpenseAnalytics);
exports.ExpenseRoutes = router;
