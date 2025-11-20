import express, { Request, Response } from "express";
import router from "./routes/routes";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import cors from "cors";
import NotFound from "./middlewares/NotFound";
import path from "path";
import cookieParser from "cookie-parser";

const app = express();

// ---------------------------
// ✅ FIXED CORS CONFIG
// ---------------------------
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://bengalians.vercel.app",
      "https://bengalians.com",
      "https://bengalians.khushbuwaala.com",
      "https://www.bengalians.com",
      "http://bengalians.com",
      "http://www.bengalians.com",
    ];

    // Allow no-origin (e.g. Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ---------------------------
// ✅ MUST come before JSON & routes (Fix Preflight)
// ---------------------------
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle all OPTIONS requests

// ---------------------------
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// ---------------------------
// API ROUTES
// ---------------------------
app.use("/api", router);

// ---------------------------
// STATIC FILES
// ---------------------------
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ---------------------------
// TEST ROUTE
// ---------------------------
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Bengalians Server");
});

// ---------------------------
// NOT FOUND ROUTE
// ---------------------------
app.use(NotFound);

// ---------------------------
// GLOBAL ERROR HANDLER
// ---------------------------
app.use(globalErrorHandler);

export default app;
