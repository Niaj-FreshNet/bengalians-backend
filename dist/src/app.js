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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes/routes"));
const globalErrorHandler_1 = __importDefault(require("./middlewares/globalErrorHandler"));
const cors_1 = __importDefault(require("cors"));
const NotFound_1 = __importDefault(require("./middlewares/NotFound"));
const path_1 = __importDefault(require("path"));
// import { PaymentController } from './modules/Payment/payment.controller';
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
exports.corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5173',
        'http://localhost:5174',
        'https://khushbuwaala.vercel.app',
        'https://khushbuwaala.com',
        'https://www.khushbuwaala.com',
        'http://khushbuwaala.com',
        'http://www.khushbuwaala.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
// **Handle preflight requests for all routes**
// app.options('*', cors(corsOptions));
// Apply CORS middleware globally
app.use((0, cors_1.default)(exports.corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api', routes_1.default);
app.use(express_1.default.static('public'));
app.use(express_1.default.urlencoded({ extended: true }));
// app.post(
//   '/api/payment/webhook',
//   express.raw({ type: 'application/json' }),
//   PaymentController.webhook,
// );
// app.use("/uploads", express.static(path.join("/var/www/uploads")));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.use(globalErrorHandler_1.default);
//test route
const test = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sayHi = 'Welcome to Bengalians Server';
    res.send(sayHi);
});
app.get('/', test);
//gloabal err handler
app.use(globalErrorHandler_1.default);
//Not Found Route
app.use(NotFound_1.default);
exports.default = app;
