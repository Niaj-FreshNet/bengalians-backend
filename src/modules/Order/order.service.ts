import { prisma } from '../../../prisma/client';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { PrismaQueryBuilder } from '../../builder/QueryBuilder';
import { OrderSource, SaleType } from '@prisma/client';
import { generateInvoice } from '../../helpers/generateInvoice';

// ✅ Get All Orders (with customer + salesman info)
const getAllOrders = async (queryParams: Record<string, unknown>) => {
  const { searchTerm, status, ...rest } = queryParams;
  const queryBuilder = new PrismaQueryBuilder(rest, ['id', 'customer.name']);
  const prismaQuery = queryBuilder
    .buildWhere()
    .buildSort()
    .buildPagination()
    .getQuery();

  const where: any = prismaQuery.where || {};

  if (searchTerm) {
    where.OR = [
      ...(where.OR || []),
      { name: { contains: String(searchTerm), mode: 'insensitive' } },
      { email: { contains: String(searchTerm), mode: 'insensitive' } },
      { phone: { contains: String(searchTerm), mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    ...prismaQuery,
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          imageUrl: true,
        },
      },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: {
            include: {
              color: { select: { id: true, colorName: true, hexCode: true } },
            },
          },
        },
      },
    },
  });

  const meta = await queryBuilder.getPaginationMeta({
    count: (args: any) => prisma.order.count({ where: args.where }),
  });

  // Normalize customer info for guest orders
  const normalizedOrders = orders.map((order) => {
    const customerData = (order as any).customer ?? {
      id: null,
      name: order.name ?? null,
      phone: order.phone ?? null,
      email: order.email ?? null,
      address: order.address ?? null,
      imageUrl: null,
    };
    return { ...order, customer: customerData };
  });

  return { meta, data: normalizedOrders };
};

// ✅ Get Single Order (with full nested details)
const getOrderById = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, name: true, imageUrl: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });

  if (!order) throw new AppError(httpStatus.NOT_FOUND, 'Order not found');

  // Normalize customer info for guest/manual orders
  const customerData = order.customer || {
    id: null,
    name: order.name || null,
    phone: order.phone || null,
    email: order.email || null,
    address: order.address || null,
    imageUrl: null,
  };

  return { ...order, customer: customerData };
};

// ✅ Create Order with existing CartItems (UPDATED FOR APPAREL)
const createOrderWithCartItems = async (payload: {
  customerId?: string | null;
  cartItemIds: string[];
  amount: number;
  isPaid?: boolean;
  method: string;
  orderSource?: OrderSource;
  saleType?: SaleType;
  shippingCost?: number;
  additionalNotes?: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    district?: string;
    thana?: string;
  } | null;
  shippingAddress?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    district?: string;
    thana?: string;
  };
  billingAddress?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    district?: string;
    thana?: string;
  };
}) => {
  const {
    customerId,
    cartItemIds,
    amount,
    isPaid,
    method,
    orderSource,
    saleType,
    shippingCost,
    additionalNotes,
    customerInfo,
    shippingAddress,
    billingAddress,
  } = payload;

  // 1️⃣ Fetch valid cart items with variant details
  const cartItems = await prisma.cartItem.findMany({
    where: { id: { in: cartItemIds }, status: 'IN_CART' },
    include: {
      product: true,
      variant: true,
    },
  });

  if (cartItems.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No valid cart items found.');
  }

  // 2️⃣ Validate stock availability for each variant
  for (const item of cartItems) {
    if (!item.variant) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Variant not found for cart item ${item.id}`
      );
    }

    if (item.variant.stock < item.quantity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Insufficient stock for ${item.product.name} - ${item.variant.color} (Size: ${item.variant.size}). Available: ${item.variant.stock}, Requested: ${item.quantity}`
      );
    }
  }

  // 3️⃣ Start transaction with extended timeout
  const order = await prisma.$transaction(
    async (tx) => {
      const invoice = await generateInvoice();

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          invoice,
          amount: Number(amount),
          isPaid: isPaid || false,
          method: method || '',
          orderSource: orderSource || 'WEBSITE',
          saleType: saleType || 'SINGLE',
          shippingCost: shippingCost || 0,
          additionalNotes: additionalNotes || '',

          // Customer relation handling
          customer: customerId
            ? { connect: { id: customerId } }
            : {
                create: {
                  name: customerInfo?.name ?? '',
                  phone: customerInfo?.phone ?? '',
                  email: customerInfo?.email ?? '',
                  address: customerInfo?.address ?? '',
                },
              },

          shipping: {
            name: shippingAddress?.name || customerInfo?.name || null,
            phone: shippingAddress?.phone || customerInfo?.phone || null,
            email: shippingAddress?.email || customerInfo?.email || null,
            address: shippingAddress?.address || customerInfo?.address || null,
            district: shippingAddress?.district || customerInfo?.district || null,
            thana: shippingAddress?.thana || customerInfo?.thana || null,
          },
          billing: {
            name: billingAddress?.name || shippingAddress?.name || customerInfo?.name || null,
            phone: billingAddress?.phone || shippingAddress?.phone || customerInfo?.phone || null,
            email: billingAddress?.email || shippingAddress?.email || customerInfo?.email || null,
            address:
              billingAddress?.address || shippingAddress?.address || customerInfo?.address || null,
            district:
              billingAddress?.district || shippingAddress?.district || customerInfo?.district || null,
            thana: billingAddress?.thana || shippingAddress?.thana || customerInfo?.thana || null,
          },
          productIds: cartItems.map((ci) => ci.productId),
          cartItems: cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: Number(item.price),
          })),
        },
      });

      // Update CartItems as ordered
      await tx.cartItem.updateMany({
        where: { id: { in: cartItems.map((i) => i.id) } },
        data: { orderId: newOrder.id, status: 'ORDERED' },
      });

      // Update stock and create logs for each variant
      for (const item of cartItems) {
        const variantId = item.variantId;
        const productId = item.productId;
        const qty = item.quantity;

        if (!variantId) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Variant ID missing for product ${productId}`
          );
        }

        // ✅ Update VARIANT stock (apparel tracks stock per variant)
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stock: { decrement: qty },
          },
        });

        // ✅ Update Product salesCount
        await tx.product.update({
          where: { id: productId },
          data: {
            salesCount: { increment: qty },
          },
        });

        // ✅ Log stock change at variant level
        await tx.stockLog.create({
          data: {
            productId,
            variantId,
            change: -qty, // Negative for sale
            reason: 'SALE',
            notes: `Order ${newOrder.invoice} - Sold ${qty} unit(s)`,
          },
        });
      }

      return newOrder;
    },
    {
      timeout: 20000, // 20 seconds
    }
  );

  // 4️⃣ Fetch full order
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      customer: { select: { id: true, name: true, imageUrl: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });

  if (!fullOrder) throw new AppError(httpStatus.NOT_FOUND, 'Order not found');

  const customerData = fullOrder.customer || {
    id: null,
    name: fullOrder.name || null,
    phone: fullOrder.phone || null,
    email: fullOrder.email || null,
    address: fullOrder.address || null,
    imageUrl: null,
  };

  return { ...fullOrder, customer: customerData };
};

// ✅ Update Order Status
const updateOrderStatus = async (orderId: string, payload: Record<string, unknown>) => {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: payload,
  });
  return order;
};

// ✅ Cancel Order and Restore Stock
const cancelOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          variant: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  if (order.status === 'CANCEL') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order is already cancelled');
  }

  if (order.status === 'DELIVERED' || order.status === 'COMPLETED') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot cancel delivered or completed orders. Please process as return.'
    );
  }

  // Restore stock in transaction
  await prisma.$transaction(async (tx) => {
    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCEL' },
    });

    // Restore stock for each item
    for (const item of order.orderItems) {
      if (item.variantId) {
        // Restore variant stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { increment: item.quantity },
          },
        });

        // Update product salesCount
        await tx.product.update({
          where: { id: item.productId },
          data: {
            salesCount: { decrement: item.quantity },
          },
        });

        // Log stock restoration
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            change: item.quantity, // Positive for restoration
            reason: 'CANCEL',
            notes: `Order ${order.invoice} cancelled - Stock restored`,
          },
        });
      }
    }
  });

  return await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, name: true, imageUrl: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });
};

// ✅ Return Order and Restore Stock
const returnOrder = async (orderId: string, returnReason?: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          variant: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Only delivered or completed orders can be returned'
    );
  }

  // Process return in transaction
  await prisma.$transaction(async (tx) => {
    // Update order status to RETURNED
    await tx.order.update({
      where: { id: orderId },
      data: { 
        status: 'RETURNED',
        additionalNotes: returnReason 
          ? `${order.additionalNotes || ''}\nReturn Reason: ${returnReason}`
          : order.additionalNotes,
      },
    });

    // Restore stock for each item
    for (const item of order.orderItems) {
      if (item.variantId) {
        // Restore variant stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { increment: item.quantity },
          },
        });

        // Update product salesCount
        await tx.product.update({
          where: { id: item.productId },
          data: {
            salesCount: { decrement: item.quantity },
          },
        });

        // Log stock restoration
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            change: item.quantity,
            reason: 'RETURN',
            notes: `Order ${order.invoice} returned${returnReason ? ` - ${returnReason}` : ''}`,
          },
        });
      }
    }
  });

  return await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, name: true, imageUrl: true } },
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });
};

// ✅ Get User Orders
const getUserOrders = async (userId: string, queryParams: Record<string, unknown>) => {
  const queryBuilder = new PrismaQueryBuilder(queryParams);
  const prismaQuery = queryBuilder.buildSort().buildPagination().getQuery();

  const where = { customerId: userId };

  const [orders, totalOrders, totalAmount] = await Promise.all([
    prisma.order.findMany({
      ...prismaQuery,
      where,
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true, primaryImage: true } },
            variant: {
              include: {
                color: { select: { id: true, colorName: true, hexCode: true } },
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { amount: true } }),
  ]);

  const meta = await queryBuilder.getPaginationMeta({
    count: (args: any) => prisma.order.count({ where: args.where }),
  });

  return {
    meta,
    totalOrders,
    totalAmount: totalAmount._sum.amount ?? 0,
    data: orders,
  };
};

// ✅ Get all orders for a specific user (My Orders)
const getMyOrders = async (userId: string, queryParams: Record<string, unknown>) => {
  const queryBuilder = new PrismaQueryBuilder(queryParams);
  const prismaQuery = queryBuilder.buildSort().buildPagination().getQuery();

  const where = { customerId: userId };

  const [orders, totalOrders, totalAmount] = await Promise.all([
    prisma.order.findMany({
      ...prismaQuery,
      where,
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true, primaryImage: true } },
            variant: {
              include: {
                color: { select: { id: true, colorName: true, hexCode: true } },
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { amount: true } }),
  ]);

  const meta = await queryBuilder.getPaginationMeta({
    count: (args: any) => prisma.order.count({ where: args.where }),
  });

  return {
    meta,
    totalOrders,
    totalAmount: totalAmount._sum.amount ?? 0,
    data: orders,
  };
};

// ✅ Get a single order belonging to logged-in user
const getMyOrder = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: {
      orderItems: {
        include: {
          product: { select: { id: true, name: true, primaryImage: true } },
          variant: true,
        },
      },
    },
  });

  if (!order) throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  return order;
};

// ✅ Get all customers who have orders (for admin)
const getAllCustomers = async (queryParams: Record<string, unknown>) => {
  const queryBuilder = new PrismaQueryBuilder(queryParams);
  const prismaQuery = queryBuilder.buildSort().buildPagination().getQuery();

  const customers = await prisma.user.findMany({
    ...prismaQuery,
    where: {
      customerOrders: {
        some: {},
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      imageUrl: true,
      _count: { select: { customerOrders: true } },
    },
  });

  const meta = await queryBuilder.getPaginationMeta({
    count: (args: any) =>
      prisma.user.count({
        where: {
          customerOrders: { some: {} },
        },
      }),
  });

  return { meta, data: customers };
};

export const OrderServices = {
  getAllOrders,
  getOrderById,
  createOrderWithCartItems,
  updateOrderStatus,
  cancelOrder,
  returnOrder,
  getUserOrders,
  getMyOrders,
  getMyOrder,
  getAllCustomers,
};