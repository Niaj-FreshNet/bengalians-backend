"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialRoutes = void 0;
const express_1 = require("express");
const material_controller_1 = require("./material.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
router.get('/get-all-materials', material_controller_1.MaterialController.getAllMaterials);
router.post('/create-material', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), material_controller_1.MaterialController.createMaterial);
router.get('/get-material/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), material_controller_1.MaterialController.getMaterial);
router.patch('/update-material/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), material_controller_1.MaterialController.updateMaterial);
router.delete('/delete-material/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), material_controller_1.MaterialController.deleteMaterial);
exports.MaterialRoutes = router;
