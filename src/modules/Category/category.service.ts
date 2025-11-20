import AppError from '../../errors/AppError';
import { prisma } from '../../../prisma/client';
import { ICategory } from './category.interface';
import { PrismaQueryBuilder } from '../../builder/QueryBuilder';
import { deleteFile } from '../../helpers/fileDelete';

const createCategory = async (payload: ICategory) => {
  const isExist = await prisma.category.findFirst({
    where: {
      categoryName: payload.categoryName.toUpperCase(),
    },
  });

  if (isExist) {
    throw new AppError(400, 'Category already exists');
  }
  const result = await prisma.category.create({
    data: {
      categoryName: payload.categoryName.toUpperCase(),
      sizes: payload.sizes,
      published: payload.published,
      imageUrl: payload.imageUrl,
    },
  });

  return result;
};

const getAllCategories = async (queryParams: Record<string, unknown>) => {
  const queryBuilder = new PrismaQueryBuilder(queryParams, ['categoryName']);
  queryParams.published = true;
  const prismaQuery = queryBuilder
    .buildWhere()
    .buildSort()
    .buildPagination()
    .buildSelect()
    .getQuery();
  const categories = await prisma.category.findMany({
    ...prismaQuery,
  });

  const meta = await queryBuilder.getPaginationMeta(prisma.category);

  return {
    meta,
    data: categories,
  };
};

const getAllCategoriesAdmin = async (queryParams: Record<string, unknown>) => {
  const queryBuilder = new PrismaQueryBuilder(queryParams, ['categoryName']);
  const prismaQuery = queryBuilder
    .buildWhere()
    .buildSort()
    .buildPagination()
    .buildSelect()
    .getQuery();
  const categories = await prisma.category.findMany({
    ...prismaQuery,
  });

  const meta = await queryBuilder.getPaginationMeta(prisma.category);

  return {
    meta,
    data: categories,
  };
};

const getCategory = async (id: string) => {
  const result = await prisma.category.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
  const isExist = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!isExist) {
    throw new AppError(400, 'Category not found');
  }

  if (payload.sizes && typeof payload.sizes === 'string') {
    payload.sizes = JSON.parse(payload.sizes);
  }

  const imageUrl: string | undefined = payload.imageUrl;

  const result = await prisma.category.update({
    where: {
      id,
    },
    data: {
      categoryName: payload?.categoryName?.toUpperCase(),
      sizes: payload.sizes,
      imageUrl: imageUrl,
      published: payload.published,
    },
  });

  return result;
};

const deleteCategory = async (id: string) => {
  const isExist = await prisma.category.findUnique({
    where: { id },
    include: { Product: true },
  });

  if (!isExist) {
    throw new AppError(404, 'Category not found');
  }

  if (isExist.Product.length > 0) {
    throw new AppError(
      400,
      'Cannot delete category that has products linked to it. Please remove or reassign those products first.'
    );
  }

  if (isExist.imageUrl) {
    await deleteFile(isExist.imageUrl);
  }

  const result = await prisma.category.delete({
    where: {
      id,
    },
  });
  return result;
};

export const CategoryServices = {
  createCategory,
  getAllCategories,
  getAllCategoriesAdmin,
  getCategory,
  updateCategory,
  deleteCategory,
};
