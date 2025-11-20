"use strict";
// import AppError from '../../errors/AppError';
// import { deleteFile } from '../../helpers/fileDelete';
// import catchAsync from '../../utils/catchAsync';
// import {
//   deleteFromDigitalOceanAWS,
//   uploadToDigitalOceanAWS,
// } from '../../utils/sendImageToCloudinary';
// import sendResponse from '../../utils/sendResponse';
// import { ICollection } from './collection.interface';
// import { CollectionServices } from './collection.service';
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
exports.CollectionController = void 0;
// const createCollection = catchAsync(async (req, res) => {
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
//   const collectiondata: ICollection = {
//     ...req.body,
//     imageUrl,
//   };
//   const result = await CollectionServices.createCollection(collectiondata);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Collection Created Successfully'
//       : 'Collection Creation Failed',
//     data: isok ? result : [],
//   });
// });
// const getAllCollections = catchAsync(async (req, res) => {
//   const result = await CollectionServices.getAllCollections(req.query);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Collections Fetched Successfully'
//       : 'Collections Fetching Failed',
//     data: isok ? result : [],
//   });
// });
// const getAllCollectionsAdmin = catchAsync(async (req, res) => {
//   const result = await CollectionServices.getAllCollectionsAdmin(req.query);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Collections Fetched Successfully'
//       : 'Collections Fetching Failed',
//     data: isok ? result : [],
//   });
// });
// const getCollection = catchAsync(async (req, res) => {
//   const result = await CollectionServices.getCollection(req.params.id);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Collection Fetched Successfully'
//       : 'Collection Fetching Failed',
//     data: isok ? result : [],
//   });
// });
// const updateCollection = catchAsync(async (req, res) => {
//   const collection = await CollectionServices.getCollection(req.params.id);
//   if (!collection) {
//     throw new AppError(400, 'Collection not found');
//   }
//   let updateddata = { ...req.body };
//   // ✅ Convert string booleans to actual booleans
//   if (typeof updateddata.published === 'string') {
//     updateddata.published = updateddata.published === 'true';
//   }
//   // Handle image update
//   if (req.file?.filename) {
//     if (collection.imageUrl) {
//       await deleteFile(collection.imageUrl);
//     }
//     updateddata.imageUrl = `${process.env.BACKEND_LIVE_URL}/uploads/${req.file.filename}`;
//   }
//   const result = await CollectionServices.updateCollection(
//     req.params.id,
//     updateddata,
//   );
//   const isok = !!result;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok,
//     message: isok
//       ? 'Collection Updated Successfully'
//       : 'Collection Updation Failed',
//     data: isok ? result : [],
//   });
// });
// const deleteCollection = catchAsync(async (req, res) => {
//   const result = await CollectionServices.deleteCollection(req.params.id);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Collection Deleted Successfully'
//       : 'Collection Deletion Failed',
//     data: isok ? result : [],
//   });
// });
// export const CollectionController = {
//   createCollection,
//   getAllCollections,
//   getAllCollectionsAdmin,
//   getCollection,
//   updateCollection,
//   deleteCollection,
// };
const AppError_1 = __importDefault(require("../../errors/AppError"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const collection_service_1 = require("./collection.service");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const createCollection = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file)
        throw new AppError_1.default(400, 'At least one image is required');
    // ✅ Upload image to Cloudinary dynamically
    const { location: imageUrl } = yield (0, sendImageToCloudinary_1.uploadToCloudinary)(req.file, 'khushbuwaala-collections', 'collection');
    // Convert string booleans and JSON arrays
    if (typeof req.body.published === 'string')
        req.body.published = req.body.published === 'true';
    if (req.body.sizes && typeof req.body.sizes === 'string')
        req.body.sizes = JSON.parse(req.body.sizes);
    const collectionData = Object.assign(Object.assign({}, req.body), { imageUrl });
    const result = yield collection_service_1.CollectionServices.createCollection(collectionData);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Collection Created Successfully' : 'Collection Creation Failed',
        data: result || [],
    });
}));
const updateCollection = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const collection = yield collection_service_1.CollectionServices.getCollection(req.params.id);
    if (!collection)
        throw new AppError_1.default(400, 'Collection not found');
    const updatedData = Object.assign({}, req.body);
    if (typeof updatedData.published === 'string')
        updatedData.published = updatedData.published === 'true';
    // ✅ Handle image update
    if (req.file) {
        if (collection.imageUrl)
            yield (0, sendImageToCloudinary_1.deleteFromCloudinary)(collection.imageUrl);
        const { location } = yield (0, sendImageToCloudinary_1.uploadToCloudinary)(req.file, 'khushbuwaala-collections', 'collection');
        updatedData.imageUrl = location;
    }
    const result = yield collection_service_1.CollectionServices.updateCollection(req.params.id, updatedData);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Collection Updated Successfully' : 'Collection Updation Failed',
        data: result || [],
    });
}));
const deleteCollection = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const collection = yield collection_service_1.CollectionServices.getCollection(req.params.id);
    if (!collection)
        throw new AppError_1.default(400, 'Collection not found');
    if (collection.imageUrl)
        yield (0, sendImageToCloudinary_1.deleteFromCloudinary)(collection.imageUrl);
    const result = yield collection_service_1.CollectionServices.deleteCollection(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Collection Deleted Successfully' : 'Collection Deletion Failed',
        data: result || [],
    });
}));
// ✅ Other GET methods remain unchanged
const getAllCollections = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield collection_service_1.CollectionServices.getAllCollections(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Collections Fetched Successfully' : 'Collections Fetching Failed',
        data: result || [],
    });
}));
const getAllCollectionsAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield collection_service_1.CollectionServices.getAllCollectionsAdmin(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Collections Fetched Successfully' : 'Collections Fetching Failed',
        data: result || [],
    });
}));
const getCollection = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield collection_service_1.CollectionServices.getCollection(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: result ? 200 : 400,
        success: !!result,
        message: result ? 'Collection Fetched Successfully' : 'Collection Fetching Failed',
        data: result || [],
    });
}));
exports.CollectionController = {
    createCollection,
    getAllCollections,
    getAllCollectionsAdmin,
    getCollection,
    updateCollection,
    deleteCollection,
};
