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
exports.BlogServices = void 0;
const slugify_1 = __importDefault(require("slugify"));
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const fileDelete_1 = require("../../helpers/fileDelete");
const client_1 = require("../../../prisma/client");
const createBlog = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const slug = (0, slugify_1.default)(payload.title, { lower: true, strict: true });
    const existingSlug = yield client_1.prisma.blog.findUnique({ where: { slug } });
    if (existingSlug) {
        throw new AppError_1.default(400, 'Blog title must be unique for slug generation');
    }
    const result = yield client_1.prisma.blog.create({
        data: {
            userId: payload.userId,
            title: payload.title,
            content: payload.content,
            imageUrl: payload.imageUrl,
            others: payload.others,
            isPublish: payload.isPublish,
            metaTitle: payload.metaTitle,
            metaDescription: payload.metaDescription,
            keywords: payload.keywords,
            slug,
        },
    });
    return result;
});
const updateBlog = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    let slug = payload.slug;
    if (payload.title && (!slug || (0, slugify_1.default)(payload.title, { lower: true, strict: true }) !== slug)) {
        slug = (0, slugify_1.default)(payload.title, { lower: true, strict: true });
        const existingSlug = yield client_1.prisma.blog.findUnique({ where: { slug } });
        if (existingSlug && existingSlug.id !== id) {
            throw new AppError_1.default(400, 'Blog title must be unique for slug generation');
        }
    }
    const result = yield client_1.prisma.blog.update({
        where: { id },
        data: {
            title: payload.title,
            content: payload.content,
            imageUrl: payload.imageUrl,
            others: payload.others,
            isPublish: payload.isPublish,
            metaTitle: payload.metaTitle,
            metaDescription: payload.metaDescription,
            keywords: payload.keywords,
            slug,
        },
    });
    return result;
});
// Get all blog for normal user
const getAllBlogs = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams, [
        'title',
        'content',
    ]);
    // Add isPublish filter to queryParams before building the query
    queryParams.isPublish = true;
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .buildSelect()
        .getQuery();
    const blogs = yield client_1.prisma.blog.findMany(Object.assign(Object.assign({}, prismaQuery), { include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                },
            },
        } }));
    const meta = yield queryBuilder.getPaginationMeta(client_1.prisma.blog);
    return {
        meta,
        data: blogs,
    };
});
// --- Admin --- Get All Blogs with ispublished = false and isdeleted = true
const getAllBlogsAdmin = (queryParams) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.PrismaQueryBuilder(queryParams, [
        'title',
        'content',
    ]);
    const prismaQuery = queryBuilder
        .buildWhere()
        .buildSort()
        .buildPagination()
        .buildSelect()
        .getQuery();
    const blogs = yield client_1.prisma.blog.findMany(Object.assign(Object.assign({}, prismaQuery), { include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                },
            },
        } }));
    const meta = yield queryBuilder.getPaginationMeta(client_1.prisma.blog);
    return {
        meta,
        data: blogs,
    };
});
const getBlog = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    const blog = yield client_1.prisma.blog.findUnique({
        where: { slug, isPublish: true },
        include: {
            user: { select: { id: true, name: true, imageUrl: true, email: true } },
        },
    });
    if (!blog)
        return null;
    const relatedBlogs = yield client_1.prisma.blog.findMany({
        where: {
            userId: blog.userId,
            NOT: { slug },
            isPublish: true,
        },
        select: {
            id: true,
            title: true,
            content: true,
            imageUrl: true,
            slug: true,
            metaTitle: true,
            metaDescription: true,
            keywords: true,
        },
        take: 8,
        orderBy: {
            createdAt: 'desc',
        },
    });
    return {
        blog,
        relatedBlogs,
    };
});
const deleteBlog = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const blog = yield client_1.prisma.blog.findUnique({
        where: {
            id,
        },
    });
    if (!blog)
        throw new AppError_1.default(404, 'Blog not found');
    if (blog.imageUrl) {
        yield (0, fileDelete_1.deleteFile)(blog.imageUrl);
    }
    const result = yield client_1.prisma.blog.delete({
        where: {
            id,
        },
    });
    return result;
});
exports.BlogServices = {
    createBlog,
    getAllBlogs,
    getAllBlogsAdmin,
    getBlog,
    updateBlog,
    deleteBlog,
};
