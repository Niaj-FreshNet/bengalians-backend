import express, { Request, Response } from 'express';
import router from './routes/routes';
import globalErrorHandler from './middlewares/globalErrorHandler';
import cors from 'cors';
import NotFound from './middlewares/NotFound';
import path from 'path';
// import { PaymentController } from './modules/Payment/payment.controller';
import cookieParser from 'cookie-parser';

const app = express();

export const corsOptions = {
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
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/api', router);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// app.post(
//   '/api/payment/webhook',
//   express.raw({ type: 'application/json' }),
//   PaymentController.webhook,
// );

// app.use("/uploads", express.static(path.join("/var/www/uploads")));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(globalErrorHandler);

//test route
const test = async (req: Request, res: Response) => {
  const sayHi = 'Welcome to Bengalians Server';
  res.send(sayHi);
};
app.get('/', test);
//gloabal err handler
app.use(globalErrorHandler);

//Not Found Route
app.use(NotFound);

export default app;
