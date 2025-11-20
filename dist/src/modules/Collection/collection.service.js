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
exports.CollectionServices = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../prisma/client");
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const fileDelete_1 = require("../../helpers/fileDelete");
const createCollection = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield client_1.prisma.collection.findFirst({
        where: {
            collectionName: payload.collectionName.toUpperCase(),
        },
    });
    if (isExist) {
        throw new AppError_1.default(400, 'Collection already exists');
    }
    const result = yield client_1.prisma.collection.create({
        data: {
            collectionName: payload.collectionName.toUpperCase(),
            published: payload.published,
            imageUrl: payload.imageUrl,
        },
    });
    return result;
});
const getAllCollections = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams, ['collectionName']);
    queryParams.published = true;
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .buildSelect()
        .getQuery();
    const collections = yield client_1.prisma.collection.findMany(Object.assign({}, prismaQuery));
    const meta = yield queryBuilder.getPaginationMeta(client_1.prisma.collection);
    return {
        meta,
        data: collections,
    };
});
const getAllCollectionsAdmin = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams, ['collectionName']);
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .buildSelect()
        .getQuery();
    const collections = yield client_1.prisma.collection.findMany(Object.assign({}, prismaQuery));
    const meta = yield queryBuilder.getPaginationMeta(client_1.prisma.collection);
    return {
        meta,
        data: collections,
    };
});
const getCollection = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield client_1.prisma.collection.findUnique({
        where: {
            id,
        },
    });
    return result;
});
const updateCollection = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const isExist = yield client_1.prisma.collection.findUnique({
        where: {
            id,
        },
    });
    if (!isExist) {
        throw new AppError_1.default(400, 'Collection not found');
    }
    if (payload.sizes && typeof payload.sizes === 'string') {
        payload.sizes = JSON.parse(payload.sizes);
    }
    const imageUrl = payload.imageUrl;
    const result = yield client_1.prisma.collection.update({
        where: {
            id,
        },
        data: {
            collectionName: (_a = payload === null || payload === void 0 ? void 0 : payload.collectionName) === null || _a === void 0 ? void 0 : _a.toUpperCase(),
            imageUrl: imageUrl,
            published: payload.published,
        },
    });
    return result;
});
const deleteCollection = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield client_1.prisma.collection.findUnique({
        where: { id },
        include: { Product: true },
    });
    if (!isExist) {
        throw new AppError_1.default(404, 'Collection not found');
    }
    if (isExist.Product.length > 0) {
        throw new AppError_1.default(400, 'Cannot delete collection that has products linked to it. Please remove or reassign those products first.');
    }
    if (isExist.imageUrl) {
        yield (0, fileDelete_1.deleteFile)(isExist.imageUrl);
    }
    const result = yield client_1.prisma.collection.delete({
        where: {
            id,
        },
    });
    return result;
});
exports.CollectionServices = {
    createCollection,
    getAllCollections,
    getAllCollectionsAdmin,
    getCollection,
    updateCollection,
    deleteCollection,
};
