"use strict";
// import catchAsync from '../../utils/catchAsync';
// import sendResponse from '../../utils/sendResponse';
// import { WishlistServices } from './wishlist.service';
// const addToWishlist = catchAsync(async (req, res) => {
//   const result = await WishlistServices.addToWishlist(req);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Wishlist Created Successfully'
//       : 'Wishlist Creation Failed',
//     data: isok ? result : [],
//   });
// });
// const getWishlist = catchAsync(async (req, res) => {
//   const result = await WishlistServices.getWishlist(req);
//   const isok = result ? true : false;
//   sendResponse(res, {
//     statusCode: isok ? 200 : 400,
//     success: isok ? true : false,
//     message: isok
//       ? 'Wishlist Fetched Successfully'
//       : 'Wishlist Fetching Failed',
//     data: isok ? result : [],
//   });
// });
// const removeFromWishlist = catchAsync(async (req, res) => {
//   const result = WishlistServices.removeFromWishlist(req);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Wishlist Deleted Successfully',
//     data: [],
//   });
// });
// export const WishlistController = {
//   addToWishlist,
//   removeFromWishlist,
//   getWishlist,
// };
