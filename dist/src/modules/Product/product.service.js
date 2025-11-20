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
exports.ProductServices = exports.updateProduct = exports.createProduct = void 0;
const date_fns_1 = require("date-fns");
const client_1 = require("../../../prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const fileDelete_1 = require("../../helpers/fileDelete");
const queryBuilder_1 = __importDefault(require("../../helpers/queryBuilder"));
const product_constant_1 = require("./product.constant");
const slugify_1 = __importDefault(require("slugify"));
// Create Product
const createProduct = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Check if category exists
    const categoryExists = yield client_1.prisma.category.findUnique({
        where: { id: payload.categoryId },
    });
    if (!categoryExists) {
        throw new AppError_1.default(404, 'Category not found');
    }
    // Check if collection exists (if provided)
    if (payload.collectionId) {
        const collectionExists = yield client_1.prisma.collection.findUnique({
            where: { id: payload.collectionId },
        });
        if (!collectionExists) {
            throw new AppError_1.default(404, 'Collection not found');
        }
    }
    // Check for duplicate SKUs
    const existingSKUs = yield client_1.prisma.productVariant.findMany({
        where: { sku: { in: payload.variants.map(v => v.sku) } },
        select: { sku: true },
    });
    if (existingSKUs.length > 0) {
        throw new AppError_1.default(400, `SKU already exists: ${existingSKUs.map(s => s.sku).join(', ')}`);
    }
    // Generate slug
    const slug = (0, slugify_1.default)(payload.name, { lower: true, strict: true });
    // 1️⃣ Create the product first (without stock at product level)
    const result = yield client_1.prisma.product.create({
        data: {
            name: payload.name,
            description: payload.description,
            slug,
            primaryImage: payload.primaryImage,
            otherImages: payload.otherImages || [],
            videoUrl: payload.videoUrl,
            tags: payload.tags,
            brand: payload.brand,
            gender: payload.gender,
            fitType: payload.fitType,
            neckline: payload.neckline,
            sleeveType: payload.sleeveType,
            occasion: payload.occasion,
            careInstructions: payload.careInstructions,
            madeIn: payload.madeIn,
            categoryId: payload.categoryId,
            collectionId: payload.collectionId,
            published: payload.published,
            supplier: payload.supplier,
            variants: {
                create: payload.variants.map(v => ({
                    sku: v.sku,
                    size: v.size,
                    color: v.color,
                    price: v.price,
                    costPrice: v.costPrice,
                    stock: v.stock || 0, // Stock at variant level
                    images: v.images || [],
                })),
            },
        },
        include: {
            variants: true,
            category: true,
            collection: true,
        },
    });
    // 2️⃣ Add Fabric relations using upsert (safe for MongoDB)
    if ((_a = payload.fabricIds) === null || _a === void 0 ? void 0 : _a.length) {
        for (const fabricId of payload.fabricIds) {
            yield client_1.prisma.productFabric.upsert({
                where: {
                    productId_fabricId: {
                        productId: result.id,
                        fabricId,
                    },
                },
                create: { productId: result.id, fabricId },
                update: {}, // do nothing if exists
            });
        }
    }
    // 2️⃣ Add Material relations using upsert (safe for MongoDB)
    if ((_b = payload.materialIds) === null || _b === void 0 ? void 0 : _b.length) {
        for (const materialId of payload.materialIds) {
            yield client_1.prisma.productMaterial.upsert({
                where: {
                    productId_materialId: {
                        productId: result.id,
                        materialId,
                    },
                },
                create: { productId: result.id, materialId },
                update: {}, // do nothing if exists
            });
        }
    }
    // 3️⃣ Fetch the product again including fabrics
    const finalProduct = yield client_1.prisma.product.findUnique({
        where: { id: result.id },
        include: {
            variants: true,
            category: true,
            collection: true,
            ProductFabric: { include: { fabric: true } },
        },
    });
    return formatProductResponse(finalProduct);
});
exports.createProduct = createProduct;
// Get All Products (Public)
const getAllProducts = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new queryBuilder_1.default(query, client_1.prisma.product);
    let results = yield queryBuilder
        .filter(product_constant_1.productFilterFields)
        .search(product_constant_1.productSearchFields)
        .nestedFilter(product_constant_1.productNestedFilters)
        .sort()
        .paginate()
        .include(product_constant_1.productInclude)
        .fields()
        .filterByRange(product_constant_1.productRangeFilter)
        .rawFilter({ published: true })
        .execute();
    const meta = yield queryBuilder.countTotal();
    // Apply stock filtering (check variant stocks)
    if (query.stock === 'in') {
        results = results.filter((product) => product.variants.some((v) => v.stock > 0));
    }
    else if (query.stock === 'out') {
        results = results.filter((product) => product.variants.every((v) => v.stock === 0));
    }
    // Apply custom sorting
    results = applySorting(results, query.sortBy);
    return {
        data: results.map(formatProductResponse),
        meta,
    };
});
// Get All Products (Admin)
const getAllProductsAdmin = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new queryBuilder_1.default(query, client_1.prisma.product);
    let results = yield queryBuilder
        .filter(product_constant_1.productFilterFields)
        .search(product_constant_1.productSearchFields)
        .nestedFilter(product_constant_1.productNestedFilters)
        .sort()
        .paginate()
        .include(product_constant_1.productAdminInclude)
        .fields()
        .filterByRange(product_constant_1.productRangeFilter)
        .execute();
    const meta = yield queryBuilder.countTotal();
    // Apply stock filtering
    if (query.stock === 'in') {
        results = results.filter((product) => product.variants.some((v) => v.stock > 0));
    }
    else if (query.stock === 'out') {
        results = results.filter((product) => product.variants.every((v) => v.stock === 0));
    }
    // Apply custom sorting
    results = applySorting(results, query.sortBy);
    return {
        data: results.map(formatProductResponse),
        meta,
    };
});
// Get Single Product
const getProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield client_1.prisma.product.findUnique({
        where: { id },
        include: product_constant_1.productDetailInclude,
    });
    if (!product)
        return null;
    // Get related products
    const relatedProducts = yield client_1.prisma.product.findMany({
        where: {
            OR: [
                { categoryId: product.categoryId },
                { brand: product.brand },
                { collectionId: product.collectionId },
                { gender: product.gender },
            ],
            id: { not: id },
            published: true,
        },
        include: product_constant_1.productInclude,
        take: product_constant_1.QUERY_DEFAULTS.RELATED_LIMIT,
        orderBy: { salesCount: 'desc' },
    });
    const formattedProduct = formatProductResponse(product);
    return Object.assign(Object.assign({}, formattedProduct), { relatedProducts: relatedProducts.map(formatProductResponse) });
});
// Get Product By Slug
const getProductBySlug = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield client_1.prisma.product.findUnique({
        where: { slug },
        include: product_constant_1.productDetailInclude,
    });
    if (!product)
        return null;
    // Get related products
    const relatedProducts = yield client_1.prisma.product.findMany({
        where: {
            OR: [
                { categoryId: product.categoryId },
                { brand: product.brand },
                { collectionId: product.collectionId },
                { gender: product.gender },
            ],
            id: { not: product.id },
            published: true,
        },
        include: product_constant_1.productInclude,
        take: product_constant_1.QUERY_DEFAULTS.RELATED_LIMIT,
        orderBy: { salesCount: 'desc' },
    });
    const formattedProduct = formatProductResponse(product);
    return Object.assign(Object.assign({}, formattedProduct), { relatedProducts: relatedProducts.map(formatProductResponse) });
});
// Update Product
const updateProduct = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // 1️⃣ Fetch existing product
    const existingProduct = yield client_1.prisma.product.findUnique({
        where: { id },
        include: {
            variants: true,
            ProductFabric: true,
        },
    });
    if (!existingProduct) {
        throw new AppError_1.default(404, 'Product not found');
    }
    // 2️⃣ Check category if provided
    if (payload.categoryId) {
        const categoryExists = yield client_1.prisma.category.findUnique({
            where: { id: payload.categoryId },
        });
        if (!categoryExists) {
            throw new AppError_1.default(404, 'Category not found');
        }
    }
    // 2.5️⃣ Check collection if provided
    if (payload.collectionId) {
        const collectionExists = yield client_1.prisma.collection.findUnique({
            where: { id: payload.collectionId },
        });
        if (!collectionExists) {
            throw new AppError_1.default(404, 'Collection not found');
        }
    }
    // 3️⃣ Handle image updates
    let primaryImage = existingProduct.primaryImage;
    let otherImages = existingProduct.otherImages;
    if (payload.imagesToKeep || payload.newImages) {
        const imagesToKeep = payload.imagesToKeep || [];
        const newImages = payload.newImages || [];
        const currentImages = [existingProduct.primaryImage, ...existingProduct.otherImages];
        const imagesToDelete = currentImages.filter(img => img && !imagesToKeep.includes(img) && !newImages.includes(img));
        yield Promise.all(imagesToDelete.map(fileDelete_1.deleteFile));
        const allNewImages = [...imagesToKeep, ...newImages];
        if (allNewImages.length > 0) {
            primaryImage = allNewImages[0];
            otherImages = allNewImages.slice(1);
        }
    }
    // 4️⃣ Check for duplicate SKUs if variants are being updated
    if ((_a = payload.variants) === null || _a === void 0 ? void 0 : _a.length) {
        const existingSKUs = yield client_1.prisma.productVariant.findMany({
            where: {
                sku: { in: payload.variants.map(v => v.sku) },
                productId: { not: id },
            },
            select: { sku: true },
        });
        if (existingSKUs.length > 0) {
            throw new AppError_1.default(400, `SKU already exists: ${existingSKUs.map(s => s.sku).join(', ')}`);
        }
    }
    // 5️⃣ Update main product
    const updatedProduct = yield client_1.prisma.product.update({
        where: { id },
        data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (payload.name && { name: payload.name, slug: (0, slugify_1.default)(payload.name, { lower: true, strict: true }) })), (payload.description && { description: payload.description })), (primaryImage && { primaryImage })), (otherImages && { otherImages })), (payload.videoUrl !== undefined && { videoUrl: payload.videoUrl })), (payload.tags && { tags: payload.tags })), (payload.brand !== undefined && { brand: payload.brand })), (payload.gender !== undefined && { gender: payload.gender })), (payload.fitType !== undefined && { fitType: payload.fitType })), (payload.pattern !== undefined && { pattern: payload.pattern })), (payload.neckline !== undefined && { neckline: payload.neckline })), (payload.sleeveType !== undefined && { sleeveType: payload.sleeveType })), (payload.occasion && { occasion: payload.occasion })), (payload.careInstructions !== undefined && { careInstructions: payload.careInstructions })), (typeof payload.sustainable === 'boolean' && { sustainable: payload.sustainable })), (payload.madeIn !== undefined && { madeIn: payload.madeIn })), (payload.categoryId && { categoryId: payload.categoryId })), (payload.collectionId !== undefined && { collectionId: payload.collectionId })), (typeof payload.published === 'boolean' && { published: payload.published })), (payload.supplier !== undefined && { supplier: payload.supplier })),
    });
    // 6️⃣ Update variants
    if ((_b = payload.variants) === null || _b === void 0 ? void 0 : _b.length) {
        yield client_1.prisma.productVariant.deleteMany({ where: { productId: id } });
        yield client_1.prisma.productVariant.createMany({
            data: payload.variants.map(v => ({
                sku: v.sku,
                size: v.size,
                color: v.color,
                price: v.price,
                costPrice: v.costPrice,
                stock: v.stock || 0,
                images: v.images || [],
                productId: id,
            })),
        });
    }
    // 7️⃣ Update Fabric relations using upsert
    if (payload.fabricIds) {
        // Delete any fabric that is not in the payload
        yield client_1.prisma.productFabric.deleteMany({
            where: { productId: id, fabricId: { notIn: payload.fabricIds } },
        });
        // Upsert each fabric
        for (const fabricId of payload.fabricIds) {
            yield client_1.prisma.productFabric.upsert({
                where: {
                    productId_fabricId: { productId: id, fabricId },
                },
                create: { productId: id, fabricId },
                update: {}, // do nothing
            });
        }
    }
    // 8️⃣ Fetch the updated product with all relations
    const finalProduct = yield client_1.prisma.product.findUnique({
        where: { id },
        include: {
            variants: true,
            category: true,
            collection: true,
            ProductFabric: { include: { fabric: true } },
        },
    });
    return formatProductResponse(finalProduct);
});
exports.updateProduct = updateProduct;
// Delete Product
const deleteProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existingProduct = yield client_1.prisma.product.findUnique({
        where: { id },
        include: {
            variants: true,
            Review: true,
            wishlist: true,
            comboVariants: true,
        },
    });
    if (!existingProduct) {
        throw new AppError_1.default(404, product_constant_1.PRODUCT_ERROR_MESSAGES.NOT_FOUND);
    }
    const hasActiveOrders = yield client_1.prisma.order.findFirst({
        where: {
            productIds: { has: id },
            status: { not: 'CANCEL' },
        },
    });
    if (hasActiveOrders && existingProduct.published) {
        throw new AppError_1.default(400, product_constant_1.PRODUCT_ERROR_MESSAGES.PRODUCT_PUBLISHED_CANNOT_DELETE);
    }
    // Delete related data
    yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Delete wishlist items
        yield tx.wishlist.deleteMany({ where: { productId: id } });
        // Delete combo variants
        yield tx.comboVariant.deleteMany({ where: { productId: id } });
        // Delete reviews
        yield tx.review.deleteMany({ where: { productId: id } });
        // Delete stock logs
        yield tx.stockLog.deleteMany({ where: { productId: id } });
        // Delete variants (this will cascade delete their stock logs and discounts)
        yield tx.productVariant.deleteMany({ where: { productId: id } });
        // Delete discounts
        yield tx.discount.deleteMany({ where: { productId: id } });
        // Delete fabric relations
        yield tx.productFabric.deleteMany({ where: { productId: id } });
        // Delete product
        yield tx.product.delete({ where: { id } });
    }));
    // Delete images from storage
    const allImages = [existingProduct.primaryImage, ...existingProduct.otherImages];
    yield Promise.all(allImages.filter(Boolean).map(fileDelete_1.deleteFile));
    return { id };
});
// Get Trending Products
const getTrendingProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    const threeMonthsAgo = (0, date_fns_1.subMonths)(new Date(), 3);
    const recentOrders = yield client_1.prisma.order.findMany({
        where: {
            orderTime: { gte: threeMonthsAgo },
            isPaid: true,
            status: { not: 'CANCEL' },
        },
        select: { cartItems: true },
    });
    const productSales = {};
    for (const order of recentOrders) {
        const cart = order.cartItems;
        for (const item of cart) {
            if (item === null || item === void 0 ? void 0 : item.productId) {
                productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
            }
        }
    }
    const topProductIds = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, product_constant_1.QUERY_DEFAULTS.TRENDING_LIMIT)
        .map(([productId]) => productId);
    const trendingProducts = yield client_1.prisma.product.findMany({
        where: {
            id: { in: topProductIds },
            published: true,
        },
        include: product_constant_1.productInclude,
    });
    return trendingProducts.map((product) => (Object.assign(Object.assign({}, formatProductResponse(product)), { totalSold: productSales[product.id] || 0, trendingScore: Math.round((productSales[product.id] || 0) * 1.5) })));
});
// Get Navbar Products
const getNavbarProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    const threeMonthsAgo = (0, date_fns_1.subMonths)(new Date(), 3);
    const recentOrders = yield client_1.prisma.order.findMany({
        where: {
            orderTime: { gte: threeMonthsAgo },
            isPaid: true,
            status: { not: 'CANCEL' },
        },
        select: { cartItems: true },
    });
    const productSales = {};
    for (const order of recentOrders) {
        const cart = order.cartItems;
        for (const item of cart) {
            if (item === null || item === void 0 ? void 0 : item.productId) {
                productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
            }
        }
    }
    const products = yield client_1.prisma.product.findMany({
        where: {
            id: { in: Object.keys(productSales) },
            published: true,
        },
        include: { category: true },
    });
    const categoryWise = {};
    const overallList = [];
    for (const product of products) {
        const sold = productSales[product.id] || 0;
        const catName = product.category.categoryName;
        if (!categoryWise[catName]) {
            categoryWise[catName] = [];
        }
        categoryWise[catName].push({
            id: product.id,
            name: product.name,
            sold,
        });
        overallList.push({
            id: product.id,
            name: product.name,
            totalSold: sold,
        });
    }
    const publishedCategories = yield client_1.prisma.category.findMany({
        where: { published: true },
    });
    const trendingByCategory = {};
    for (const category of publishedCategories) {
        const catName = category.categoryName;
        const productsInCategory = categoryWise[catName] || [];
        const topProducts = productsInCategory
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 3)
            .map((p) => ({
            id: p.id,
            name: p.name,
        }));
        trendingByCategory[catName] = topProducts;
    }
    const overallTrending = overallList
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 3)
        .map((p) => ({
        id: p.id,
        name: p.name,
    }));
    return {
        trendingByCategory,
        overallTrending,
    };
});
// Get Featured Products
const getFeaturedProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield client_1.prisma.product.findMany({
        where: {
            published: true,
            salesCount: { gte: 10 },
        },
        include: product_constant_1.productInclude,
        orderBy: [
            { salesCount: 'desc' },
            { createdAt: 'desc' },
        ],
        take: 12,
    });
    return products.map(formatProductResponse);
});
// Get New Arrivals
const getNewArrivals = () => __awaiter(void 0, void 0, void 0, function* () {
    const cutoffDate = (0, date_fns_1.subDays)(new Date(), product_constant_1.QUERY_DEFAULTS.NEW_ARRIVALS_DAYS);
    const products = yield client_1.prisma.product.findMany({
        where: {
            published: true,
            createdAt: { gte: cutoffDate },
        },
        include: product_constant_1.productInclude,
        orderBy: { createdAt: 'desc' },
        take: 12,
    });
    return products.map(formatProductResponse);
});
// Get Products by Category
const getProductsByCategory = (categoryId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryQuery = Object.assign(Object.assign({}, query), { category: categoryId });
    const queryBuilder = new queryBuilder_1.default(categoryQuery, client_1.prisma.product);
    let results = yield queryBuilder
        .filter(product_constant_1.productFilterFields)
        .search(product_constant_1.productSearchFields)
        .nestedFilter(product_constant_1.productNestedFilters)
        .sort()
        .paginate()
        .include(product_constant_1.productInclude)
        .fields()
        .filterByRange(product_constant_1.productRangeFilter)
        .rawFilter({ published: true, categoryId })
        .execute();
    const meta = yield queryBuilder.countTotal();
    // Apply custom sorting
    results = applySorting(results, query.sortBy);
    return {
        data: results.map(formatProductResponse),
        meta,
    };
});
// Get Related Products
const getRelatedProducts = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield client_1.prisma.product.findUnique({
        where: { id: productId },
        select: { categoryId: true, brand: true, gender: true, collectionId: true },
    });
    if (!product) {
        throw new AppError_1.default(404, product_constant_1.PRODUCT_ERROR_MESSAGES.NOT_FOUND);
    }
    const [sameBrand, sameCategory, sameGender, sameCollection] = yield Promise.all([
        // Same brand products
        client_1.prisma.product.findMany({
            where: {
                brand: product.brand,
                id: { not: productId },
                published: true,
            },
            include: product_constant_1.productInclude,
            take: 4,
            orderBy: { salesCount: 'desc' },
        }),
        // Same category products
        client_1.prisma.product.findMany({
            where: {
                categoryId: product.categoryId,
                id: { not: productId },
                published: true,
            },
            include: product_constant_1.productInclude,
            take: 4,
            orderBy: { salesCount: 'desc' },
        }),
        // Same gender
        client_1.prisma.product.findMany({
            where: {
                gender: product.gender,
                id: { not: productId },
                published: true,
            },
            include: product_constant_1.productInclude,
            take: 4,
            orderBy: { salesCount: 'desc' },
        }),
        // Same collection
        product.collectionId
            ? client_1.prisma.product.findMany({
                where: {
                    collectionId: product.collectionId,
                    id: { not: productId },
                    published: true,
                },
                include: product_constant_1.productInclude,
                take: 4,
                orderBy: { salesCount: 'desc' },
            })
            : Promise.resolve([]),
    ]);
    return {
        sameBrand: sameBrand.map(formatProductResponse),
        sameCategory: sameCategory.map(formatProductResponse),
        sameGender: sameGender.map(formatProductResponse),
        sameCollection: sameCollection.map(formatProductResponse),
    };
});
// Search Products
const searchProducts = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield getAllProducts(query);
    // Get available filters
    const [brands, categories, collections, priceRange, genders, fitTypes] = yield Promise.all([
        client_1.prisma.product.findMany({
            where: { published: true, brand: { not: null } },
            select: { brand: true },
            distinct: ['brand'],
        }),
        client_1.prisma.category.findMany({
            where: { published: true },
            select: { id: true, categoryName: true },
        }),
        client_1.prisma.collection.findMany({
            where: { published: true },
            select: { id: true, collectionName: true },
        }),
        client_1.prisma.productVariant.aggregate({
            _min: { price: true },
            _max: { price: true },
        }),
        client_1.prisma.product.findMany({
            where: { published: true, gender: { not: null } },
            select: { gender: true },
            distinct: ['gender'],
        }),
        client_1.prisma.product.findMany({
            where: { published: true, fitType: { not: null } },
            select: { fitType: true },
            distinct: ['fitType'],
        }),
    ]);
    return Object.assign(Object.assign({}, result), { filters: {
            brands: brands.map(b => b.brand).filter(Boolean),
            categories: categories.map(c => ({ id: c.id, name: c.categoryName })),
            collections: collections.map(c => ({ id: c.id, name: c.collectionName })),
            priceRange: {
                min: priceRange._min.price || 0,
                max: priceRange._max.price || 0,
            },
            genders: genders.map(g => g.gender).filter(Boolean),
            fitTypes: fitTypes.map(f => f.fitType).filter(Boolean),
        }, meta: Object.assign(Object.assign({}, result.meta), { totalPages: result.meta.totalPage }) });
});
// Get Product Variants
const getProductVariants = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const variants = yield client_1.prisma.productVariant.findMany({
        where: { productId },
        // include: {
        //   color: true,
        // },
        orderBy: [{ size: 'asc' }, { price: 'asc' }],
    });
    if (!variants.length) {
        throw new AppError_1.default(404, 'No variants found for this product');
    }
    return variants;
});
// Update Variant Stock
const updateVariantStock = (variantId, addedStock, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const variant = yield client_1.prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
    });
    if (!variant) {
        throw new AppError_1.default(404, product_constant_1.PRODUCT_ERROR_MESSAGES.VARIANT_NOT_FOUND);
    }
    const newStock = variant.stock + addedStock;
    // Update variant stock and create stock log
    yield client_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.productVariant.update({
            where: { id: variantId },
            data: { stock: newStock },
        });
        yield tx.stockLog.create({
            data: {
                productId: variant.productId,
                variantId,
                change: addedStock,
                reason: reason || 'Stock updated',
            },
        });
    }));
    const updatedVariant = yield client_1.prisma.productVariant.findUnique({
        where: { id: variantId },
        // include: { color: true },
    });
    return updatedVariant;
});
// Get Product Analytics
const getProductAnalytics = () => __awaiter(void 0, void 0, void 0, function* () {
    const [totalProducts, publishedProducts, totalVariants, priceStats, categoryStats, brandStats, lowStockVariants, outOfStockVariants,] = yield Promise.all([
        client_1.prisma.product.count(),
        client_1.prisma.product.count({ where: { published: true } }),
        client_1.prisma.productVariant.count(),
        client_1.prisma.productVariant.aggregate({
            _avg: { price: true },
            _sum: { price: true },
        }),
        client_1.prisma.product.groupBy({
            by: ['categoryId'],
            _count: { _all: true },
            where: { published: true },
        }),
        client_1.prisma.product.groupBy({
            by: ['brand'],
            _count: { _all: true },
            where: { published: true, brand: { not: null } },
        }),
        client_1.prisma.productVariant.count({
            where: { stock: { lte: product_constant_1.QUERY_DEFAULTS.LOW_STOCK_THRESHOLD } },
        }),
        client_1.prisma.productVariant.count({
            where: { stock: 0 },
        }),
    ]);
    // Get category names
    const categories = yield client_1.prisma.category.findMany({
        where: { id: { in: categoryStats.map(c => c.categoryId) } },
    });
    const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat.categoryName;
        return acc;
    }, {});
    const topCategories = categoryStats.map(stat => ({
        categoryName: categoryMap[stat.categoryId] || 'Unknown',
        productCount: stat._count._all,
        percentage: Math.round((stat._count._all / publishedProducts) * 100),
    }));
    const topBrands = brandStats.map(stat => ({
        brand: stat.brand || 'Unknown',
        productCount: stat._count._all,
        percentage: Math.round((stat._count._all / publishedProducts) * 100),
    }));
    return {
        totalProducts,
        publishedProducts,
        unpublishedProducts: totalProducts - publishedProducts,
        totalVariants,
        lowStockVariants,
        outOfStockVariants,
        totalValue: priceStats._sum.price || 0,
        averagePrice: priceStats._avg.price || 0,
        topCategories: topCategories.slice(0, 5),
        topBrands: topBrands.slice(0, 5),
    };
});
// Get Low Stock Products
const getLowStockProducts = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (threshold = product_constant_1.QUERY_DEFAULTS.LOW_STOCK_THRESHOLD) {
    const products = yield client_1.prisma.product.findMany({
        where: {
            variants: {
                some: {
                    stock: { lte: threshold },
                },
            },
        },
        include: {
            variants: {
                where: { stock: { lte: threshold } },
                // include: {
                //   color: true,
                // },
            },
            category: { select: { categoryName: true } },
        },
        orderBy: { name: 'asc' },
    });
    return products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category.categoryName,
        lowStockVariants: product.variants.map(v => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            stock: v.stock,
        })),
    }));
});
// Get Bestsellers
const getBestsellers = () => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield client_1.prisma.product.findMany({
        where: { published: true },
        include: product_constant_1.productInclude,
        orderBy: { salesCount: 'desc' },
        take: 20,
    });
    return products.map((product, index) => (Object.assign(Object.assign({}, formatProductResponse(product)), { totalSold: product.salesCount, trendingScore: 100 - index })));
});
// Get Stock Logs
const getStockLogs = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield client_1.prisma.product.findUnique({
        where: { id: productId },
    });
    if (!product) {
        throw new AppError_1.default(404, product_constant_1.PRODUCT_ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }
    const logs = yield client_1.prisma.stockLog.findMany({
        where: { productId },
        include: {
            product: { select: { name: true } },
            variant: {
                select: {
                    sku: true,
                    size: true,
                    color: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return logs.map((log) => ({
        id: log.id,
        productId: log.productId,
        variantId: log.variantId,
        change: log.change,
        reason: log.reason,
        notes: log.notes,
        createdAt: log.createdAt.toISOString(),
        product: { name: log.product.name },
        variant: log.variant
            ? {
                sku: log.variant.sku,
                size: log.variant.size,
                color: log.variant.color,
            }
            : null,
    }));
});
// Get Variant Stock Logs
const getVariantStockLogs = (variantId) => __awaiter(void 0, void 0, void 0, function* () {
    const variant = yield client_1.prisma.productVariant.findUnique({
        where: { id: variantId },
    });
    if (!variant) {
        throw new AppError_1.default(404, product_constant_1.PRODUCT_ERROR_MESSAGES.VARIANT_NOT_FOUND);
    }
    const logs = yield client_1.prisma.stockLog.findMany({
        where: { variantId },
        include: {
            product: { select: { name: true } },
            variant: {
                select: {
                    sku: true,
                    size: true,
                    color: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return logs.map((log) => ({
        id: log.id,
        productId: log.productId,
        variantId: log.variantId,
        change: log.change,
        reason: log.reason,
        notes: log.notes,
        createdAt: log.createdAt.toISOString(),
        product: { name: log.product.name },
        variant: log.variant
            ? {
                sku: log.variant.sku,
                size: log.variant.size,
                color: log.variant.color,
            }
            : null,
    }));
});
// Bulk Update Variant Stocks
const bulkUpdateVariantStocks = (updates) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield Promise.all(updates.map((update) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            return yield updateVariantStock(update.variantId, update.addedStock, update.reason);
        }
        catch (error) {
            return { variantId: update.variantId, error: error.message };
        }
    })));
    return results;
});
// Get Products by Collection
const getProductsByCollection = (collectionId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const collectionQuery = Object.assign(Object.assign({}, query), { collection: collectionId });
    const queryBuilder = new queryBuilder_1.default(collectionQuery, client_1.prisma.product);
    let results = yield queryBuilder
        .filter(product_constant_1.productFilterFields)
        .search(product_constant_1.productSearchFields)
        .nestedFilter(product_constant_1.productNestedFilters)
        .sort()
        .paginate()
        .include(product_constant_1.productInclude)
        .fields()
        .filterByRange(product_constant_1.productRangeFilter)
        .rawFilter({ published: true, collectionId })
        .execute();
    const meta = yield queryBuilder.countTotal();
    // Apply custom sorting
    results = applySorting(results, query.sortBy);
    return {
        data: results.map(formatProductResponse),
        meta,
    };
});
// Get Out of Stock Products
const getOutOfStockProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield client_1.prisma.product.findMany({
        where: {
            variants: {
                every: {
                    stock: 0,
                },
            },
        },
        include: {
            variants: true,
            category: { select: { categoryName: true } },
        },
        orderBy: { name: 'asc' },
    });
    return products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category.categoryName,
        variants: product.variants.map(v => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            stock: v.stock,
        })),
    }));
});
// Helper Functions
const formatProductResponse = (product) => {
    var _a, _b;
    const variants = product.variants || [];
    const prices = variants.map((v) => v.price);
    const reviews = product.Review || [];
    // Calculate total stock from all variants
    const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    // Calculate average rating and review count
    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : 0;
    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        primaryImage: product.primaryImage,
        otherImages: product.otherImages || [],
        videoUrl: product.videoUrl,
        tags: product.tags || [],
        salesCount: product.salesCount,
        published: product.published,
        // Apparel specifications
        brand: product.brand,
        gender: product.gender,
        fitType: product.fitType,
        pattern: product.pattern,
        neckline: product.neckline,
        sleeveType: product.sleeveType,
        occasion: product.occasion || [],
        careInstructions: product.careInstructions,
        sustainable: product.sustainable,
        madeIn: product.madeIn,
        categoryId: product.categoryId,
        category: product.category,
        collectionId: product.collectionId,
        collection: product.collection,
        // Map fabric IDs
        fabricIds: ((_a = product.ProductFabric) === null || _a === void 0 ? void 0 : _a.map((pf) => pf.fabric.id)) || [],
        fabrics: ((_b = product.ProductFabric) === null || _b === void 0 ? void 0 : _b.map((pf) => pf.fabric)) || [],
        supplier: product.supplier,
        variants: variants.map((v) => (Object.assign(Object.assign({}, v), { color: v.color }))),
        // Computed fields
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        totalStock,
        inStock: totalStock > 0,
        // Available sizes and colors
        availableSizes: [...new Set(variants.map((v) => v.size))],
        availableColors: [...new Set(variants.map((v) => v.color))],
        // availableColors: Array.from(
        //   new Map(variants.map((v: any) => [v.color]))
        // ) as IColor[],
        // Review fields
        reviews: reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            isPublished: r.isPublished,
            productId: r.productId,
            userId: r.userId,
            user: r.user
                ? { name: r.user.name, imageUrl: r.user.imageUrl || '/default-avatar.png' }
                : { name: 'Anonymous', imageUrl: '/default-avatar.png' },
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        })),
        averageRating: parseFloat(averageRating.toFixed(2)),
        reviewCount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
};
const applySorting = (results, sortBy) => {
    if (sortBy === 'price_asc') {
        return results.sort((a, b) => {
            const minA = Math.min(...a.variants.map((v) => v.price));
            const minB = Math.min(...b.variants.map((v) => v.price));
            return minA - minB;
        });
    }
    else if (sortBy === 'price_desc') {
        return results.sort((a, b) => {
            const minA = Math.min(...a.variants.map((v) => v.price));
            const minB = Math.min(...b.variants.map((v) => v.price));
            return minB - minA;
        });
    }
    else if (sortBy === 'rating_asc') {
        return results.sort((a, b) => {
            const avgA = a.Review && a.Review.length > 0
                ? a.Review.reduce((sum, r) => sum + r.rating, 0) / a.Review.length
                : 0;
            const avgB = b.Review && b.Review.length > 0
                ? b.Review.reduce((sum, r) => sum + r.rating, 0) / b.Review.length
                : 0;
            return avgA - avgB;
        });
    }
    else if (sortBy === 'rating_desc') {
        return results.sort((a, b) => {
            const avgA = a.Review && a.Review.length > 0
                ? a.Review.reduce((sum, r) => sum + r.rating, 0) / a.Review.length
                : 0;
            const avgB = b.Review && b.Review.length > 0
                ? b.Review.reduce((sum, r) => sum + r.rating, 0) / b.Review.length
                : 0;
            return avgB - avgA;
        });
    }
    else if (sortBy === 'newest') {
        return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return results;
};
exports.ProductServices = {
    createProduct: exports.createProduct,
    getAllProducts,
    getAllProductsAdmin,
    getProduct,
    getProductBySlug,
    updateProduct: exports.updateProduct,
    deleteProduct,
    getTrendingProducts,
    getNavbarProducts,
    getFeaturedProducts,
    getNewArrivals,
    getProductsByCategory,
    getProductsByCollection,
    getRelatedProducts,
    searchProducts,
    getProductVariants,
    updateVariantStock,
    bulkUpdateVariantStocks,
    getProductAnalytics,
    getLowStockProducts,
    getOutOfStockProducts,
    getBestsellers,
    getStockLogs,
    getVariantStockLogs,
};
