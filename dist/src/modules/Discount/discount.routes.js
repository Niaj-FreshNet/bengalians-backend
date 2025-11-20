"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountRoutes = void 0;
// src/routes/discount.route.ts
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const discount_controller_1 = require("./discount.controller");
const router = (0, express_1.Router)();
router.post("/create", (0, auth_1.default)("ADMIN", "SUPER_ADMIN"), discount_controller_1.DiscountController.createDiscount);
router.get("/admin", (0, auth_1.default)("ADMIN", "SUPER_ADMIN"), discount_controller_1.DiscountController.getAllAdmin);
router.patch("/:id", (0, auth_1.default)("ADMIN", "SUPER_ADMIN"), discount_controller_1.DiscountController.updateDiscount);
router.delete("/:id", (0, auth_1.default)("ADMIN", "SUPER_ADMIN"), discount_controller_1.DiscountController.deleteDiscount);
// Public endpoint – no auth (used by checkout)
router.post("/apply", discount_controller_1.DiscountController.applyDiscount);
exports.DiscountRoutes = router;
