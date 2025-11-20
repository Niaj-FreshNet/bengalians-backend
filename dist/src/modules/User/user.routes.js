"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_controller_1 = require("./user.controller");
const fileUploader_1 = require("../../helpers/fileUploader");
const router = (0, express_1.Router)();
router.get('/get-all-users', (0, auth_1.default)('ADMIN'), user_controller_1.UserController.getAllUsers);
router.get('/get-user-by-id/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), user_controller_1.UserController.getUserByID);
router.get('/profile', (0, auth_1.default)('ADMIN', 'USER'), user_controller_1.UserController.getUser);
router.patch('/change-password', (0, auth_1.default)('ADMIN', 'USER'), user_controller_1.UserController.changePassword);
router.patch('/update-profile/:id', (0, auth_1.default)('ADMIN', 'USER'), fileUploader_1.upload.single('image'), user_controller_1.UserController.updateUser);
exports.UserRoutes = router;
