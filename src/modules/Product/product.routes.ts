import { NextFunction, Request, Response, Router } from 'express';
import { ProductController } from './product.controller';
import auth from '../../middlewares/auth';
import { upload } from '../../helpers/fileUploader';
import validateRequest from '../../middlewares/validateRequest';
import { ProductValidation } from '../../validations/product.validation';
import { parseJsonFields } from '../../middlewares/parseJson';

const router = Router();

// Product CRUD Operations
router.post(
  '/create-product',
  // auth('ADMIN', 'SUPER_ADMIN'),
  upload.array('images', 10), // Max 10 images
  parseJsonFields,
  validateRequest(ProductValidation.createProductZodSchema),
  ProductController.createProduct
);

router.get('/get-all-products', ProductController.getAllProducts);

router.get(
  '/get-all-products/admin',
  auth('ADMIN', 'SUPER_ADMIN'),
  ProductController.getAllProductsAdmin
);

router.get('/get-product/:id', ProductController.getProduct);

router.get('/get-product-by-slug/:slug', ProductController.getProductBySlug);

router.patch(
  '/update-product/:id',
  auth('ADMIN', 'SUPER_ADMIN'),
  upload.array('images', 10),
  parseJsonFields,
  validateRequest(ProductValidation.updateProductZodSchema),
  ProductController.updateProduct
);

router.delete(
  '/delete-product/:id',
  auth('ADMIN', 'SUPER_ADMIN'),
  ProductController.deleteProduct
);

// Business Logic Routes
router.get('/get-trending-products', ProductController.getTrendingProducts);
router.get('/get-navbar-products', ProductController.getNavbarProducts);
router.get('/get-featured-products', ProductController.getFeaturedProducts);
router.get('/get-new-arrivals', ProductController.getNewArrivals);
router.get('/get-products-by-category/:categoryId', ProductController.getProductsByCategory);
router.get('/get-related-products/:productId', ProductController.getRelatedProducts);
router.get('/search-products', ProductController.searchProducts);

// Product Variants Routes
router.get('/get-product-variants/:productId', ProductController.getProductVariants);
// router.patch( '/update-variant-stock/:variantId', auth('ADMIN', 'SUPER_ADMIN'), ProductController.updateVariantStock );

// Add Product New Stock
router.patch('/update-product-stock/:productId', auth('ADMIN', 'SUPER_ADMIN'), ProductController.updateVariantStock);

// New Stock Logs Route
router.get(
  '/get-stock-logs/:productId',
  auth('ADMIN', 'SUPER_ADMIN'),
  ProductController.getStockLogs
);

// Product Analytics Routes
router.get('/get-product-analytics', auth('ADMIN', 'SUPER_ADMIN'), ProductController.getProductAnalytics);
router.get('/get-low-stock-products', auth('ADMIN', 'SUPER_ADMIN'), ProductController.getLowStockProducts);
router.get('/get-best-sellers', ProductController.getBestsellers);

export const ProductRoutes = router;