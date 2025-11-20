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
exports.UserServices = void 0;
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const config_1 = __importDefault(require("../../config"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const getAllUsers = (id, queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams, ['name']);
    queryBuilder.buildWhere().buildSort().buildPagination().buildSelect();
    // Get the generated query object
    const prismaQuery = queryBuilder.getQuery();
    // Merge NOT condition into the existing where clause
    prismaQuery.where = {
        AND: [prismaQuery.where || {}, { NOT: { id } }],
    };
    // Ensure select fields fallback if not defined by client
    if (!prismaQuery.select) {
        prismaQuery.select = {
            id: true,
            name: true,
            email: true,
            role: true,
            contact: true,
            imageUrl: true,
            address: true,
        };
    }
    const result = yield client_1.prisma.user.findMany(prismaQuery);
    const meta = yield queryBuilder.getPaginationMeta(client_1.prisma.user);
    return {
        meta,
        data: result,
    };
});
const getUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield client_1.prisma.user.findUnique({
        where: {
            id,
        },
        select: {
            name: true,
            email: true,
            role: true,
            // contact: true,
            imageUrl: true,
            address: true,
        },
    });
    return result;
});
const getUserByID = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield client_1.prisma.user.findUnique({
        where: {
            id,
        },
        select: {
            name: true,
            email: true,
            role: true,
            // contact: true,
            imageUrl: true,
            address: true,
        },
    });
    return result;
});
const changePassword = (id, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield client_1.prisma.user.findUnique({
        where: {
            id,
        },
    });
    if (!user) {
        throw new AppError_1.default(404, 'User not found');
    }
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.salt_round));
    const result = yield client_1.prisma.user.update({
        where: {
            id,
        },
        data: {
            password: hashedPassword,
        },
    });
    return true;
});
const updateUser = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield client_1.prisma.user.update({
        where: {
            id,
        },
        data,
        select: {
            name: true,
            email: true,
            role: true,
            // contact: true,
            imageUrl: true,
            address: true,
        },
    });
    return result;
});
exports.UserServices = {
    getUser,
    getUserByID,
    changePassword,
    updateUser,
    getAllUsers,
};
