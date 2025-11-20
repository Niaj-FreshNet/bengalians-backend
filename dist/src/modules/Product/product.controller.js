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
exports.ProductController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const product_service_1 = require("./product.service");
const product_constant_1 = require("./product.constant");
const queryBuilder_1 = require("../../helpers/queryBuilder");
// import { PRODUCT_ERROR_MESSAGES } from './product.constant';
// Create Product
const createProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("hello")
    // console.log('req bodyyyy',req.body)
    const { categoryId, variants } = req.body;
    // Validation
    if (!categoryId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, product_constant_1.PRODUCT_ERROR_MESSAGES.CATEGORY_REQUIRED);
    }
    const { primaryImage, otherImages } = req.body;
    if (!primaryImage) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Primary image is required.');
    }
    // Image handling
    // if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    //   throw new AppError(httpStatus.BAD_REQUEST, PRODUCT_ERROR_MESSAGES.IMAGE_REQUIRED);
    // }
    // const uploadedFiles = req.files as Express.Multer.File[];
    // const imageUrls = uploadedFiles.map(
    //   (file) => `${process.env.BACKEND_LIVE_URL}/uploads/${file.filename}`
    // );
    // Parse data
    const parsedData = Object.assign(Object.assign({}, req.body), { 
        // primaryImage: imageUrls[0],
        // otherImages: imageUrls.slice(1),
        published: req.body.published === true || req.body.published === 'true', tags: req.body.tags || [], accords: req.body.accords || [], bestFor: req.body.bestFor || [], perfumeNotes: req.body.perfumeNotes, stock: req.body.stock, variants: variants });
    // console.log("parsed data:", parsedData)
    const result = yield product_service_1.ProductServices.createProduct(parsedData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Product created successfully',
        data: result,
    });
}));
// Get All Products (Public)
const getAllProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = (0, queryBuilder_1.parseProductQuery)(req.query);
    const result = yield product_service_1.ProductServices.getAllProducts(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Products retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
}));
// Get All Products (Admin)
const getAllProductsAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = (0, queryBuilder_1.parseProductQuery)(req.query);
    const result = yield product_service_1.ProductServices.getAllProductsAdmin(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Products retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
}));
// Get Single Product
const getProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield product_service_1.ProductServices.getProduct(id);
    if (!result) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, product_constant_1.PRODUCT_ERROR_MESSAGES.NOT_FOUND);
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product retrieved successfully',
        data: result,
    });
}));
const getProductBySlug = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { slug } = req.params;
    const result = yield product_service_1.ProductServices.getProductBySlug(slug);
    if (!result) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, product_constant_1.PRODUCT_ERROR_MESSAGES.NOT_FOUND);
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product retrieved successfully',
        data: result,
    });
}));
// Update Product
const updateProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Handle new images
    let newImageUrls = [];
    if (req.files && Array.isArray(req.files)) {
        const uploadedFiles = req.files;
        newImageUrls = uploadedFiles.map((file) => `${process.env.BACKEND_LIVE_URL}/uploads/${file.filename}`);
    }
    // Parse data
    const parsedData = Object.assign(Object.assign({}, req.body), { published: req.body.published, tags: req.body.tags, accords: req.body.accords, bestFor: req.body.bestFor, perfumeNotes: req.body.perfumeNotes, stock: req.body.stock, variants: req.body.variants, imagesToKeep: req.body.imagesToKeep ?
            req.body.imagesToKeep : [], newImages: newImageUrls });
    const result = yield product_service_1.ProductServices.updateProduct(id, parsedData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product updated successfully',
        data: result,
    });
}));
// Delete Product
const deleteProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield product_service_1.ProductServices.deleteProduct(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product deleted successfully',
        data: result,
    });
}));
// Get Trending Products
const getTrendingProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield product_service_1.ProductServices.getTrendingProducts();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Trending products retrieved successfully',
        data: result,
    });
}));
// Get Navbar Products
const getNavbarProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield product_service_1.ProductServices.getNavbarProducts();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Navbar products retrieved successfully',
        data: result,
    });
}));
// Get Featured Products
const getFeaturedProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield product_service_1.ProductServices.getFeaturedProducts();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Featured products retrieved successfully',
        data: result,
    });
}));
// Get New Arrivals
const getNewArrivals = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield product_service_1.ProductServices.getNewArrivals();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'New arrivals retrieved successfully',
        data: result,
    });
}));
// Get Products by Category
const getProductsByCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId } = req.params;
    const query = (0, queryBuilder_1.parseProductQuery)(req.query);
    const result = yield product_service_1.ProductServices.getProductsByCategory(categoryId, query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Category products retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
}));
// Get Related Products
const getRelatedProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield product_service_1.ProductServices.getRelatedProducts(productId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Related products retrieved successfully',
        data: result,
    });
}));
// Search Products
const searchProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = (0, queryBuilder_1.parseProductQuery)(req.query);
    const result = yield product_service_1.ProductServices.searchProducts(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Products search completed successfully',
        meta: result.meta,
        data: result.data,
        filters: result.filters,
    });
}));
// Get Product Variants
const getProductVariants = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield product_service_1.ProductServices.getProductVariants(productId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product variants retrieved successfully',
        data: result,
    });
}));
// Update Variant Stock
const updateVariantStock = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { variantId } = req.params;
    const { newStock, reason } = req.body;
    const result = yield product_service_1.ProductServices.updateVariantStock(variantId, newStock, reason);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Variant stock updated successfully',
        data: result,
    });
}));
// Update product Stock
// const updateProductStock = catchAsync(async (req, res) => {
//   const { productId } = req.params;
//   const { addedStock, reason } = req.body;
//   const result = await ProductServices.updateProductStock(productId, Number(addedStock), reason);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Product stock updated successfully',
//     data: result,
//   });
// });
// Get Product Analytics
const getProductAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield product_service_1.ProductServices.getProductAnalytics();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product analytics retrieved successfully',
        data: result,
    });
}));
// Get Low Stock Products
const getLowStockProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const threshold = parseInt(req.query.threshold) || 10;
    const result = yield product_service_1.ProductServices.getLowStockProducts(threshold);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Low stock products retrieved successfully',
        data: result,
    });
}));
// Get Bestsellers
const getBestsellers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield product_service_1.ProductServices.getBestsellers();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Bestsellers retrieved successfully',
        data: result,
    });
}));
const getStockLogs = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield product_service_1.ProductServices.getStockLogs(productId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: result ? 'Stock logs fetched successfully' : 'Failed to fetch stock logs',
        data: result !== null && result !== void 0 ? result : [],
    });
}));
exports.ProductController = {
    createProduct,
    getAllProducts,
    getAllProductsAdmin,
    getProduct,
    getProductBySlug,
    updateProduct,
    deleteProduct,
    getTrendingProducts,
    getNavbarProducts,
    getFeaturedProducts,
    getNewArrivals,
    getProductsByCategory,
    getRelatedProducts,
    searchProducts,
    getProductVariants,
    updateVariantStock,
    // updateProductStock,
    getProductAnalytics,
    getLowStockProducts,
    getBestsellers,
    getStockLogs,
};
