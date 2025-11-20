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
exports.BlogController = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const fileDelete_1 = require("../../helpers/fileDelete");
const client_1 = require("../../../prisma/client");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
// import {
//   deleteFromDigitalOceanAWS,
//   uploadToDigitalOceanAWS,
// } from '../../utils/sendImageToCloudinary';
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const blog_service_1 = require("./blog.service");
const createBlog = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    let imageUrl = '';
    if (!((_a = req.file) === null || _a === void 0 ? void 0 : _a.filename)) {
        throw new AppError_1.default(400, 'At least one image is required');
    }
    if (req.file.filename) {
        imageUrl = `${process.env.BACKEND_LIVE_URL}/Uploads/${req.file.filename}`;
    }
    if (req.body.isPublish && typeof req.body.isPublish === 'string') {
        req.body.isPublish = req.body.isPublish === 'true';
    }
    const blogdata = Object.assign(Object.assign({}, req.body), { userId: user.id, imageUrl, metaTitle: req.body.metaTitle, metaDescription: req.body.metaDescription, keywords: req.body.keywords });
    const result = yield blog_service_1.BlogServices.createBlog(blogdata);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok ? 'Blog Created Successfully' : 'Blog Creation Failed',
        data: isok ? result : [],
    });
}));
const updateBlog = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const blogId = req.params.id;
    const existingBlog = yield client_1.prisma.blog.findUnique({
        where: { id: blogId },
    });
    if (!existingBlog) {
        throw new AppError_1.default(404, 'Blog not found');
    }
    if (req.body.isPublish && typeof req.body.isPublish === 'string') {
        req.body.isPublish = req.body.isPublish === 'true';
    }
    let updateddata = Object.assign({}, req.body);
    if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.filename) {
        if (existingBlog === null || existingBlog === void 0 ? void 0 : existingBlog.imageUrl) {
            yield (0, fileDelete_1.deleteFile)(existingBlog.imageUrl);
        }
        updateddata.imageUrl = `${process.env.BACKEND_LIVE_URL}/Uploads/${req.file.filename}`;
    }
    const result = yield blog_service_1.BlogServices.updateBlog(blogId, updateddata);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok ? 'Blog Updated Successfully' : 'Blog Updation Failed',
        data: isok ? result : [],
    });
}));
const getAllBlogs = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield blog_service_1.BlogServices.getAllBlogs(req.query);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok ? 'Blogs Fetched Successfully' : 'Blogs Fetching Failed',
        data: isok ? result : [],
    });
}));
const getAllBlogsAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield blog_service_1.BlogServices.getAllBlogsAdmin(req.query);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok ? 'Blogs Fetched Successfully' : 'Blogs Fetching Failed',
        data: isok ? result : [],
    });
}));
const getBlog = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.params.id);
    const result = yield blog_service_1.BlogServices.getBlog(req.params.id);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok ? 'Blog Fetched Successfully' : 'Blog Fetching Failed',
        data: isok ? result : [],
    });
}));
const deleteBlog = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield blog_service_1.BlogServices.deleteBlog(req.params.id);
    const isok = result ? true : false;
    (0, sendResponse_1.default)(res, {
        statusCode: isok ? 200 : 400,
        success: isok ? true : false,
        message: isok ? 'Blog Deleted Successfully' : 'Blog Deletion Failed',
        data: isok ? result : [],
    });
}));
exports.BlogController = {
    createBlog,
    getAllBlogs,
    getAllBlogsAdmin,
    getBlog,
    updateBlog,
    deleteBlog,
};
