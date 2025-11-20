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
exports.AuthController = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const auth_service_1 = require("./auth.service");
const auth_validation_1 = require("./auth.validation");
const register = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.AuthServices.register(req.body);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 201 : 400,
        success: isok,
        message: isok
            ? 'Registration Successfull please verify your email!'
            : 'Registration Failed',
        data: isok ? result : [],
    });
}));
const verifyEmail = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, email } = req.body;
    const result = yield auth_service_1.AuthServices.verifyEmail(email, token);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok,
        message: isok
            ? 'Email Verification Successfull'
            : 'Email Verification Failed',
        data: isok ? result : [],
    });
}));
const login = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const result = yield auth_service_1.AuthServices.login({ email, password });
    if (!result) {
        return (0, sendResponse_1.default)(res, {
            statusCode: 400,
            success: false,
            message: 'Login Failed',
            data: [],
        });
    }
    // set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Login Successful',
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
}));
const forgotPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const result = yield auth_service_1.AuthServices.forgotPassword(email);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok,
        message: isok
            ? 'Password Reset Link Sent To Your Email Successfully!'
            : 'Password Reset Link Sent To Your Email Failed',
    });
}));
const resetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.params.token;
    const { email, newPassword } = req.body;
    const result = yield auth_service_1.AuthServices.resetPassword(email, token, newPassword);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok,
        message: isok ? 'Password Reset Successfull' : 'Password Reset Failed',
    });
}));
const changePassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.user;
    const { oldPassword, newPassword } = auth_validation_1.authValidation.changePasswordValidationSchema.parse(req.body);
    // console.log(email, oldPassword, newPassword);
    const result = yield auth_service_1.AuthServices.changePassword(email, oldPassword, newPassword);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok,
        message: isok ? 'Password Changed Successfull' : 'Password Change Failed',
    });
}));
const refreshToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies['refreshToken'];
    if (!token) {
        throw new AppError_1.default(401, 'Refresh token missing');
    }
    const result = yield auth_service_1.AuthServices.refreshToken(token);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result
            ? 'Access Token Generated Successfully'
            : 'Access Token Generation Failed',
        data: result || [],
    });
}));
const resendVerifyEmail = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        throw new AppError_1.default(400, 'Email is required');
    }
    const result = yield auth_service_1.AuthServices.resendVerifyEmail(email);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok,
        message: isok
            ? 'Verification Email Sent Successfully!'
            : 'Verification Email Sending Failed',
    });
}));
const makeAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.AuthServices.makeAdmin(req.body);
    // set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Admin created/updated successfully!',
        data: {
            user: result.result,
            accessToken: result.accessToken,
        },
    });
}));
const makeSalesman = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.AuthServices.makeSalesman(req.body);
    // set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Salesman created/updated successfully!',
        data: {
            user: result.result,
            accessToken: result.accessToken,
        },
    });
}));
const socialLogin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.AuthServices.socialLogin(req.body);
    // set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Login Successful',
        data: {
            user: result.user,
            accessToken: result.accessToken,
        },
    });
}));
const getMe = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('req.user:', req.user);
    // console.log('req.user?.id:', req.user?.id);
    var _a;
    const user = yield auth_service_1.AuthServices.getMe((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User retrieved successfully',
        data: user,
    });
}));
const logout = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Logged out successfully',
    });
}));
exports.AuthController = {
    register,
    verifyEmail,
    login,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshToken,
    resendVerifyEmail,
    makeAdmin,
    makeSalesman,
    socialLogin,
    getMe,
    logout
};
