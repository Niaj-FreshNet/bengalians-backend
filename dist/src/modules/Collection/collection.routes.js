"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const collection_controller_1 = require("./collection.controller");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const router = (0, express_1.Router)();
router.post('/create-collection', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), sendImageToCloudinary_1.upload.single('image'), collection_controller_1.CollectionController.createCollection);
router.get('/get-collections', collection_controller_1.CollectionController.getAllCollections);
router.get('/get-all-collections', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), collection_controller_1.CollectionController.getAllCollectionsAdmin);
router.get('/get-collection/:id', collection_controller_1.CollectionController.getCollection);
router.patch('/update-collection/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), sendImageToCloudinary_1.upload.single('image'), collection_controller_1.CollectionController.updateCollection);
router.delete('/delete-collection/:id', (0, auth_1.default)('ADMIN', 'SUPER_ADMIN'), collection_controller_1.CollectionController.deleteCollection);
exports.CollectionRoutes = router;
