import { Router } from 'express';
import auth from '../../middlewares/auth';
import { CollectionController } from './collection.controller';
import { upload } from '../../utils/sendImageToCloudinary';

const router = Router();

router.post(
  '/create-collection',
  auth('ADMIN','SUPER_ADMIN'),
  upload.single('image'),
  CollectionController.createCollection,
);

router.get('/get-collections', CollectionController.getAllCollections);
router.get(
  '/get-all-collections',
  auth('ADMIN','SUPER_ADMIN'),
  CollectionController.getAllCollectionsAdmin,
);
router.get('/get-collection/:id', CollectionController.getCollection);

router.patch(
  '/update-collection/:id',
  auth('ADMIN','SUPER_ADMIN'),
  upload.single('image'),
  CollectionController.updateCollection,
);

router.delete(
  '/delete-collection/:id',
  auth('ADMIN','SUPER_ADMIN'),
  CollectionController.deleteCollection,
);

export const CollectionRoutes = router;
