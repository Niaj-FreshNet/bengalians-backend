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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockServices = void 0;
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const client_1 = require("../../../prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const getAllProducts = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = queryParams, { searchTerm } = _a, rest = __rest(_a, ["searchTerm"]);
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(rest);
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .getQuery();
    const where = Object.assign({}, prismaQuery.where);
    if (searchTerm && searchTerm.trim()) {
        const s = searchTerm.trim();
        where.OR = [
            { name: { contains: s, mode: 'insensitive' } },
            { description: { contains: s, mode: 'insensitive' } },
        ];
    }
    const data = yield client_1.prisma.product.findMany(Object.assign(Object.assign({}, prismaQuery), { where, include: {
            variants: {
                select: { id: true, sku: true, size: true, price: true, unit: true },
            },
            category: { select: { unit: true } },
        } }));
    const meta = yield queryBuilder.getPaginationMeta({
        count: (args) => { var _a; return client_1.prisma.product.count({ where: Object.assign(Object.assign({}, where), ((_a = args === null || args === void 0 ? void 0 : args.where) !== null && _a !== void 0 ? _a : {})) }); },
    });
    return {
        meta,
        data: data.map((product) => (Object.assign({}, product))),
    };
});
const getLowStockProducts = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = queryParams, { searchTerm, threshold = 10 } = _a, rest = __rest(_a, ["searchTerm", "threshold"]);
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(rest);
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .getQuery();
    const where = Object.assign(Object.assign({}, prismaQuery.where), { stock: { lte: Number(threshold) } });
    if (searchTerm && searchTerm.trim()) {
        const s = searchTerm.trim();
        where.OR = [
            { name: { contains: s, mode: 'insensitive' } },
            { description: { contains: s, mode: 'insensitive' } },
        ];
    }
    const data = yield client_1.prisma.product.findMany(Object.assign(Object.assign({}, prismaQuery), { where, include: {
            variants: {
                select: { id: true, sku: true, size: true, price: true, unit: true },
            },
            category: { select: { unit: true } },
        } }));
    const meta = yield queryBuilder.getPaginationMeta({
        count: (args) => { var _a; return client_1.prisma.product.count({ where: Object.assign(Object.assign({}, where), ((_a = args === null || args === void 0 ? void 0 : args.where) !== null && _a !== void 0 ? _a : {})) }); },
    });
    return {
        meta,
        data: data.map((product) => (Object.assign({}, product))),
    };
});
const addStock = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, variantId, change, reason } = payload;
    const product = yield client_1.prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true },
    });
    if (!product)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Product not found');
    if (variantId) {
        const variant = product.variants.find((v) => v.id === variantId);
        if (!variant)
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Variant not found');
    }
    const stockLog = yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Update product stock
        yield tx.product.update({
            where: { id: productId },
            data: { stock: { increment: change } },
        });
        // Create stock log
        const log = yield tx.stockLog.create({
            data: {
                productId,
                variantId: variantId || '',
                change,
                reason,
                createdAt: new Date(),
            },
        });
        return log;
    }));
    return stockLog;
});
const getStockLogs = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield client_1.prisma.product.findUnique({
        where: { id: productId },
    });
    if (!product)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Product not found');
    const logs = yield client_1.prisma.stockLog.findMany({
        where: { productId },
        include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    return logs;
});
exports.StockServices = {
    getAllProducts,
    getLowStockProducts,
    addStock,
    getStockLogs,
};
