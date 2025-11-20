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
exports.MaterialServices = void 0;
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../prisma/client");
const createMaterial = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isMaterialExist = yield client_1.prisma.material.findFirst({
        where: {
            materialName: payload.materialName,
        },
    });
    if (isMaterialExist) {
        throw new AppError_1.default(403, 'Material already exists');
    }
    const result = yield client_1.prisma.material.create({
        data: {
            materialName: payload.materialName,
            imageUrl: payload.imageUrl,
        },
    });
    return result;
});
const getAllMaterials = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams, ['materialName'])
        .buildWhere()
        .buildSort()
        .buildPagination()
        .buildSelect();
    const materials = yield client_1.prisma.material.findMany(queryBuilder.getQuery());
    const meta = yield queryBuilder.getPaginationMeta(client_1.prisma.material);
    return {
        data: materials,
        meta,
    };
});
const getMaterial = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield client_1.prisma.material.findUnique({
        where: {
            id,
        },
    });
    return result;
});
const updateMaterial = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isMaterialExist = yield client_1.prisma.material.findUnique({
        where: {
            id,
        },
    });
    if (!isMaterialExist) {
        throw new AppError_1.default(400, 'Material not found');
    }
    const result = yield client_1.prisma.material.update({
        where: {
            id,
        },
        data: {
            materialName: payload.materialName,
        },
    });
    return result;
});
const deleteMaterial = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isMaterialExist = yield client_1.prisma.material.findUnique({
        where: {
            id,
        },
    });
    if (!isMaterialExist) {
        throw new AppError_1.default(400, 'Material not found');
    }
    const result = yield client_1.prisma.material.delete({
        where: {
            id,
        },
    });
    return result;
});
exports.MaterialServices = {
    createMaterial,
    getAllMaterials,
    getMaterial,
    updateMaterial,
    deleteMaterial,
};
