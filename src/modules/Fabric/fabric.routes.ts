import { Router } from 'express';
import { FabricController } from './fabric.controller';
import auth from '../../middlewares/auth';

const router = Router();

router.get('/get-all-Fabrics', FabricController.getAllFabrics);

router.post(
  '/create-fabric',
  auth('ADMIN','SUPER_ADMIN'),
  FabricController.createFabric,
);

router.get('/get-fabric/:id', auth('ADMIN','SUPER_ADMIN'), FabricController.getFabric);

router.patch(
  '/update-fabric/:id',
  auth('ADMIN','SUPER_ADMIN'),
  FabricController.updateFabric,
);

router.delete(
  '/delete-fabric/:id',
  auth('ADMIN','SUPER_ADMIN'),
  FabricController.deleteFabric,
);

export const FabricRoutes = router;
