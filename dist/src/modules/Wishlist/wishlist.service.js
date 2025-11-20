"use strict";
// import AppError from '../../errors/AppError';
// import { prisma } from '../../../prisma/client';
// const addToWishlist = async (req: any) => {
//   const userId = req.user?.id;
//   const variantId = req.body?.variantId;
//   if (!userId || !variantId) {
//     throw new AppError(403, 'User ID and Variant ID are required');
//   }
//   // Check if variant exists
//   const variant = await prisma.productVariant.findUnique({
//     where: { id: variantId },
//   });
//   if (!variant) {
//     throw new AppError(404, 'Product variant not found');
//   }
//   // Check if already in wishlist
//   const existing = await prisma.wishlist.findFirst({
//     where: {
//       userId,
//       variantId,
//     },
//   });
//   if (existing) {
//     return {
//       success: false,
//       message: 'Product variant already in wishlist',
//     };
//   }
//   // Create wishlist entry
//   const newWishlistItem = await prisma.wishlist.create({
//     data: {
//       userId,
//       variantId,
//     },
//     include: {
//       variant: {
//         include: {
//           product: true,
//         },
//       },
//     },
//   });
//   return {
//     success: true,
//     message: 'Product variant added to wishlist',
//     data: newWishlistItem,
//   };
// };
// const getWishlist = async (req: any) => {
//   const userId = req.user?.id;
//   if (!userId) {
//     throw new AppError(403, 'User not authenticated');
//   }
//   const wishlist = await prisma.wishlist.findMany({
//     where: {
//       userId,
//     },
//     include: {
//       variant: {
//         include: {
//           product: {
//             include: {
//               category: true,
//               material: true,
//               variants: true,
//             },
//           },
//         },
//       },
//     },
//   });
//   return {
//     success: true,
//     data: wishlist,
//   };
// };
// const removeFromWishlist = async (req: any) => {
//   const userId = req.user?.id;
//   console.log(userId);
//   const wishlistId = req.params.id;
//   if (!userId || !wishlistId) {
//     throw new AppError(403, 'Wishlist ID and User ID are required');
//   }
//   // Check if already in wishlist
//   const existing = await prisma.wishlist.findFirst({
//     where: {
//       id: wishlistId,
//     },
//   });
//   if (!existing) {
//     throw new AppError(404, 'Wishlist item not found');
//   }
//   if (userId !== existing.userId) {
//     throw new AppError(403, 'Unauthorized');
//   }
//   const deleted = await prisma.wishlist.delete({
//     where: {
//       id: existing.id,
//     },
//   });
//   return deleted;
// };
// export const WishlistServices = {
//   addToWishlist,
//   getWishlist,
//   removeFromWishlist,
// };
