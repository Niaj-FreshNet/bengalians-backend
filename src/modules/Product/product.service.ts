import { subDays, subMonths } from 'date-fns';
import { prisma } from '../../../prisma/client';
import AppError from '../../errors/AppError';
import { deleteFile } from '../../helpers/fileDelete';
import QueryBuilder from '../../helpers/queryBuilder';
import {
  IProduct,
  IUpdateProduct,
  IProductQuery,
  IProductResponse,
  IProductAnalytics,
  ITrendingProduct,
  IRelatedProductsResponse,
  IProductSearchResult,
  IColor,
} from './product.interface';
import {
  productFilterFields,
  productSearchFields,
  productArraySearchFields,
  productNestedFilters,
  productRangeFilter,
  productInclude,
  productDetailInclude,
  productAdminInclude,
  QUERY_DEFAULTS,
  PRODUCT_ERROR_MESSAGES,
} from './product.constant';
import { ClothingSize } from '@prisma/client';
import slugify from 'slugify';

// Create Product
export const createProduct = async (payload: IProduct): Promise<IProductResponse> => {
  // Check if category exists
  const categoryExists = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });
  if (!categoryExists) {
    throw new AppError(404, 'Category not found');
  }

  // Check if collection exists (if provided)
  if (payload.collectionId) {
    const collectionExists = await prisma.collection.findUnique({
      where: { id: payload.collectionId },
    });
    if (!collectionExists) {
      throw new AppError(404, 'Collection not found');
    }
  }

  // Check for duplicate SKUs
  const existingSKUs = await prisma.productVariant.findMany({
    where: { sku: { in: payload.variants.map(v => v.sku) } },
    select: { sku: true },
  });

  if (existingSKUs.length > 0) {
    throw new AppError(
      400,
      `SKU already exists: ${existingSKUs.map(s => s.sku).join(', ')}`
    );
  }

  // Generate slug
  const slug = slugify(payload.name, { lower: true, strict: true });

  // 1️⃣ Create the product first (without stock at product level)
  const result = await prisma.product.create({
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
          size: v.size as ClothingSize,
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
  if (payload.fabricIds?.length) {
    for (const fabricId of payload.fabricIds) {
      await prisma.productFabric.upsert({
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
  if (payload.materialIds?.length) {
    for (const materialId of payload.materialIds) {
      await prisma.productMaterial.upsert({
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
  const finalProduct = await prisma.product.findUnique({
    where: { id: result.id },
    include: {
      variants: true,
      category: true,
      collection: true,
      ProductFabric: { include: { fabric: true } },
    },
  });

  return formatProductResponse(finalProduct!);
};

// Get All Products (Public)
const getAllProducts = async (query: IProductQuery) => {
  const queryBuilder = new QueryBuilder(query, prisma.product);

  let results = await queryBuilder
    .filter(productFilterFields)
    .search(productSearchFields)
    .nestedFilter(productNestedFilters)
    .sort()
    .paginate()
    .include(productInclude)
    .fields()
    .filterByRange(productRangeFilter)
    .rawFilter({ published: true })
    .execute();

  const meta = await queryBuilder.countTotal();

  // Apply stock filtering (check variant stocks)
  if (query.stock === 'in') {
    results = results.filter((product: any) =>
      product.variants.some((v: any) => v.stock > 0)
    );
  } else if (query.stock === 'out') {
    results = results.filter((product: any) =>
      product.variants.every((v: any) => v.stock === 0)
    );
  }

  // Apply custom sorting
  results = applySorting(results, query.sortBy);

  return {
    data: results.map(formatProductResponse),
    meta,
  };
};

// Get All Products (Admin)
const getAllProductsAdmin = async (query: IProductQuery) => {
  const queryBuilder = new QueryBuilder(query, prisma.product);

  let results = await queryBuilder
    .filter(productFilterFields)
    .search(productSearchFields)
    .nestedFilter(productNestedFilters)
    .sort()
    .paginate()
    .include(productAdminInclude)
    .fields()
    .filterByRange(productRangeFilter)
    .execute();

  const meta = await queryBuilder.countTotal();

  // Apply stock filtering
  if (query.stock === 'in') {
    results = results.filter((product: any) =>
      product.variants.some((v: any) => v.stock > 0)
    );
  } else if (query.stock === 'out') {
    results = results.filter((product: any) =>
      product.variants.every((v: any) => v.stock === 0)
    );
  }

  // Apply custom sorting
  results = applySorting(results, query.sortBy);

  return {
    data: results.map(formatProductResponse),
    meta,
  };
};

// Get Single Product
const getProduct = async (id: string): Promise<IProductResponse | null> => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productDetailInclude,
  });

  if (!product) return null;

  // Get related products
  const relatedProducts = await prisma.product.findMany({
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
    include: productInclude,
    take: QUERY_DEFAULTS.RELATED_LIMIT,
    orderBy: { salesCount: 'desc' },
  });

  const formattedProduct = formatProductResponse(product);

  return {
    ...formattedProduct,
    relatedProducts: relatedProducts.map(formatProductResponse),
  } as any;
};

// Get Product By Slug
const getProductBySlug = async (slug: string): Promise<IProductResponse | null> => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: productDetailInclude,
  });

  if (!product) return null;

  // Get related products
  const relatedProducts = await prisma.product.findMany({
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
    include: productInclude,
    take: QUERY_DEFAULTS.RELATED_LIMIT,
    orderBy: { salesCount: 'desc' },
  });

  const formattedProduct = formatProductResponse(product);

  return {
    ...formattedProduct,
    relatedProducts: relatedProducts.map(formatProductResponse),
  } as any;
};

// Update Product
export const updateProduct = async (
  id: string,
  payload: IUpdateProduct
): Promise<IProductResponse> => {
  // 1️⃣ Fetch existing product
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      ProductFabric: true,
    },
  });

  if (!existingProduct) {
    throw new AppError(404, 'Product not found');
  }

  // 2️⃣ Check category if provided
  if (payload.categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!categoryExists) {
      throw new AppError(404, 'Category not found');
    }
  }

  // 2.5️⃣ Check collection if provided
  if (payload.collectionId) {
    const collectionExists = await prisma.collection.findUnique({
      where: { id: payload.collectionId },
    });
    if (!collectionExists) {
      throw new AppError(404, 'Collection not found');
    }
  }

  // 3️⃣ Handle image updates
  let primaryImage = existingProduct.primaryImage;
  let otherImages = existingProduct.otherImages;

  if (payload.imagesToKeep || payload.newImages) {
    const imagesToKeep = payload.imagesToKeep || [];
    const newImages = payload.newImages || [];

    const currentImages = [existingProduct.primaryImage, ...existingProduct.otherImages];
    const imagesToDelete = currentImages.filter(
      img => img && !imagesToKeep.includes(img) && !newImages.includes(img)
    );

    await Promise.all(imagesToDelete.map(deleteFile));

    const allNewImages = [...imagesToKeep, ...newImages];
    if (allNewImages.length > 0) {
      primaryImage = allNewImages[0];
      otherImages = allNewImages.slice(1);
    }
  }

  // 4️⃣ Check for duplicate SKUs if variants are being updated
  if (payload.variants?.length) {
    const existingSKUs = await prisma.productVariant.findMany({
      where: {
        sku: { in: payload.variants.map(v => v.sku) },
        productId: { not: id },
      },
      select: { sku: true },
    });
    if (existingSKUs.length > 0) {
      throw new AppError(400, `SKU already exists: ${existingSKUs.map(s => s.sku).join(', ')}`);
    }
  }

  // 5️⃣ Update main product
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      ...(payload.name && { name: payload.name, slug: slugify(payload.name, { lower: true, strict: true }) }),
      ...(payload.description && { description: payload.description }),
      ...(primaryImage && { primaryImage }),
      ...(otherImages && { otherImages }),
      ...(payload.videoUrl !== undefined && { videoUrl: payload.videoUrl }),
      ...(payload.tags && { tags: payload.tags }),
      ...(payload.brand !== undefined && { brand: payload.brand }),
      ...(payload.gender !== undefined && { gender: payload.gender }),
      ...(payload.fitType !== undefined && { fitType: payload.fitType }),
      ...(payload.pattern !== undefined && { pattern: payload.pattern }),
      ...(payload.neckline !== undefined && { neckline: payload.neckline }),
      ...(payload.sleeveType !== undefined && { sleeveType: payload.sleeveType }),
      ...(payload.occasion && { occasion: payload.occasion }),
      ...(payload.careInstructions !== undefined && { careInstructions: payload.careInstructions }),
      ...(typeof payload.sustainable === 'boolean' && { sustainable: payload.sustainable }),
      ...(payload.madeIn !== undefined && { madeIn: payload.madeIn }),
      ...(payload.categoryId && { categoryId: payload.categoryId }),
      ...(payload.collectionId !== undefined && { collectionId: payload.collectionId }),
      ...(typeof payload.published === 'boolean' && { published: payload.published }),
      ...(payload.supplier !== undefined && { supplier: payload.supplier }),
    },
  });

  // 6️⃣ Update variants
  if (payload.variants?.length) {
    await prisma.productVariant.deleteMany({ where: { productId: id } });

    await prisma.productVariant.createMany({
      data: payload.variants.map(v => ({
        sku: v.sku,
        size: v.size as ClothingSize,
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
    await prisma.productFabric.deleteMany({
      where: { productId: id, fabricId: { notIn: payload.fabricIds } },
    });

    // Upsert each fabric
    for (const fabricId of payload.fabricIds) {
      await prisma.productFabric.upsert({
        where: {
          productId_fabricId: { productId: id, fabricId },
        },
        create: { productId: id, fabricId },
        update: {}, // do nothing
      });
    }
  }

  // 8️⃣ Fetch the updated product with all relations
  const finalProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      category: true,
      collection: true,
      ProductFabric: { include: { fabric: true } },
    },
  });

  return formatProductResponse(finalProduct!);
};

// Delete Product
const deleteProduct = async (id: string) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      Review: true,
      wishlist: true,
      comboVariants: true,
    },
  });

  if (!existingProduct) {
    throw new AppError(404, PRODUCT_ERROR_MESSAGES.NOT_FOUND);
  }

  const hasActiveOrders = await prisma.order.findFirst({
    where: {
      productIds: { has: id },
      status: { not: 'CANCEL' },
    },
  });

  if (hasActiveOrders && existingProduct.published) {
    throw new AppError(400, PRODUCT_ERROR_MESSAGES.PRODUCT_PUBLISHED_CANNOT_DELETE);
  }

  // Delete related data
  await prisma.$transaction(async (tx) => {
    // Delete wishlist items
    await tx.wishlist.deleteMany({ where: { productId: id } });

    // Delete combo variants
    await tx.comboVariant.deleteMany({ where: { productId: id } });

    // Delete reviews
    await tx.review.deleteMany({ where: { productId: id } });

    // Delete stock logs
    await tx.stockLog.deleteMany({ where: { productId: id } });

    // Delete variants (this will cascade delete their stock logs and discounts)
    await tx.productVariant.deleteMany({ where: { productId: id } });

    // Delete discounts
    await tx.discount.deleteMany({ where: { productId: id } });

    // Delete fabric relations
    await tx.productFabric.deleteMany({ where: { productId: id } });

    // Delete product
    await tx.product.delete({ where: { id } });
  });

  // Delete images from storage
  const allImages = [existingProduct.primaryImage, ...existingProduct.otherImages];
  await Promise.all(allImages.filter(Boolean).map(deleteFile));

  return { id };
};

// Get Trending Products
const getTrendingProducts = async (): Promise<ITrendingProduct[]> => {
  const threeMonthsAgo = subMonths(new Date(), 3);

  const recentOrders = await prisma.order.findMany({
    where: {
      orderTime: { gte: threeMonthsAgo },
      isPaid: true,
      status: { not: 'CANCEL' },
    },
    select: { cartItems: true },
  });

  const productSales: Record<string, number> = {};

  for (const order of recentOrders) {
    const cart = order.cartItems as Array<{ productId: string; quantity: number }>;
    for (const item of cart) {
      if (item?.productId) {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
      }
    }
  }

  const topProductIds = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, QUERY_DEFAULTS.TRENDING_LIMIT)
    .map(([productId]) => productId);

  const trendingProducts = await prisma.product.findMany({
    where: {
      id: { in: topProductIds },
      published: true,
    },
    include: productInclude,
  });

  return trendingProducts.map((product) => ({
    ...formatProductResponse(product),
    totalSold: productSales[product.id] || 0,
    trendingScore: Math.round((productSales[product.id] || 0) * 1.5),
  }));
};

// Get Navbar Products
const getNavbarProducts = async () => {
  const threeMonthsAgo = subMonths(new Date(), 3);

  const recentOrders = await prisma.order.findMany({
    where: {
      orderTime: { gte: threeMonthsAgo },
      isPaid: true,
      status: { not: 'CANCEL' },
    },
    select: { cartItems: true },
  });

  const productSales: Record<string, number> = {};

  for (const order of recentOrders) {
    const cart = order.cartItems as Array<{ productId: string; quantity: number }>;
    for (const item of cart) {
      if (item?.productId) {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
      }
    }
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: Object.keys(productSales) },
      published: true,
    },
    include: { category: true },
  });

  const categoryWise: Record<string, { id: string; name: string; sold: number }[]> = {};
  const overallList: Array<{ id: string; name: string; totalSold: number }> = [];

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

  const publishedCategories = await prisma.category.findMany({
    where: { published: true },
  });

  const trendingByCategory: Record<string, { id: string; name: string }[]> = {};

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
};

// Get Featured Products
const getFeaturedProducts = async (): Promise<IProductResponse[]> => {
  const products = await prisma.product.findMany({
    where: {
      published: true,
      salesCount: { gte: 10 },
    },
    include: productInclude,
    orderBy: [
      { salesCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 12,
  });

  return products.map(formatProductResponse);
};

// Get New Arrivals
const getNewArrivals = async (): Promise<IProductResponse[]> => {
  const cutoffDate = subDays(new Date(), QUERY_DEFAULTS.NEW_ARRIVALS_DAYS);

  const products = await prisma.product.findMany({
    where: {
      published: true,
      createdAt: { gte: cutoffDate },
    },
    include: productInclude,
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  return products.map(formatProductResponse);
};

// Get Products by Category
const getProductsByCategory = async (categoryId: string, query: IProductQuery) => {
  const categoryQuery = { ...query, category: categoryId };
  const queryBuilder = new QueryBuilder(categoryQuery, prisma.product);

  let results = await queryBuilder
    .filter(productFilterFields)
    .search(productSearchFields)
    .nestedFilter(productNestedFilters)
    .sort()
    .paginate()
    .include(productInclude)
    .fields()
    .filterByRange(productRangeFilter)
    .rawFilter({ published: true, categoryId })
    .execute();

  const meta = await queryBuilder.countTotal();

  // Apply custom sorting
  results = applySorting(results, query.sortBy);

  return {
    data: results.map(formatProductResponse),
    meta,
  };
};

// Get Related Products
const getRelatedProducts = async (productId: string): Promise<IRelatedProductsResponse> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true, brand: true, gender: true, collectionId: true },
  });

  if (!product) {
    throw new AppError(404, PRODUCT_ERROR_MESSAGES.NOT_FOUND);
  }

  const [sameBrand, sameCategory, sameGender, sameCollection] = await Promise.all([
    // Same brand products
    prisma.product.findMany({
      where: {
        brand: product.brand,
        id: { not: productId },
        published: true,
      },
      include: productInclude,
      take: 4,
      orderBy: { salesCount: 'desc' },
    }),

    // Same category products
    prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
        published: true,
      },
      include: productInclude,
      take: 4,
      orderBy: { salesCount: 'desc' },
    }),

    // Same gender
    prisma.product.findMany({
      where: {
        gender: product.gender,
        id: { not: productId },
        published: true,
      },
      include: productInclude,
      take: 4,
      orderBy: { salesCount: 'desc' },
    }),

    // Same collection
    product.collectionId
      ? prisma.product.findMany({
        where: {
          collectionId: product.collectionId,
          id: { not: productId },
          published: true,
        },
        include: productInclude,
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
};

// Search Products
const searchProducts = async (query: IProductQuery): Promise<IProductSearchResult> => {
  const result = await getAllProducts(query);

  // Get available filters
  const [brands, categories, collections, priceRange, genders, fitTypes] = await Promise.all([
    prisma.product.findMany({
      where: { published: true, brand: { not: null } },
      select: { brand: true },
      distinct: ['brand'],
    }),
    prisma.category.findMany({
      where: { published: true },
      select: { id: true, categoryName: true },
    }),
    prisma.collection.findMany({
      where: { published: true },
      select: { id: true, collectionName: true },
    }),
    prisma.productVariant.aggregate({
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.product.findMany({
      where: { published: true, gender: { not: null } },
      select: { gender: true },
      distinct: ['gender'],
    }),
    prisma.product.findMany({
      where: { published: true, fitType: { not: null } },
      select: { fitType: true },
      distinct: ['fitType'],
    }),
  ]);

  return {
    ...result,
    filters: {
      brands: brands.map(b => b.brand!).filter(Boolean),
      categories: categories.map(c => ({ id: c.id, name: c.categoryName })),
      collections: collections.map(c => ({ id: c.id, name: c.collectionName })),
      priceRange: {
        min: priceRange._min.price || 0,
        max: priceRange._max.price || 0,
      },
      genders: genders.map(g => g.gender!).filter(Boolean),
      fitTypes: fitTypes.map(f => f.fitType!).filter(Boolean),
    },
    meta: {
      ...result.meta,
      totalPages: result.meta.totalPage,
    },
  };
};

// Get Product Variants
const getProductVariants = async (productId: string) => {
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    // include: {
    //   color: true,
    // },
    orderBy: [{ size: 'asc' }, { price: 'asc' }],
  });

  if (!variants.length) {
    throw new AppError(404, 'No variants found for this product');
  }

  return variants;
};

// Update Variant Stock
const updateVariantStock = async (variantId: string, addedStock: number, reason?: string) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant) {
    throw new AppError(404, PRODUCT_ERROR_MESSAGES.VARIANT_NOT_FOUND);
  }

  const newStock = variant.stock + addedStock;

  // Update variant stock and create stock log
  await prisma.$transaction(async (tx) => {
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock },
    });

    await tx.stockLog.create({
      data: {
        productId: variant.productId,
        variantId,
        change: addedStock,
        reason: reason || 'Stock updated',
      },
    });
  });

  const updatedVariant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    // include: { color: true },
  });

  return updatedVariant;
};

// Get Product Analytics
const getProductAnalytics = async (): Promise<IProductAnalytics> => {
  const [
    totalProducts,
    publishedProducts,
    totalVariants,
    priceStats,
    categoryStats,
    brandStats,
    lowStockVariants,
    outOfStockVariants,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { published: true } }),
    prisma.productVariant.count(),
    prisma.productVariant.aggregate({
      _avg: { price: true },
      _sum: { price: true },
    }),
    prisma.product.groupBy({
      by: ['categoryId'],
      _count: { _all: true },
      where: { published: true },
    }),
    prisma.product.groupBy({
      by: ['brand'],
      _count: { _all: true },
      where: { published: true, brand: { not: null } },
    }),
    prisma.productVariant.count({
      where: { stock: { lte: QUERY_DEFAULTS.LOW_STOCK_THRESHOLD } },
    }),
    prisma.productVariant.count({
      where: { stock: 0 },
    }),
  ]);

  // Get category names
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryStats.map(c => c.categoryId) } },
  });

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.categoryName;
    return acc;
  }, {} as Record<string, string>);

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
};

// Get Low Stock Products
const getLowStockProducts = async (threshold: number = QUERY_DEFAULTS.LOW_STOCK_THRESHOLD) => {
  const products = await prisma.product.findMany({
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
};

// Get Bestsellers
const getBestsellers = async (): Promise<ITrendingProduct[]> => {
  const products = await prisma.product.findMany({
    where: { published: true },
    include: productInclude,
    orderBy: { salesCount: 'desc' },
    take: 20,
  });

  return products.map((product, index) => ({
    ...formatProductResponse(product),
    totalSold: product.salesCount,
    trendingScore: 100 - index,
  }));
};

// Get Stock Logs
const getStockLogs = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError(404, PRODUCT_ERROR_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const logs = await prisma.stockLog.findMany({
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
};

// Get Variant Stock Logs
const getVariantStockLogs = async (variantId: string) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new AppError(404, PRODUCT_ERROR_MESSAGES.VARIANT_NOT_FOUND);
  }

  const logs = await prisma.stockLog.findMany({
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
};

// Bulk Update Variant Stocks
const bulkUpdateVariantStocks = async (
  updates: Array<{ variantId: string; addedStock: number; reason?: string }>
) => {
  const results = await Promise.all(
    updates.map(async (update) => {
      try {
        return await updateVariantStock(update.variantId, update.addedStock, update.reason);
      } catch (error) {
        return { variantId: update.variantId, error: (error as Error).message };
      }
    })
  );

  return results;
};

// Get Products by Collection
const getProductsByCollection = async (collectionId: string, query: IProductQuery) => {
  const collectionQuery = { ...query, collection: collectionId };
  const queryBuilder = new QueryBuilder(collectionQuery, prisma.product);

  let results = await queryBuilder
    .filter(productFilterFields)
    .search(productSearchFields)
    .nestedFilter(productNestedFilters)
    .sort()
    .paginate()
    .include(productInclude)
    .fields()
    .filterByRange(productRangeFilter)
    .rawFilter({ published: true, collectionId })
    .execute();

  const meta = await queryBuilder.countTotal();

  // Apply custom sorting
  results = applySorting(results, query.sortBy);

  return {
    data: results.map(formatProductResponse),
    meta,
  };
};

// Get Out of Stock Products
const getOutOfStockProducts = async () => {
  const products = await prisma.product.findMany({
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
};

// Helper Functions
const formatProductResponse = (product: any): IProductResponse => {
  const variants = product.variants || [];
  const prices = variants.map((v: any) => v.price);
  const reviews = product.Review || [];

  // Calculate total stock from all variants
  const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);

  // Calculate average rating and review count
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviewCount
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
    fabricIds: product.ProductFabric?.map((pf: any) => pf.fabric.id) || [],
    fabrics: product.ProductFabric?.map((pf: any) => pf.fabric) || [],

    supplier: product.supplier,

    variants: variants.map((v: any) => ({
      ...v,
      color: v.color,
    })),

    // Computed fields
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    totalStock,
    inStock: totalStock > 0,

    // Available sizes and colors
    availableSizes: [...new Set(variants.map((v: any) => v.size))] as ClothingSize[],
    availableColors: [...new Set(variants.map((v: any) => v.color))] as string[],
    // availableColors: Array.from(
    //   new Map(variants.map((v: any) => [v.color]))
    // ) as IColor[],

    // Review fields
    reviews: reviews.map((r: any) => ({
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

const applySorting = (results: any[], sortBy?: string) => {
  if (sortBy === 'price_asc') {
    return results.sort((a, b) => {
      const minA = Math.min(...a.variants.map((v: any) => v.price));
      const minB = Math.min(...b.variants.map((v: any) => v.price));
      return minA - minB;
    });
  } else if (sortBy === 'price_desc') {
    return results.sort((a, b) => {
      const minA = Math.min(...a.variants.map((v: any) => v.price));
      const minB = Math.min(...b.variants.map((v: any) => v.price));
      return minB - minA;
    });
  } else if (sortBy === 'rating_asc') {
    return results.sort((a, b) => {
      const avgA =
        a.Review && a.Review.length > 0
          ? a.Review.reduce((sum: number, r: any) => sum + r.rating, 0) / a.Review.length
          : 0;
      const avgB =
        b.Review && b.Review.length > 0
          ? b.Review.reduce((sum: number, r: any) => sum + r.rating, 0) / b.Review.length
          : 0;
      return avgA - avgB;
    });
  } else if (sortBy === 'rating_desc') {
    return results.sort((a, b) => {
      const avgA =
        a.Review && a.Review.length > 0
          ? a.Review.reduce((sum: number, r: any) => sum + r.rating, 0) / a.Review.length
          : 0;
      const avgB =
        b.Review && b.Review.length > 0
          ? b.Review.reduce((sum: number, r: any) => sum + r.rating, 0) / b.Review.length
          : 0;
      return avgB - avgA;
    });
  } else if (sortBy === 'newest') {
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return results;
};

export const ProductServices = {
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