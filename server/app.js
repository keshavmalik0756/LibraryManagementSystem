import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import expressFileUpload from "express-fileupload";

import { connectDB } from "./database/db.js";
import { errorMiddleware } from "./middlewares/errorMiddlewares.js";

import authRouter from "./routes/authRouter.js";
import bookRouter from "./routes/bookRouter.js";
import userRouter from "./routes/userRouter.js";
import borrowRouter from "./routes/borrowRouter.js";
import paymentRouter from "./routes/paymentRouter.js";

import { notifyUsers } from "./services/notifyUsers.js";
import { removeUnverifiedAccounts } from "./services/removeUnverifiedAccounts.js";

// Load environment variables
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "config", "config.env") });

// Initialize Express
export const app = express();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [process.env.FRONTEND_URL || "http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Logger middleware
app.use((req, res, next) => {
  console.log(`🔄 Request: ${req.method} ${req.path} from ${req.headers.origin || 'no-origin'}`);
  next();
});

// ===== MIDDLEWARES =====
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressFileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// ===== ROUTES =====
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/payment", paymentRouter);

// ===== TEST ROUTES =====
app.get("/", (req, res) => {
  res.send("🚀 LibraFlow Backend is Running Successfully!");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "LibraFlow Backend is healthy",
    timestamp: new Date().toISOString(),
    cors: "enabled"
  });
});

// ===== CORS TEST ROUTE =====
app.get("/cors-test", (req, res) => {
  const origin = req.headers.origin;

  // Set credentials-compatible CORS headers
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://library-management-system-kappa-fawn.vercel.app');
  }
  res.header('Access-Control-Allow-Credentials', 'true');

  res.json({
    success: true,
    message: "CORS is working correctly!",
    timestamp: new Date().toISOString(),
    origin: origin || 'no-origin'
  });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  const origin = req.headers.origin;

  // Set CORS headers for 404 responses too (credentials-compatible)
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://library-management-system-kappa-fawn.vercel.app');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// ===== DATABASE CONNECTION =====
connectDB()
  .then(() => console.log("✅ Database connected successfully"))
  .catch(err => {
    console.error("❌ DB Connection Failed:", err.message);
    process.exit(1);
  });

// ===== CRON JOBS =====
// Schedule cron jobs (they internally handle async)
setImmediate(() => {
  try {
    notifyUsers(); // schedules the notifyUsers cron
    removeUnverifiedAccounts(); // schedules the removeUnverifiedAccounts cron
    console.log("✅ Cron jobs scheduled successfully");
  } catch (err) {
    console.error("❌ Error scheduling cron jobs:", err);
  }
});

// ===== BASIC ERROR HANDLING =====

// ===== ERROR HANDLER =====
app.use(errorMiddleware);

// ===== GLOBAL UNHANDLED REJECTION HANDLER =====
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  // Optionally: graceful shutdown
});