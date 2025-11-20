"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverviewRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const overview_controller_1 = require("./overview.controller");
const router = (0, express_1.Router)();
// Dashboard Overview
router.get('/get-overview', (0, auth_1.default)('ADMIN'), overview_controller_1.OverviewController.getOverview);
router.get('/get-weekly-overview', (0, auth_1.default)('ADMIN'), overview_controller_1.OverviewController.getWeeklyOverview);
router.get('/get-weekly-sales', (0, auth_1.default)('ADMIN'), overview_controller_1.OverviewController.getWeeklySales);
exports.OverviewRoutes = router;
