// src/app/modules/sales/sales.service.ts
import { PrismaQueryBuilder } from '../../builder/QueryBuilder';
import { prisma } from '../../../prisma/client';
import {
  OrderSource,
  OrderStatus,
  Prisma,
  SaleType,
} from '@prisma/client';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { generateInvoice } from '../../helpers/generateInvoice';

// Treat "sales" as orders with a non-WEBSITE orderSource
const MANUAL_SOURCES: OrderSource[] = [
  OrderSource.SHOWROOM,
  OrderSource.WHOLESALE,
  OrderSource.MANUAL,
];

// -------------------------------
// Create a manual sale (Order) - UPDATED FOR APPAREL
// -------------------------------

const createSale = async (
  payload: {
    customerId?: string | null;
    salesmanId?: string | null;
    saleType?: SaleType;
    cartItemIds: string[];
    amount: number;
    isPaid?: boolean;
    method?: string;
    orderSource?: OrderSource;
    customerInfo?: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
    } | null;
  },
  userId?: string | null
) => {
  const {
    customerId,
    salesmanId,
    saleType,
    cartItemIds,
    amount,
    isPaid,
    method,
    orderSource,
    customerInfo,
  } = payload;

  console.log(payload, userId);

  // 1️⃣ Fetch valid cart items with variant details
  const cartItems = await prisma.cartItem.findMany({
    where: { id: { in: cartItemIds }, status: 'IN_CART' },
    include: {
      product: true,
      variant: true,
    },
  });

  if (cartItems.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No valid cart items found.');
  }

  // 2️⃣ Validate stock availability for each variant
  for (const item of cartItems) {
    if (!item.variant) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Variant not found for cart item ${item.id}`
      );
    }

    if (!item.variantId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Variant ID missing for product ${item.product.name}`
      );
    }

    if (item.variant.stock < item.quantity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Insufficient stock for ${item.product.name} - ${item.variant.color} (Size: ${item.variant.size}). Available: ${item.variant.stock}, Requested: ${item.quantity}`
      );
    }
  }

  // 3️⃣ Generate invoice
  const invoice = await generateInvoice();

  // 4️⃣ Transaction: create order + update stocks + link cart items
  const newOrder = await prisma.$transaction(
    async (tx) => {
      const created = await tx.order.create({
        data: {
          invoice,
          customerId: customerId || null,
          salesmanId: userId || null,
          saleType: saleType || SaleType.SINGLE,
          amount: Number(amount),
          isPaid: isPaid || false,
          method: method || null,
          orderSource: orderSource || OrderSource.MANUAL,
          name: customerInfo?.name || null,
          phone: customerInfo?.phone || null,
          email: customerInfo?.email || null,
          address: customerInfo?.address || null,
          productIds: cartItems.map((ci) => ci.productId),
          cartItems: cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId!,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      });

      // Update cart items status → ORDERED
      await tx.cartItem.updateMany({
        where: { id: { in: cartItemIds } },
        data: { orderId: created.id, status: 'ORDERED' },
      });

      // Update stock and create logs for each variant
      for (const item of cartItems) {
        const variantId = item.variantId!;
        const productId = item.productId;
        const qty = item.quantity;

        // ✅ Update VARIANT stock (apparel tracks stock per variant)
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stock: { decrement: qty },
          },
        });

        // ✅ Update Product salesCount
        await tx.product.update({
          where: { id: productId },
          data: {
            salesCount: { increment: qty },
          },
        });

        // ✅ Log stock change at variant level
        await tx.stockLog.create({
          data: {
            productId,
            variantId,
            change: -qty, // Negative for sale
            reason: 'SALE',
            notes: `Manual Sale ${created.invoice} - Sold ${qty} unit(s) by ${orderSource}`,
          },
        });
      }

      return created;
    },
    { timeout: 20000 } // ⏳ 20 seconds to ensure completion
  );

  // 5️⃣ Fetch full order with relations
  const fullOrder = await prisma.order.findUnique({
    where: { id: newOrder.id },
    include: {
      customer: { select: { id: true, name: true, imageUrl: true } },
      salesman: { select: { id: true, name: true, imageUrl: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });

  if (!fullOrder)
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found after creation.');

  const customerData = fullOrder.customer || {
    id: null,
    name: fullOrder.name || null,
    phone: fullOrder.phone || null,
    email: fullOrder.email || null,
    address: fullOrder.address || null,
    imageUrl: null,
  };

  return { ...fullOrder, customer: customerData };
};

// -------------------------------
// Admin: get all manual sales
// -------------------------------
const getAllSales = async (queryParams: Record<string, unknown>) => {
  const { searchTerm, status, source, ...rest } = queryParams as {
    searchTerm?: string;
    status?: OrderStatus | string;
    source?: OrderSource | string;
  };

  const queryBuilder = new PrismaQueryBuilder(rest);
  const prismaQuery = queryBuilder
    .buildWhere()
    .buildSort()
    .buildPagination()
    .getQuery();

  const where: Prisma.OrderWhereInput = {
    ...prismaQuery.where,
    // restrict to manual sources unless explicitly overridden with ?source=WEBSITE
    ...(source
      ? { orderSource: source as OrderSource }
      : { orderSource: { in: MANUAL_SOURCES } }),
  };

  if (status) where.status = status as OrderStatus;

  if (searchTerm && searchTerm.trim()) {
    const s = searchTerm.trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
      { address: { contains: s, mode: 'insensitive' } },
      {
        salesman: {
          OR: [
            { name: { contains: s, mode: 'insensitive' } },
            { email: { contains: s, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  const data = await prisma.order.findMany({
    ...prismaQuery,
    where,
    include: {
      salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });

  const meta = await queryBuilder.getPaginationMeta({
    count: (args: any) =>
      prisma.order.count({ where: { ...where, ...(args?.where ?? {}) } }),
  });

  return { meta, data };
};

// -------------------------------
// Salesman: my sales
// -------------------------------
const getMySales = async (salesmanId: string, queryParams: Record<string, unknown>) => {
  const { searchTerm, status, source, ...rest } = queryParams as {
    searchTerm?: string;
    status?: OrderStatus | string;
    source?: OrderSource | string;
  };

  const queryBuilder = new PrismaQueryBuilder(rest);
  const prismaQuery = queryBuilder
    .buildWhere()
    .buildSort()
    .buildPagination()
    .getQuery();

  const where: Prisma.OrderWhereInput = {
    ...prismaQuery.where,
    salesmanId,
    ...(source
      ? { orderSource: source as OrderSource }
      : { orderSource: { in: MANUAL_SOURCES } }),
  };

  if (status) where.status = status as OrderStatus;

  if (searchTerm && searchTerm.trim()) {
    const s = searchTerm.trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
      { address: { contains: s, mode: 'insensitive' } },
    ];
  }

  const data = await prisma.order.findMany({
    ...prismaQuery,
    where,
    include: {
      salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });

  const [count, sum] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { amount: true } }),
  ]);

  const meta = await queryBuilder.getPaginationMeta({
    count: (args: any) => prisma.order.count({ where: { ...where, ...(args?.where ?? {}) } }),
  });

  return {
    meta,
    totalSales: count,
    totalAmount: sum._sum.amount ?? 0,
    data,
  };
};

// -------------------------------
// Admin: sales by customer phone
// -------------------------------
const getSalesByCustomer = async (phone: string, queryParams: Record<string, unknown>) => {
  const queryBuilder = new PrismaQueryBuilder(queryParams);
  const prismaQuery = queryBuilder.buildSort().buildPagination().getQuery();

  const where: Prisma.OrderWhereInput = {
    phone: { contains: phone, mode: 'insensitive' },
    orderSource: { in: MANUAL_SOURCES },
  };

  const data = await prisma.order.findMany({
    ...prismaQuery,
    where,
    include: {
      salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });

  const meta = await queryBuilder.getPaginationMeta({
    count: (args: any) => prisma.order.count({ where: { ...where, ...(args?.where ?? {}) } }),
  });

  return { meta, data };
};

// -------------------------------
// Update sale status / payment
// -------------------------------
const updateSaleStatus = async (
  id: string,
  payload: Partial<Pick<Prisma.OrderUpdateInput, 'status' | 'isPaid'>>
) => {
  // Only allow valid enum if provided
  const data: Prisma.OrderUpdateInput = {};
  if (payload.status) data.status = payload.status as OrderStatus;
  if (typeof payload.isPaid === 'boolean') data.isPaid = payload.isPaid;

  const updated = await prisma.order.update({
    where: { id },
    data,
    include: {
      salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });

  return updated;
};

// -------------------------------
// Cancel Manual Sale and Restore Stock
// -------------------------------
const cancelSale = async (id: string) => {
  const sale = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: {
          variant: true,
        },
      },
    },
  });

  if (!sale) {
    throw new AppError(httpStatus.NOT_FOUND, 'Sale not found');
  }

  if (!MANUAL_SOURCES.includes(sale.orderSource)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This is not a manual sale. Use order cancellation instead.'
    );
  }

  if (sale.status === 'CANCEL') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Sale is already cancelled');
  }

  if (sale.status === 'DELIVERED' || sale.status === 'COMPLETED') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot cancel delivered or completed sales. Please process as return.'
    );
  }

  // Restore stock in transaction
  await prisma.$transaction(async (tx) => {
    // Update sale status
    await tx.order.update({
      where: { id },
      data: { status: 'CANCEL' },
    });

    // Restore stock for each item
    for (const item of sale.orderItems) {
      if (item.variantId) {
        // Restore variant stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { increment: item.quantity },
          },
        });

        // Update product salesCount
        await tx.product.update({
          where: { id: item.productId },
          data: {
            salesCount: { decrement: item.quantity },
          },
        });

        // Log stock restoration
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            change: item.quantity, // Positive for restoration
            reason: 'CANCEL',
            notes: `Manual Sale ${sale.invoice} cancelled - Stock restored`,
          },
        });
      }
    }
  });

  return await prisma.order.findUnique({
    where: { id },
    include: {
      salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });
};

// -------------------------------
// Admin: sales analytics
// -------------------------------
const getSalesAnalytics = async (queryParams: Record<string, unknown>) => {
  const { startDate, endDate, salesmanId } = queryParams as {
    startDate?: string;
    endDate?: string;
    salesmanId?: string;
  };

  const where: Prisma.OrderWhereInput = {
    orderSource: { in: MANUAL_SOURCES },
  };

  if (salesmanId) where.salesmanId = salesmanId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as any).gte = new Date(startDate);
    if (endDate) (where.createdAt as any).lte = new Date(endDate);
  }

  const [count, sum, byStatus, bySource, topProducts] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { amount: true } }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { amount: true },
      where,
    }),
    prisma.order.groupBy({
      by: ['orderSource'],
      _count: { _all: true },
      _sum: { amount: true },
      where,
    }),
    // Get top selling products in manual sales
    prisma.cartItem.groupBy({
      by: ['productId'],
      where: {
        order: where,
        status: 'ORDERED',
      },
      _sum: { quantity: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),
  ]);

  // Fetch product details for top products
  const productIds = topProducts.map((tp) => tp.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, primaryImage: true },
  });

  const topProductsWithDetails = topProducts.map((tp) => ({
    product: products.find((p) => p.id === tp.productId),
    totalQuantity: tp._sum.quantity ?? 0,
    orderCount: tp._count._all,
  }));

  return {
    totalSales: count,
    totalAmount: sum._sum.amount ?? 0,
    byStatus,
    bySource,
    topProducts: topProductsWithDetails,
  };
};

// -------------------------------
// Get salesman performance
// -------------------------------
const getSalesmanPerformance = async (queryParams: Record<string, unknown>) => {
  const { startDate, endDate } = queryParams as {
    startDate?: string;
    endDate?: string;
  };

  const where: Prisma.OrderWhereInput = {
    orderSource: { in: MANUAL_SOURCES },
    salesmanId: { not: null },
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as any).gte = new Date(startDate);
    if (endDate) (where.createdAt as any).lte = new Date(endDate);
  }

  const salesBySalesman = await prisma.order.groupBy({
    by: ['salesmanId'],
    where,
    _count: { _all: true },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  // Fetch salesman details
  const salesmanIds = salesBySalesman
    .map((s) => s.salesmanId)
    .filter((id): id is string => id !== null);

  const salesmen = await prisma.user.findMany({
    where: { id: { in: salesmanIds } },
    select: { id: true, name: true, email: true, imageUrl: true },
  });

  const performance = salesBySalesman.map((s) => ({
    salesman: salesmen.find((sm) => sm.id === s.salesmanId),
    totalSales: s._count._all,
    totalAmount: s._sum.amount ?? 0,
    averageSaleAmount: s._sum.amount && s._count._all
      ? Math.round((s._sum.amount / s._count._all) * 100) / 100
      : 0,
  }));

  return performance;
};

// (Optional) Single sale fetch
const getSaleById = async (id: string) => {
  const sale = await prisma.order.findUnique({
    where: { id },
    include: {
      salesman: { select: { id: true, name: true, imageUrl: true, email: true } },
      customer: { select: { id: true, name: true, imageUrl: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });

  if (!sale) {
    throw new AppError(httpStatus.NOT_FOUND, 'Sale not found');
  }

  // Normalize customer data
  const customerData = sale.customer || {
    id: null,
    name: sale.name || null,
    phone: sale.phone || null,
    email: sale.email || null,
    address: sale.address || null,
    imageUrl: null,
  };

  return { ...sale, customer: customerData };
};

export const SaleServices = {
  // creation
  createSale,
  // lists
  getAllSales,
  getMySales,
  getSalesByCustomer,
  // update
  updateSaleStatus,
  cancelSale,
  // analytics
  getSalesAnalytics,
  getSalesmanPerformance,
  // optional
  getSaleById,
};