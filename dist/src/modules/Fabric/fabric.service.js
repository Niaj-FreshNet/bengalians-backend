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
exports.FabricServices = void 0;
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../prisma/client");
const createFabric = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isFabricExist = yield client_1.prisma.fabric.findFirst({
        where: {
            fabricName: payload.fabricName,
        },
    });
    if (isFabricExist) {
        throw new AppError_1.default(403, 'Fabric already exists');
    }
    const result = yield client_1.prisma.fabric.create({
        data: {
            fabricName: payload.fabricName,
            imageUrl: payload.imageUrl,
        },
    });
    return result;
});
const getAllFabrics = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams, ['fabricName'])
        .buildWhere()
        .buildSort()
        .buildPagination()
        .buildSelect();
    const materials = yield client_1.prisma.fabric.findMany(queryBuilder.getQuery());
    const meta = yield queryBuilder.getPaginationMeta(client_1.prisma.fabric);
    return {
        data: materials,
        meta,
    };
});
const getFabric = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield client_1.prisma.fabric.findUnique({
        where: {
            id,
        },
    });
    return result;
});
const updateFabric = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isFabricExist = yield client_1.prisma.fabric.findUnique({
        where: {
            id,
        },
    });
    if (!isFabricExist) {
        throw new AppError_1.default(400, 'Fabric not found');
    }
    const result = yield client_1.prisma.fabric.update({
        where: {
            id,
        },
        data: {
            fabricName: payload.fabricName,
        },
    });
    return result;
});
const deleteFabric = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isFabricExist = yield client_1.prisma.fabric.findUnique({
        where: {
            id,
        },
    });
    if (!isFabricExist) {
        throw new AppError_1.default(400, 'Fabric not found');
    }
    const result = yield client_1.prisma.fabric.delete({
        where: {
            id,
        },
    });
    return result;
});
exports.FabricServices = {
    createFabric,
    getAllFabrics,
    getFabric,
    updateFabric,
    deleteFabric,
};
