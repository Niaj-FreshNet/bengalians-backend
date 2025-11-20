import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { FabricServices } from './fabric.service';

const createFabric = catchAsync(async (req, res) => {
  const result = await FabricServices.createFabric(req.body);
  const isok = result ? true : false;
  sendResponse(res, {
    statusCode: isok ? 200 : 400,
    success: isok ? true : false,
    message: isok
      ? 'Fabric Created Successfully'
      : 'Fabric Creation Failed',
    data: isok ? result : [],
  });
});

export const getAllFabrics = catchAsync(async (req, res) => {
  const result = await FabricServices.getAllFabrics(req.query);
  const isok = result ? true : false;
  sendResponse(res, {
    statusCode: isok ? 200 : 400,
    success: isok ? true : false,
    message: isok
      ? 'Fabrics Fetched Successfully'
      : 'Fabrics Fetching Failed',
    data: isok ? result : [],
  });
});

const getFabric = catchAsync(async (req, res) => {
  const result = await FabricServices.getFabric(req.params.id);
  const isok = result ? true : false;
  sendResponse(res, {
    statusCode: isok ? 200 : 400,
    success: isok ? true : false,
    message: isok
      ? 'Fabric Fetched Successfully'
      : 'Fabric Fetching Failed',
    data: isok ? result : [],
  });
});

const updateFabric = catchAsync(async (req, res) => {
  const result = await FabricServices.updateFabric(req.params.id, req.body);
  const isok = result ? true : false;
  sendResponse(res, {
    statusCode: isok ? 200 : 400,
    success: isok ? true : false,
    message: isok
      ? 'Fabric Updated Successfully'
      : 'Fabric Updation Failed',
    data: isok ? result : [],
  });
});

const deleteFabric = catchAsync(async (req, res) => {
  const result = await FabricServices.deleteFabric(req.params.id);
  const isok = result ? true : false;
  sendResponse(res, {
    statusCode: isok ? 200 : 400,
    success: isok ? true : false,
    message: isok
      ? 'Fabric Deleted Successfully'
      : 'Fabric Deletion Failed',
    data: isok ? result : [],
  });
});

export const FabricController = {
  createFabric,
  getAllFabrics,
  getFabric,
  updateFabric,
  deleteFabric,
};
