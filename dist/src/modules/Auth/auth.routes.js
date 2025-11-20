"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_validation_1 = require("./auth.validation");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
// Public routes
router.post('/register', (0, validateRequest_1.default)(auth_validation_1.authValidation.UserRegisterValidationSchema), auth_controller_1.AuthController.register);
router.post('/verify-email', auth_controller_1.AuthController.verifyEmail);
router.post('/login', (0, validateRequest_1.default)(auth_validation_1.authValidation.UserLoginValidationSchema), auth_controller_1.AuthController.login);
router.post('/forgot-password', auth_controller_1.AuthController.forgotPassword);
router.post('/reset-password/:token', auth_controller_1.AuthController.resetPassword);
router.post('/social-login', auth_controller_1.AuthController.socialLogin);
// Protected routes
router.post('/change-password', (0, auth_1.default)('ADMIN', 'USER'), auth_controller_1.AuthController.changePassword);
router.post('/refresh-token', auth_controller_1.AuthController.refreshToken);
router.post('/resend-verify-email-token', auth_controller_1.AuthController.resendVerifyEmail);
router.post('/make-admin', (0, auth_1.default)('SUPER_ADMIN'), auth_controller_1.AuthController.makeAdmin);
router.post('/make-salesman', (0, auth_1.default)('ADMIN'), auth_controller_1.AuthController.makeSalesman);
router.get('/get-me', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN', 'SALESMAN', 'USER'), auth_controller_1.AuthController.getMe);
// Logout route
router.post('/logout', auth_controller_1.AuthController.logout);
exports.AuthRoutes = router;
