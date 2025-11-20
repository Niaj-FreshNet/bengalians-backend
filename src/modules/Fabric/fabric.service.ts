import { PrismaQueryBuilder } from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { prisma } from '../../../prisma/client';
import { IFabric } from './fabric.interface';

const createFabric = async (payload: IFabric) => {
  const isFabricExist = await prisma.fabric.findFirst({
    where: {
      fabricName: payload.fabricName,
    },
  });

  if (isFabricExist) {
    throw new AppError(403, 'Fabric already exists');
  }
  const result = await prisma.fabric.create({
    data: {
      fabricName: payload.fabricName,
      imageUrl: payload.imageUrl,
    },
  });
  return result;
};

const getAllFabrics = async (queryParams: Record<string, unknown>) => {
  const queryBuilder = new PrismaQueryBuilder(queryParams, ['fabricName'])
    .buildWhere()
    .buildSort()
    .buildPagination()
    .buildSelect();

  const materials = await prisma.fabric.findMany(queryBuilder.getQuery());

  const meta = await queryBuilder.getPaginationMeta(prisma.fabric);

  return {
    data: materials,
    meta,
  };
};

const getFabric = async (id: string) => {
  const result = await prisma.fabric.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateFabric = async (id: string, payload: IFabric) => {
  const isFabricExist = await prisma.fabric.findUnique({
    where: {
      id,
    },
  });
  if (!isFabricExist) {
    throw new AppError(400, 'Fabric not found');
  }

  const result = await prisma.fabric.update({
    where: {
      id,
    },
    data: {
      fabricName: payload.fabricName,
    },
  });
  return result;
};

const deleteFabric = async (id: string) => {
  const isFabricExist = await prisma.fabric.findUnique({
    where: {
      id,
    },
  });
  if (!isFabricExist) {
    throw new AppError(400, 'Fabric not found');
  }

  const result = await prisma.fabric.delete({
    where: {
      id,
    },
  });
  return result;
};

export const FabricServices = {
  createFabric,
  getAllFabrics,
  getFabric,
  updateFabric,
  deleteFabric,
};
