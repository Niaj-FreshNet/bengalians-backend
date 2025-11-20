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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const config_1 = __importDefault(require("../config"));
const client_1 = require("../../prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const auth = (...requiredRoles) => {
    return (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        // 👇 detect if route should allow visitors
        const allowVisitor = requiredRoles.includes('OPTIONAL');
        let token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) ||
            ((_b = req.cookies) === null || _b === void 0 ? void 0 : _b.accessToken);
        // No token → if visitor allowed, continue without throwing error
        if (!token) {
            if (allowVisitor) {
                req.user = null;
                return next();
            }
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized: Token missing');
        }
        if (token.startsWith('Bearer ')) {
            token = token.slice(7);
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.access_token_secret);
            if (!decoded || !decoded.userId) {
                throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid token payload');
            }
            const user = yield client_1.prisma.user.findUnique({
                where: { id: decoded.userId },
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
                if (allowVisitor) {
                    req.user = null;
                    return next();
                }
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
            }
            if (requiredRoles.length &&
                !requiredRoles.includes('OPTIONAL') &&
                !requiredRoles.includes(user.role)) {
                throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized');
            }
            req.user = user;
            next();
        }
        catch (error) {
            console.error('❌ Token verification failed:', error.message);
            if (allowVisitor) {
                req.user = null;
                return next();
            }
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid or expired token');
        }
    }));
};
exports.default = auth;
