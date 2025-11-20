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
exports.OverviewController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const overview_service_1 = require("./overview.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const getOverview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield overview_service_1.OverviewServices.getOverview();
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Overview Fetched Successfully'
            : 'Overview Fetching Failed',
        data: isok ? result : [],
    });
}));
const getWeeklyOverview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield overview_service_1.OverviewServices.getWeeklyOverview();
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Overview Fetched Successfully'
            : 'Overview Fetching Failed',
        data: isok ? result : [],
    });
}));
const getWeeklySales = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield overview_service_1.OverviewServices.getWeeklySales();
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok
            ? 'Overview Fetched Successfully'
            : 'Overview Fetching Failed',
        data: isok ? result : [],
    });
}));
exports.OverviewController = {
    getOverview,
    getWeeklyOverview,
    getWeeklySales,
};
