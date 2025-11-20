import { Prisma } from '@prisma/client';
import { PrismaQueryBuilder } from '../../builder/QueryBuilder';
import { prisma } from '../../../prisma/client';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';

const getAllProducts = async (queryParams: Record<string, unknown>) => {
  const { searchTerm, ...rest } = queryParams as {
    searchTerm?: string;
  };

  const queryBuilder = new PrismaQueryBuilder(rest);
  const prismaQuery = queryBuilder
    .buildWhere()
    .buildSort()
    .buildPagination()
    .getQuery();

  const where: Prisma.ProductWhereInput = {
    ...prismaQuery.where,
  };

  if (searchTerm && searchTerm.trim()) {
    const s = searchTerm.trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
    ];
  }

  const data = await prisma.product.findMany({
    ...prismaQuery,
    where,
    include: {
      variants: {
        select: { id: true, sku: true, size: true, price: true, unit: true },
      },
      category: { select: { unit: true } },
    },
  });

  const meta = await queryBuilder.getPaginationMeta({
    count: (args: any) =>
      prisma.product.count({ where: { ...where, ...(args?.where ?? {}) } }),
  });

  return {
    meta,
    data: data.map((product) => ({
      ...product,
    })),
  };
};

const getLowStockProducts = async (queryParams: Record<string, unknown>) => {
  const { searchTerm, threshold = 10, ...rest } = queryParams as {
    searchTerm?: string;
    threshold?: number;
  };

  const queryBuilder = new PrismaQueryBuilder(rest);
  const prismaQuery = queryBuilder
    .buildWhere()
    .buildSort()
    .buildPagination()
    .getQuery();

  const where: Prisma.ProductWhereInput = {
    ...prismaQuery.where,
    stock: { lte: Number(threshold) },
  };

  if (searchTerm && searchTerm.trim()) {
    const s = searchTerm.trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
    ];
  }

  const data = await prisma.product.findMany({
    ...prismaQuery,
    where,
    include: {
      variants: {
        select: { id: true, sku: true, size: true, price: true, unit: true },
      },
      category: { select: { unit: true } },
    },
  });

  const meta = await queryBuilder.getPaginationMeta({
    count: (args: any) =>
      prisma.product.count({ where: { ...where, ...(args?.where ?? {}) } }),
  });

  return {
    meta,
    data: data.map((product) => ({
      ...product,
    })),
  };
};

const addStock = async (payload: {
  productId: string;
  variantId?: string;
  change: number;
  reason: string;
}) => {
  const { productId, variantId, change, reason } = payload;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });

  if (!product) throw new AppError(httpStatus.NOT_FOUND, 'Product not found');

  if (variantId) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) throw new AppError(httpStatus.NOT_FOUND, 'Variant not found');
  }

  const stockLog = await prisma.$transaction(async (tx) => {
    // Update product stock
    await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: change } },
    });

    // Create stock log
    const log = await tx.stockLog.create({
      data: {
        productId,
        variantId: variantId || '',
        change,
        reason,
        createdAt: new Date(),
      },
    });

    return log;
  });

  return stockLog;
};

const getStockLogs = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) throw new AppError(httpStatus.NOT_FOUND, 'Product not found');

  const logs = await prisma.stockLog.findMany({
    where: { productId },
    include: {
      product: { select: { name: true } },
      variant: { select: { size: true, color: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return logs;
};

export const StockServices = {
  getAllProducts,
  getLowStockProducts,
  addStock,
  getStockLogs,
};