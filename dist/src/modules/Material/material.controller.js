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
exports.MaterialController = exports.getAllMaterials = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const material_service_1 = require("./material.service");
const createMaterial = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield material_service_1.MaterialServices.createMaterial(req.body);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Material Created Successfully'
            : 'Material Creation Failed',
        data: isok ? result : [],
    });
}));
exports.getAllMaterials = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield material_service_1.MaterialServices.getAllMaterials(req.query);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Materials Fetched Successfully'
            : 'Materials Fetching Failed',
        data: isok ? result : [],
    });
}));
const getMaterial = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield material_service_1.MaterialServices.getMaterial(req.params.id);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Material Fetched Successfully'
            : 'Material Fetching Failed',
        data: isok ? result : [],
    });
}));
const updateMaterial = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield material_service_1.MaterialServices.updateMaterial(req.params.id, req.body);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Material Updated Successfully'
            : 'Material Updation Failed',
        data: isok ? result : [],
    });
}));
const deleteMaterial = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield material_service_1.MaterialServices.deleteMaterial(req.params.id);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Material Deleted Successfully'
            : 'Material Deletion Failed',
        data: isok ? result : [],
    });
}));
exports.MaterialController = {
    createMaterial,
    getAllMaterials: exports.getAllMaterials,
    getMaterial,
    updateMaterial,
    deleteMaterial,
};
