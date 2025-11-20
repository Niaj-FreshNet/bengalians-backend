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
exports.UserController = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const fileDelete_1 = require("../../helpers/fileDelete");
const client_1 = require("../../../prisma/client");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
// import {
//   deleteFromDigitalOceanAWS,
//   uploadToDigitalOceanAWS,
// } from '../../utils/sendImageToCloudinary';
const user_service_1 = require("./user.service");
const getAllUsers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserServices.getAllUsers(req.user.id, req.query);
    res.status(200).json({
        statusCode: 200,
        success: true,
        message: 'Users Fetched Successfully',
        data: result.data, // <-- return only the array
    });
}));
const getUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserServices.getUser(req.user.id);
    const isok = result ? true : false;
    res.status(isok ? 200 : 400).json({
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok ? 'User Fetched Successfully' : 'User Fetching Failed',
        data: isok ? result : [],
    });
}));
const getUserByID = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserServices.getUserByID(req.user.id);
    const isok = result ? true : false;
    res.status(isok ? 200 : 400).json({
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok ? 'User Fetched Successfully' : 'User Fetching Failed',
        data: isok ? result : [],
    });
}));
const changePassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { newPassword } = req.body;
    const result = yield user_service_1.UserServices.changePassword(userId, newPassword);
    const isok = result ? true : false;
    res.status(isok ? 200 : 400).json({
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok ? 'Password Changed Successfully' : 'Password Change Failed',
        data: isok ? result : [],
    });
}));
const updateUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.params.id; // <-- use params
    const user = yield client_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user)
        throw new AppError_1.default(404, 'User not found');
    const { name, contact, address } = req.body;
    let imageUrl = user.imageUrl;
    if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.filename) {
        if (user.imageUrl)
            yield (0, fileDelete_1.deleteFile)(user.imageUrl);
        imageUrl = `${process.env.BACKEND_LIVE_URL}/uploads/${req.file.filename}`;
    }
    const updatedData = { name, contact, address, imageUrl, role: req.body.role };
    const result = yield user_service_1.UserServices.updateUser(userId, updatedData);
    res.status(200).json({
        statusCode: 200,
        success: true,
        message: 'User Updated Successfully',
        data: result,
    });
}));
exports.UserController = {
    getAllUsers,
    getUser,
    getUserByID,
    changePassword,
    updateUser,
};
