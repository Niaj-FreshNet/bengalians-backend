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
exports.AuthServices = exports.resetPassword = void 0;
const config_1 = __importDefault(require("../../config"));
const client_1 = require("../../../prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const client_2 = require("@prisma/client");
const auth_utils_1 = require("./auth.utils");
const emails_1 = require("../../helpers/emailSender/emails");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const register = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // check if user already exists
    const existingUser = yield client_1.prisma.user.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (existingUser) {
        throw new AppError_1.default(400, 'User already exists with this email');
    }
    if (!payload.password) {
        throw new AppError_1.default(400, 'Password is required');
    }
    // Hash the password
    const password = yield bcrypt_1.default.hash(payload.password, Number(config_1.default.salt_round));
    // Update payload with hashed password
    payload.password = password;
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    (0, emails_1.sendVerificationEmail)(payload.email, verificationToken);
    // Create the user
    const result = yield client_1.prisma.user.create({
        data: Object.assign(Object.assign({}, payload), { role: payload.role, verificationToken,
            verificationTokenExpiry }),
    });
    // console.log('result', result);
    return result;
});
const verifyEmail = (email, token) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield client_1.prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (!user) {
        throw new AppError_1.default(404, 'User not found');
    }
    if (user.verificationToken !== token || !user.verificationTokenExpiry) {
        throw new AppError_1.default(400, 'Invalid verification token');
    }
    if ((user === null || user === void 0 ? void 0 : user.verificationTokenExpiry) < new Date()) {
        throw new AppError_1.default(401, 'Verification token has expired');
    }
    const updatedUser = yield client_1.prisma.user.update({
        where: {
            email,
        },
        data: {
            isVerified: true,
            verificationToken: null,
            verificationTokenExpiry: null,
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            imageUrl: true,
        },
    });
    const JwtPayload = {
        email: user.email,
        userId: user === null || user === void 0 ? void 0 : user.id,
        role: user.role,
    };
    //create toke and send to the client
    const accessToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.access_token_secret, config_1.default.access_token_expires);
    const refreshToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.refresh_token_secret, config_1.default.refresh_token_expires);
    return {
        message: 'User verified successfully',
        updatedUser,
        accessToken,
        refreshToken,
    };
});
const login = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield client_1.prisma.user.findUnique({
        where: {
            email: payload.email,
        },
        select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            isVerified: true,
            imageUrl: true,
        },
    });
    if (!user) {
        throw new AppError_1.default(404, 'Invalid credentials');
    }
    if (!user.isVerified) {
        throw new AppError_1.default(401, 'User is not verified');
    }
    const isPasswordMatched = yield bcrypt_1.default.compare(payload.password, user === null || user === void 0 ? void 0 : user.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(401, 'Invalid credentials');
    }
    const JwtPayload = {
        email: user.email,
        userId: user === null || user === void 0 ? void 0 : user.id,
        role: user.role,
    };
    //create toke and send to the client
    const accessToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.access_token_secret, config_1.default.access_token_expires);
    //refresh token
    const refreshToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.refresh_token_secret, config_1.default.refresh_token_expires);
    return {
        user,
        accessToken,
        refreshToken,
    };
});
const forgotPassword = (email) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email) {
        throw new AppError_1.default(400, 'Email is required');
    }
    const user = yield client_1.prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (!user) {
        throw new AppError_1.default(400, 'User not found with this email');
    }
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 1000 * 60 * 15); //15 minutes
    const link = `${config_1.default.live_url}/reset-password?email=${email}&token=${resetToken}`;
    yield (0, emails_1.sendPasswordResetEmail)(email, link);
    yield client_1.prisma.user.update({
        where: {
            email,
        },
        data: {
            resetToken,
            resetTokenExpiry: tokenExpiry,
        },
    });
    return true;
});
const resetPassword = (email, token, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield client_1.prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (!user) {
        throw new Error('User not found with this email');
    }
    if (user.resetToken !== token || !user.resetTokenExpiry) {
        throw new Error('Invalid reset token');
    }
    if ((user === null || user === void 0 ? void 0 : user.resetTokenExpiry) < new Date()) {
        throw new Error('Reset token has expired');
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, Number(config_1.default.salt_round));
    yield client_1.prisma.user.update({
        where: {
            email,
        },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        },
    });
    return true;
});
exports.resetPassword = resetPassword;
const changePassword = (email, oldPassword, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield client_1.prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (!user) {
        throw new AppError_1.default(400, 'User not found with this email');
    }
    if (!user.password) {
        throw new AppError_1.default(400, 'Password is required');
    }
    const isPasswordMatched = yield bcrypt_1.default.compare(oldPassword, user === null || user === void 0 ? void 0 : user.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(400, 'Invalid credentials password not matched!');
    }
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.salt_round));
    yield client_1.prisma.user.update({
        where: {
            email,
        },
        data: {
            password: hashedPassword,
        },
    });
    return true;
});
const refreshToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (!refreshToken) {
        throw new AppError_1.default(401, 'Refresh token is required');
    }
    const decoded = (0, auth_utils_1.verifyToken)(refreshToken, config_1.default.refresh_token_secret);
    if (!decoded) {
        throw new AppError_1.default(401, 'Invalid or expired refresh token!');
    }
    // console.log(decoded);
    const user = yield client_1.prisma.user.findUnique({
        where: {
            id: decoded.userId,
        },
    });
    if (!user) {
        throw new AppError_1.default(400, 'User not found with this refresh token');
    }
    const JwtPayload = {
        email: user.email,
        userId: user.id,
        role: user.role,
    };
    //create toke and send to the client
    const accessToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.access_token_secret, config_1.default.access_token_expires);
    return { accessToken };
});
const resendVerifyEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield client_1.prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (!user) {
        throw new AppError_1.default(400, 'User not found with this email');
    }
    if (user.isVerified) {
        throw new AppError_1.default(400, 'User is already verified');
    }
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    yield client_1.prisma.user.update({
        where: { email },
        data: {
            verificationToken,
            verificationTokenExpiry,
        },
    });
    (0, emails_1.sendVerificationEmail)(user.email, verificationToken);
    return true;
});
const makeAdmin = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = payload;
    let user = yield client_1.prisma.user.findUnique({ where: { email } });
    let result;
    if (user) {
        result = yield client_1.prisma.user.update({ where: { email }, data: { role: client_2.Role.ADMIN } });
    }
    else {
        result = yield client_1.prisma.user.create({
            data: {
                name,
                email,
                password: yield bcrypt_1.default.hash(password, Number(config_1.default.salt_round)),
                isVerified: true,
                role: client_2.Role.ADMIN,
            },
        });
    }
    const JwtPayload = { email: result.email, userId: result.id, role: result.role };
    const accessToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.access_token_secret, config_1.default.access_token_expires);
    const refreshToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.refresh_token_secret, config_1.default.refresh_token_expires);
    return { result, accessToken, refreshToken };
});
const makeSalesman = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = payload;
    let user = yield client_1.prisma.user.findUnique({ where: { email } });
    let result;
    if (user) {
        result = yield client_1.prisma.user.update({ where: { email }, data: { role: client_2.Role.SALESMAN } });
    }
    else {
        result = yield client_1.prisma.user.create({
            data: {
                name,
                email,
                password: yield bcrypt_1.default.hash(password, Number(config_1.default.salt_round)),
                isVerified: true,
                role: client_2.Role.SALESMAN,
            },
        });
    }
    const JwtPayload = { email: result.email, userId: result.id, role: result.role };
    const accessToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.access_token_secret, config_1.default.access_token_expires);
    const refreshToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.refresh_token_secret, config_1.default.refresh_token_expires);
    return { result, accessToken, refreshToken };
});
const socialLogin = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    let user = yield client_1.prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
        user = yield client_1.prisma.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                isVerified: true,
            },
        });
    }
    const JwtPayload = {
        email: user.email,
        userId: user.id,
        role: user.role,
    };
    const accessToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.access_token_secret, config_1.default.access_token_expires);
    const refreshToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.refresh_token_secret, config_1.default.refresh_token_expires);
    return { user, accessToken, refreshToken };
});
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw new AppError_1.default(400, 'User ID is required');
    }
    const user = yield client_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            imageUrl: true,
            isVerified: true,
        },
    });
    if (!user) {
        throw new AppError_1.default(404, 'User not found');
    }
    return user;
});
exports.AuthServices = {
    register,
    verifyEmail,
    login,
    forgotPassword,
    resetPassword: exports.resetPassword,
    changePassword,
    refreshToken,
    resendVerifyEmail,
    makeAdmin,
    makeSalesman,
    socialLogin,
    getMe
};
