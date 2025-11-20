"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FabricRoutes = void 0;
const express_1 = require("express");
const fabric_controller_1 = require("./fabric.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
router.get('/get-all-Fabrics', fabric_controller_1.FabricController.getAllFabrics);
router.post('/create-fabric', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), fabric_controller_1.FabricController.createFabric);
router.get('/get-fabric/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), fabric_controller_1.FabricController.getFabric);
router.patch('/update-fabric/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), fabric_controller_1.FabricController.updateFabric);
router.delete('/delete-fabric/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), fabric_controller_1.FabricController.deleteFabric);
exports.FabricRoutes = router;
