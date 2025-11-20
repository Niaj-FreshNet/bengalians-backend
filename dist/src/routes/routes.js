"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("../modules/Auth/auth.routes");
const category_routes_1 = require("../modules/Category/category.routes");
const blog_routes_1 = require("../modules/Blog/blog.routes");
const contact_routes_1 = require("../modules/contact/contact.routes");
const material_routes_1 = require("../modules/Material/material.routes");
const product_routes_1 = require("../modules/Product/product.routes");
const user_routes_1 = require("../modules/User/user.routes");
const payment_routes_1 = require("../modules/Payment/payment.routes");
const order_routes_1 = require("../modules/Order/order.routes");
const review_routes_1 = require("../modules/Review/review.routes");
const overview_routes_1 = require("../modules/overview/overview.routes");
const wishlist_route_1 = require("../modules/Wishlist/wishlist.route");
const sales_routes_1 = require("../modules/Sales/sales.routes");
const expense_route_1 = require("../modules/Expense/expense.route");
const cart_routes_1 = require("../modules/Cart/cart.routes");
const fabric_routes_1 = require("../modules/Fabric/fabric.routes");
const discount_routes_1 = require("../modules/Discount/discount.routes");
const collection_routes_1 = require("../modules/Collection/collection.routes");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: '/auth',
        route: auth_routes_1.AuthRoutes,
    },
    {
        path: '/category',
        route: category_routes_1.CategoryRoutes,
    },
    {
        path: '/collection',
        route: collection_routes_1.CollectionRoutes,
    },
    {
        path: '/materials',
        route: material_routes_1.MaterialRoutes,
    },
    {
        path: '/fabrics',
        route: fabric_routes_1.FabricRoutes,
    },
    {
        path: '/products',
        route: product_routes_1.ProductRoutes,
    },
    {
        path: '/blog',
        route: blog_routes_1.BlogRoutes,
    },
    {
        path: '/contact',
        route: contact_routes_1.ContactRoutes,
    },
    {
        path: '/user',
        route: user_routes_1.UserRoutes,
    },
    {
        path: '/payment',
        route: payment_routes_1.PaymentRoutes,
    },
    {
        path: '/cart',
        route: cart_routes_1.CartItemRoutes,
    },
    {
        path: '/order',
        route: order_routes_1.OrderRoutes,
    },
    {
        path: '/review',
        route: review_routes_1.ReviewRoutes,
    },
    {
        path: '/overview',
        route: overview_routes_1.OverviewRoutes,
    },
    {
        path: '/wishlist',
        route: wishlist_route_1.WishlistRoutes,
    },
    {
        path: '/sales',
        route: sales_routes_1.SalesRoutes,
    },
    {
        path: '/expenses',
        route: expense_route_1.ExpenseRoutes,
    },
    {
        path: '/discount',
        route: discount_routes_1.DiscountRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
