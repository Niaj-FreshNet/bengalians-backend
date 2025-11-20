"use strict";
// import AppError from '../../errors/AppError';
// import { deleteFile } from '../../helpers/fileDelete';
// import catchAsync from '../../utils/catchAsync';
// import {
//   deleteFromDigitalOceanAWS,
//   uploadToDigitalOceanAWS,
// } from '../../utils/sendImageToCloudinary';
// import sendResponse from '../../utils/sendResponse';
// import { ICategory } from './category.interface';
// import { CategoryServices } from './category.service';
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
exports.CategoryController = void 0;
// const createCategory = catchAsync(async (req, res) => {
//   if (!req.file) {
//     throw new AppError(400, 'At least one image is required');
//   }
//   let imageUrl = '';
//   if (req.file.filename) {
//     imageUrl = `${process.env.BACKEND_LIVE_URL}/uploads/${req.file.filename}`;
//   }
//   if (req.body.published && typeof req.body.published === 'string') {
//     req.body.published = req.body.published === 'true' ? true : false;
//   }
//   if (req.body.sizes && typeof req.body.sizes === 'string') {
//     req.body.sizes = JSON.parse(req.body.sizes);
//   }
//   const categorydata: ICategory = {
//     ...req.body,
//     imageUrl,
//   };
//   const result = await CategoryServices.createCategory(categorydata);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Category Created Successfully'
//       : 'Category Creation Failed',
//     data: isok ? result : [],
//   });
// });
// const getAllCategories = catchAsync(async (req, res) => {
//   const result = await CategoryServices.getAllCategories(req.query);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Categories Fetched Successfully'
//       : 'Categories Fetching Failed',
//     data: isok ? result : [],
//   });
// });
// const getAllCategoriesAdmin = catchAsync(async (req, res) => {
//   const result = await CategoryServices.getAllCategoriesAdmin(req.query);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Categories Fetched Successfully'
//       : 'Categories Fetching Failed',
//     data: isok ? result : [],
//   });
// });
// const getCategory = catchAsync(async (req, res) => {
//   const result = await CategoryServices.getCategory(req.params.id);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Category Fetched Successfully'
//       : 'Category Fetching Failed',
//     data: isok ? result : [],
//   });
// });
// const updateCategory = catchAsync(async (req, res) => {
//   const category = await CategoryServices.getCategory(req.params.id);
//   if (!category) {
//     throw new AppError(400, 'Category not found');
//   }
//   let updateddata = { ...req.body };
//   // ✅ Convert string booleans to actual booleans
//   if (typeof updateddata.published === 'string') {
//     updateddata.published = updateddata.published === 'true';
//   }
//   // Handle image update
//   if (req.file?.filename) {
//     if (category.imageUrl) {
//       await deleteFile(category.imageUrl);
//     }
//     updateddata.imageUrl = `${process.env.BACKEND_LIVE_URL}/uploads/${req.file.filename}`;
//   }
//   const result = await CategoryServices.updateCategory(
//     req.params.id,
//     updateddata,
//   );
//   const isok = !!result;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok,
//     message: isok
//       ? 'Category Updated Successfully'
//       : 'Category Updation Failed',
//     data: isok ? result : [],
//   });
// });
// const deleteCategory = catchAsync(async (req, res) => {
//   const result = await CategoryServices.deleteCategory(req.params.id);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Category Deleted Successfully'
//       : 'Category Deletion Failed',
//     data: isok ? result : [],
//   });
// });
// export const CategoryController = {
//   createCategory,
//   getAllCategories,
//   getAllCategoriesAdmin,
//   getCategory,
//   updateCategory,
//   deleteCategory,
// };
const AppError_1 = __importDefault(require("../../errors/AppError"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const category_service_1 = require("./category.service");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const createCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file)
        throw new AppError_1.default(400, 'At least one image is required');
    // ✅ Upload image to Cloudinary dynamically
    const { location: imageUrl } = yield (0, sendImageToCloudinary_1.uploadToCloudinary)(req.file, 'khushbuwaala-categories', 'category');
    // Convert string booleans and JSON arrays
    if (typeof req.body.published === 'string')
        req.body.published = req.body.published === 'true';
    if (req.body.sizes && typeof req.body.sizes === 'string')
        req.body.sizes = JSON.parse(req.body.sizes);
    const categoryData = Object.assign(Object.assign({}, req.body), { imageUrl });
    const result = yield category_service_1.CategoryServices.createCategory(categoryData);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Category Created Successfully' : 'Category Creation Failed',
        data: result || [],
    });
}));
const updateCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield category_service_1.CategoryServices.getCategory(req.params.id);
    if (!category)
        throw new AppError_1.default(400, 'Category not found');
    const updatedData = Object.assign({}, req.body);
    if (typeof updatedData.published === 'string')
        updatedData.published = updatedData.published === 'true';
    // ✅ Handle image update
    if (req.file) {
        if (category.imageUrl)
            yield (0, sendImageToCloudinary_1.deleteFromCloudinary)(category.imageUrl);
        const { location } = yield (0, sendImageToCloudinary_1.uploadToCloudinary)(req.file, 'khushbuwaala-categories', 'category');
        updatedData.imageUrl = location;
    }
    const result = yield category_service_1.CategoryServices.updateCategory(req.params.id, updatedData);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Category Updated Successfully' : 'Category Updation Failed',
        data: result || [],
    });
}));
const deleteCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield category_service_1.CategoryServices.getCategory(req.params.id);
    if (!category)
        throw new AppError_1.default(400, 'Category not found');
    if (category.imageUrl)
        yield (0, sendImageToCloudinary_1.deleteFromCloudinary)(category.imageUrl);
    const result = yield category_service_1.CategoryServices.deleteCategory(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Category Deleted Successfully' : 'Category Deletion Failed',
        data: result || [],
    });
}));
// ✅ Other GET methods remain unchanged
const getAllCategories = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield category_service_1.CategoryServices.getAllCategories(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Categories Fetched Successfully' : 'Categories Fetching Failed',
        data: result || [],
    });
}));
const getAllCategoriesAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield category_service_1.CategoryServices.getAllCategoriesAdmin(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Categories Fetched Successfully' : 'Categories Fetching Failed',
        data: result || [],
    });
}));
const getCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield category_service_1.CategoryServices.getCategory(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Category Fetched Successfully' : 'Category Fetching Failed',
        data: result || [],
    });
}));
exports.CategoryController = {
    createCategory,
    getAllCategories,
    getAllCategoriesAdmin,
    getCategory,
    updateCategory,
    deleteCategory,
};
