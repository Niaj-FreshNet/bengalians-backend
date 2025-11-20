"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverviewServices = exports.getWeeklyOverview = void 0;
const date_fns_1 = require("date-fns");
const client_1 = require("../../../prisma/client");
const getOverview = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    // Time ranges
    const todayStart = (0, date_fns_1.startOfDay)(now);
    const todayEnd = (0, date_fns_1.endOfDay)(now);
    const monthStart = (0, date_fns_1.startOfMonth)(now);
    const monthEnd = (0, date_fns_1.endOfMonth)(now);
    // Today's total orders
    const todayOrders = yield client_1.prisma.order.count({
        where: {
            orderTime: {
                gte: todayStart,
                lte: todayEnd,
            },
            isPaid: true,
        },
    });
    // This month's total orders
    const monthOrders = yield client_1.prisma.order.count({
        where: {
            orderTime: {
                gte: monthStart,
                lte: monthEnd,
            },
            isPaid: true,
        },
    });
    // This month's total sales
    const monthSalesAgg = yield client_1.prisma.order.aggregate({
        _sum: {
            amount: true,
        },
        where: {
            orderTime: {
                gte: monthStart,
                lte: monthEnd,
            },
            isPaid: true,
        },
    });
    // Total sales
    const totalSalesAgg = yield client_1.prisma.order.aggregate({
        _sum: {
            amount: true,
        },
        where: {
            isPaid: true,
        },
    });
    return {
        todayOrders,
        monthOrders,
        monthSales: monthSalesAgg._sum.amount || 0,
        totalSales: totalSalesAgg._sum.amount || 0,
    };
});
// Get weekly overview data circel chart
const getWeeklyOverview = () => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Get all paid orders
    const orders = yield client_1.prisma.order.findMany({
        where: { isPaid: true },
        select: { cartItems: true },
    });
    // 2. Flatten all cart items to extract variantId and quantity
    const allCartItems = orders.flatMap((order) => order.cartItems);
    if (allCartItems.length === 0)
        return [];
    // 3. Get unique variant IDs
    const uniqueVariantIds = [
        ...new Set(allCartItems.map((item) => item.variantId)),
    ];
    // 4. Fetch variant details with product & category info
    const variants = yield client_1.prisma.productVariant.findMany({
        where: { id: { in: uniqueVariantIds } },
        include: {
            product: {
                include: {
                    category: true,
                },
            },
        },
    });
    // 5. Build map for quick lookup
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    // 6. Calculate sales per category
    const productSalesMap = {};
    for (const item of allCartItems) {
        const variant = variantMap.get(item.variantId);
        if (!variant || !variant.product || !variant.product.category)
            continue;
        const categoryName = variant.product.category.categoryName;
        const saleAmount = variant.price * item.quantity;
        productSalesMap[categoryName] =
            (productSalesMap[categoryName] || 0) + saleAmount;
    }
    // 7. Fetch all categories to include 0% ones
    const allCategories = yield client_1.prisma.category.findMany();
    // 8. Calculate total sales
    const totalSales = Object.values(productSalesMap).reduce((a, b) => a + b, 0);
    // 9. Prepare distribution with percentage
    const categoryDistribution = allCategories.map((cat) => {
        const categoryName = cat.categoryName;
        const categorySales = productSalesMap[categoryName] || 0;
        const percentage = totalSales === 0
            ? 0
            : Number(((categorySales / totalSales) * 100).toFixed(2));
        return {
            category: categoryName,
            percentage,
        };
    });
    return categoryDistribution;
});
exports.getWeeklyOverview = getWeeklyOverview;
// getWeeklySales
const getWeeklySales = () => __awaiter(void 0, void 0, void 0, function* () {
    const sevenDaysAgo = (0, date_fns_1.subDays)(new Date(), 6); // includes today
    // Fetch paid orders from the last 7 days
    const orders = yield client_1.prisma.order.findMany({
        where: {
            isPaid: true,
            orderTime: {
                gte: (0, date_fns_1.startOfDay)(sevenDaysAgo),
            },
        },
        select: {
            orderTime: true,
            amount: true,
        },
    });
    // Initialize summary with 0 values
    const salesSummary = {
        Sunday: 0,
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
    };
    // Fill in actual amounts
    for (const order of orders) {
        const dayName = order.orderTime.toLocaleDateString('en-US', {
            weekday: 'long',
        });
        salesSummary[dayName] += order.amount;
    }
    return salesSummary;
});
exports.OverviewServices = {
    getOverview,
    getWeeklyOverview: exports.getWeeklyOverview,
    getWeeklySales,
};
