"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const blog_controller_1 = require("./blog.controller");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const router = (0, express_1.Router)();
router.post('/create-blog', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), sendImageToCloudinary_1.upload.single('image'), blog_controller_1.BlogController.createBlog);
// Need to Add
router.get('/get-all-blogs', blog_controller_1.BlogController.getAllBlogs);
router.get('/get-all-blogs/admin', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), blog_controller_1.BlogController.getAllBlogsAdmin);
router.get('/get-blog/:slug', blog_controller_1.BlogController.getBlog);
router.put('/update-blog/:id', (0, auth_1.default)('SALESMAN', 'ADMIN', 'SUPER_ADMIN'), sendImageToCloudinary_1.upload.single('image'), blog_controller_1.BlogController.updateBlog);
router.delete('/delete-blog/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), blog_controller_1.BlogController.deleteBlog);
exports.BlogRoutes = router;
