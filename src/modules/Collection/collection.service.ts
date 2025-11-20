import AppError from '../../errors/AppError';
import { prisma } from '../../../prisma/client';
import { ICollection } from './collection.interface';
import { PrismaQueryBuilder } from '../../builder/QueryBuilder';
import { deleteFile } from '../../helpers/fileDelete';

const createCollection = async (payload: ICollection) => {
  const isExist = await prisma.collection.findFirst({
    where: {
      collectionName: payload.collectionName.toUpperCase(),
    },
  });

  if (isExist) {
    throw new AppError(400, 'Collection already exists');
  }
  const result = await prisma.collection.create({
    data: {
      collectionName: payload.collectionName.toUpperCase(),
      published: payload.published,
      imageUrl: payload.imageUrl,
    },
  });

  return result;
};

const getAllCollections = async (queryParams: Record<string, unknown>) => {
  const queryBuilder = new PrismaQueryBuilder(queryParams, ['collectionName']);
  queryParams.published = true;
  const prismaQuery = queryBuilder
    .buildWhere()
    .buildSort()
    .buildPagination()
    .buildSelect()
    .getQuery();
  const collections = await prisma.collection.findMany({
    ...prismaQuery,
  });

  const meta = await queryBuilder.getPaginationMeta(prisma.collection);

  return {
    meta,
    data: collections,
  };
};

const getAllCollectionsAdmin = async (queryParams: Record<string, unknown>) => {
  const queryBuilder = new PrismaQueryBuilder(queryParams, ['collectionName']);
  const prismaQuery = queryBuilder
    .buildWhere()
    .buildSort()
    .buildPagination()
    .buildSelect()
    .getQuery();
  const collections = await prisma.collection.findMany({
    ...prismaQuery,
  });

  const meta = await queryBuilder.getPaginationMeta(prisma.collection);

  return {
    meta,
    data: collections,
  };
};

const getCollection = async (id: string) => {
  const result = await prisma.collection.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateCollection = async (id: string, payload: Partial<ICollection>) => {
  const isExist = await prisma.collection.findUnique({
    where: {
      id,
    },
  });

  if (!isExist) {
    throw new AppError(400, 'Collection not found');
  }

  if (payload.sizes && typeof payload.sizes === 'string') {
    payload.sizes = JSON.parse(payload.sizes);
  }

  const imageUrl: string | undefined = payload.imageUrl;

  const result = await prisma.collection.update({
    where: {
      id,
    },
    data: {
      collectionName: payload?.collectionName?.toUpperCase(),
      imageUrl: imageUrl,
      published: payload.published,
    },
  });

  return result;
};

const deleteCollection = async (id: string) => {
  const isExist = await prisma.collection.findUnique({
    where: { id },
    include: { Product: true },
  });

  if (!isExist) {
    throw new AppError(404, 'Collection not found');
  }

  if (isExist.Product.length > 0) {
    throw new AppError(
      400,
      'Cannot delete collection that has products linked to it. Please remove or reassign those products first.'
    );
  }

  if (isExist.imageUrl) {
    await deleteFile(isExist.imageUrl);
  }

  const result = await prisma.collection.delete({
    where: {
      id,
    },
  });
  return result;
};

export const CollectionServices = {
  createCollection,
  getAllCollections,
  getAllCollectionsAdmin,
  getCollection,
  updateCollection,
  deleteCollection,
};
