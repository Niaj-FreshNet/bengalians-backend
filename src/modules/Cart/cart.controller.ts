import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CartItemServices } from './cart.services';

export const CartItemController = {
  // ✅ Add to Cart (visitor or user)
  addToCart: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any)?.user?.id || null; // null for visitors
    const { productId, variantId, size, quantity, price } = req.body;

    const item = await CartItemServices.addToCart({
      userId,
      productId,
      variantId,
      size,
      quantity,
      price,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Item added to cart',
      data: item,
    });
  }),

  // ✅ Get Cart (visitor or user)
  getUserCart: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any)?.user?.id || null;
    const items = await CartItemServices.getUserCart(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Cart fetched successfully',
      data: items,
    });
  }),

  // ✅ Update Cart Item
  updateCartItem: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await CartItemServices.updateCartItem(id, quantity);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Cart item updated',
      data: item,
    });
  }),

  // ✅ Remove Cart Item
  removeCartItem: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await CartItemServices.removeCartItem(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Cart item removed',
    });
  }),
};
