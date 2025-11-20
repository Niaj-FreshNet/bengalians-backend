import express from 'express';
import { AuthRoutes } from '../modules/Auth/auth.routes';
import { CategoryRoutes } from '../modules/Category/category.routes';
import { BlogRoutes } from '../modules/Blog/blog.routes';
import { ContactRoutes } from '../modules/contact/contact.routes';
import { MaterialRoutes } from '../modules/Material/material.routes';
import { ProductRoutes } from '../modules/Product/product.routes';
import { UserRoutes } from '../modules/User/user.routes';
import { PaymentRoutes } from '../modules/Payment/payment.routes';
import { OrderRoutes } from '../modules/Order/order.routes';
import { ReviewRoutes } from '../modules/Review/review.routes';
import { OverviewRoutes } from '../modules/overview/overview.routes';
import { WishlistRoutes } from '../modules/Wishlist/wishlist.route';
import { SalesRoutes } from '../modules/Sales/sales.routes';
import { ExpenseRoutes } from '../modules/Expense/expense.route';
import { CartItemRoutes } from '../modules/Cart/cart.routes';
import { FabricRoutes } from '../modules/Fabric/fabric.routes';
import { DiscountRoutes } from '../modules/Discount/discount.routes';
import { CollectionRoutes } from '../modules/Collection/collection.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/category',
    route: CategoryRoutes,
  },
  {
    path: '/collection',
    route: CollectionRoutes,
  },
  {
    path: '/materials',
    route: MaterialRoutes,
  },
  {
    path: '/fabrics',
    route: FabricRoutes,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
  {
    path: '/blog',
    route: BlogRoutes,
  },
  {
    path: '/contact',
    route: ContactRoutes,
  },
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/payment',
    route: PaymentRoutes,
  },
  {
    path: '/cart',
    route: CartItemRoutes,
  },
  {
    path: '/order',
    route: OrderRoutes,
  },
  {
    path: '/review',
    route: ReviewRoutes,
  },
  {
    path: '/overview',
    route: OverviewRoutes,
  },
  {
    path: '/wishlist',
    route: WishlistRoutes,
  },

  {
    path: '/sales',
    route: SalesRoutes,
  },
  {
    path: '/expenses',
    route: ExpenseRoutes,
  },
  {
    path: '/discount',
    route: DiscountRoutes,
  },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
