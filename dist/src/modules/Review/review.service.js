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
exports.ReviewServices = void 0;
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../prisma/client");
const createReview = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        throw new AppError_1.default(404, 'User not found');
    const product = yield client_1.prisma.product.findUnique({
        where: { id: payload.productId },
    });
    if (!product)
        throw new AppError_1.default(404, 'Product not found');
    if (payload.rating < 0 || payload.rating > 5)
        throw new AppError_1.default(400, 'Rating must be between 0 and 5');
    const existing = yield client_1.prisma.review.findFirst({
        where: { userId, productId: payload.productId },
    });
    if (existing)
        throw new AppError_1.default(400, 'You already reviewed this product');
    const review = yield client_1.prisma.review.create({
        data: {
            rating: payload.rating,
            title: payload.title,
            comment: payload.comment,
            productId: payload.productId,
            userId,
            isPublished: true,
        },
        include: {
            user: { select: { name: true, imageUrl: true } },
        },
    });
    return review;
});
const getAllReviews = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams, ['title', 'comment']);
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .buildSelect()
        .getQuery();
    prismaQuery.where = Object.assign(Object.assign({}, prismaQuery.where), { isPublished: true });
    const reviews = yield client_1.prisma.review.findMany(Object.assign(Object.assign({}, prismaQuery), { include: {
            user: {
                select: {
                    name: true,
                    imageUrl: true,
                },
            },
            product: { select: { name: true, slug: true, thumbnail: true } },
        } }));
    const meta = yield queryBuilder.getPaginationMeta(client_1.prisma.review);
    return { meta, data: reviews };
});
const getAllReviewsAdmin = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams, ['title', 'comment']);
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .buildSelect()
        .getQuery();
    const reviews = yield client_1.prisma.review.findMany(Object.assign(Object.assign({}, prismaQuery), { include: {
            user: { select: { name: true, email: true, imageUrl: true } },
            product: { select: { name: true, slug: true } },
        } }));
    const meta = yield queryBuilder.getPaginationMeta(client_1.prisma.review);
    return { meta, data: reviews };
});
const getReviewById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield client_1.prisma.review.findUnique({
        where: { id },
        include: {
            user: { select: { name: true, imageUrl: true } },
            product: { select: { name: true, slug: true } },
        },
    });
    if (!review)
        throw new AppError_1.default(404, 'Review not found');
    return review;
});
const getUserReviews = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const reviews = yield client_1.prisma.review.findMany({
        where: { userId },
        include: {
            product: { select: { name: true, slug: true, primaryImage: true } },
        },
    });
    return reviews.map((r) => (Object.assign(Object.assign({}, r), { reviewerName: r.userId ? undefined : 'Anonymous' })));
});
const getProductReviews = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const reviews = yield client_1.prisma.review.findMany({
        where: { productId, isPublished: true },
        include: {
            user: {
                select: {
                    name: true,
                    imageUrl: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    // Replace null user with anonymous label
    return reviews.map((r) => (Object.assign(Object.assign({}, r), { user: r.user || { name: 'Anonymous', imageUrl: '/default-avatar.png' } })));
});
const updateReview = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield client_1.prisma.review.update({
        where: { id },
        data: payload,
        include: {
            user: { select: { name: true, imageUrl: true } },
        },
    });
    return review;
});
const publishReview = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // ✅ First fetch current status
    const existingReview = yield client_1.prisma.review.findUnique({
        where: { id },
    });
    if (!existingReview) {
        throw new Error("Review not found");
    }
    // ✅ Toggle publish status
    const updatedReview = yield client_1.prisma.review.update({
        where: { id },
        data: { isPublished: !existingReview.isPublished },
        include: {
            user: { select: { name: true, imageUrl: true } },
            product: { select: { name: true } },
        },
    });
    return updatedReview;
});
exports.ReviewServices = {
    createReview,
    getAllReviews,
    getAllReviewsAdmin,
    getReviewById,
    getUserReviews,
    getProductReviews,
    updateReview,
    publishReview,
};
