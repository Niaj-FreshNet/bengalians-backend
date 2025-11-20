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
exports.FabricController = exports.getAllFabrics = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const fabric_service_1 = require("./fabric.service");
const createFabric = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield fabric_service_1.FabricServices.createFabric(req.body);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Fabric Created Successfully'
            : 'Fabric Creation Failed',
        data: isok ? result : [],
    });
}));
exports.getAllFabrics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield fabric_service_1.FabricServices.getAllFabrics(req.query);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Fabrics Fetched Successfully'
            : 'Fabrics Fetching Failed',
        data: isok ? result : [],
    });
}));
const getFabric = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield fabric_service_1.FabricServices.getFabric(req.params.id);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Fabric Fetched Successfully'
            : 'Fabric Fetching Failed',
        data: isok ? result : [],
    });
}));
const updateFabric = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield fabric_service_1.FabricServices.updateFabric(req.params.id, req.body);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Fabric Updated Successfully'
            : 'Fabric Updation Failed',
        data: isok ? result : [],
    });
}));
const deleteFabric = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield fabric_service_1.FabricServices.deleteFabric(req.params.id);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Fabric Deleted Successfully'
            : 'Fabric Deletion Failed',
        data: isok ? result : [],
    });
}));
exports.FabricController = {
    createFabric,
    getAllFabrics: exports.getAllFabrics,
    getFabric,
    updateFabric,
    deleteFabric,
};
