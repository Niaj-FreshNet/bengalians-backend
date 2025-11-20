"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRoutes = void 0;
const express_1 = require("express");
const review_controller_1 = require("./review.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
// ✏️ Create a review (only logged-in users)
router.post('/create-review', (0, auth_1.default)('OPTIONAL'), review_controller_1.reviewController.createReview);
// 🌍 Publicly visible reviews (published only)
router.get('/get-all-reviews', review_controller_1.reviewController.getAllReviews);
// 🧠 Admin panel — all reviews, published/unpublished
router.get('/get-all-reviews/admin', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), review_controller_1.reviewController.getAllReviewsAdmin);
// ✅ Publish / Unpublish Review (Admin only)
router.patch("/publish-review/:id", (0, auth_1.default)("ADMIN", "SUPER_ADMIN"), // Adjust roles as needed
review_controller_1.reviewController.publishReview);
// ✏️ Update review (admin can publish/unpublish, edit)
router.patch('/update-review/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), review_controller_1.reviewController.updateReview);
// 👁️ Get single review by ID (public)
router.get('/get-review/:id', review_controller_1.reviewController.getReviewById);
// 🧍 Get all reviews by a specific user
router.get('/get-user-reviews/:userId', review_controller_1.reviewController.getUserReviews);
// 📦 Get all reviews for a specific product
router.get('/get-product-reviews/:productId', review_controller_1.reviewController.getProductReviews);
exports.ReviewRoutes = router;
