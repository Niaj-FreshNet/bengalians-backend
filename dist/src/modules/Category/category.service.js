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
exports.CategoryServices = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../prisma/client");
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const fileDelete_1 = require("../../helpers/fileDelete");
const createCategory = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield client_1.prisma.category.findFirst({
        where: {
            categoryName: payload.categoryName.toUpperCase(),
        },
    });
    if (isExist) {
        throw new AppError_1.default(400, 'Category already exists');
    }
    const result = yield client_1.prisma.category.create({
        data: {
            categoryName: payload.categoryName.toUpperCase(),
            sizes: payload.sizes,
            published: payload.published,
            imageUrl: payload.imageUrl,
        },
    });
    return result;
});
const getAllCategories = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams, ['categoryName']);
    queryParams.published = true;
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .buildSelect()
        .getQuery();
    const categories = yield client_1.prisma.category.findMany(Object.assign({}, prismaQuery));
    const meta = yield queryBuilder.getPaginationMeta(client_1.prisma.category);
    return {
        meta,
        data: categories,
    };
});
const getAllCategoriesAdmin = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams, ['categoryName']);
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .buildSelect()
        .getQuery();
    const categories = yield client_1.prisma.category.findMany(Object.assign({}, prismaQuery));
    const meta = yield queryBuilder.getPaginationMeta(client_1.prisma.category);
    return {
        meta,
        data: categories,
    };
});
const getCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield client_1.prisma.category.findUnique({
        where: {
            id,
        },
    });
    return result;
});
const updateCategory = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const isExist = yield client_1.prisma.category.findUnique({
        where: {
            id,
        },
    });
    if (!isExist) {
        throw new AppError_1.default(400, 'Category not found');
    }
    if (payload.sizes && typeof payload.sizes === 'string') {
        payload.sizes = JSON.parse(payload.sizes);
    }
    const imageUrl = payload.imageUrl;
    const result = yield client_1.prisma.category.update({
        where: {
            id,
        },
        data: {
            categoryName: (_a = payload === null || payload === void 0 ? void 0 : payload.categoryName) === null || _a === void 0 ? void 0 : _a.toUpperCase(),
            sizes: payload.sizes,
            imageUrl: imageUrl,
            published: payload.published,
        },
    });
    return result;
});
const deleteCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield client_1.prisma.category.findUnique({
        where: { id },
        include: { Product: true },
    });
    if (!isExist) {
        throw new AppError_1.default(404, 'Category not found');
    }
    if (isExist.Product.length > 0) {
        throw new AppError_1.default(400, 'Cannot delete category that has products linked to it. Please remove or reassign those products first.');
    }
    if (isExist.imageUrl) {
        yield (0, fileDelete_1.deleteFile)(isExist.imageUrl);
    }
    const result = yield client_1.prisma.category.delete({
        where: {
            id,
        },
    });
    return result;
});
exports.CategoryServices = {
    createCategory,
    getAllCategories,
    getAllCategoriesAdmin,
    getCategory,
    updateCategory,
    deleteCategory,
};
