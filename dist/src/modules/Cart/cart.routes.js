"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartItemRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const cart_controller_1 = require("./cart.controller");
const router = express_1.default.Router();
// Visitors + logged-in users both can add/view/update/delete cart items
router.post('/add-to-cart', (0, auth_1.default)('OPTIONAL'), cart_controller_1.CartItemController.addToCart);
router.get('/', (0, auth_1.default)('OPTIONAL'), cart_controller_1.CartItemController.getUserCart);
router.patch('/:id', (0, auth_1.default)('OPTIONAL'), cart_controller_1.CartItemController.updateCartItem);
router.delete('/:id', (0, auth_1.default)('OPTIONAL'), cart_controller_1.CartItemController.removeCartItem);
exports.CartItemRoutes = router;
