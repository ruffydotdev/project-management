import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5555;


app.set("trust proxy", 1);


connectDB();


const rawOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

const normalizedOrigins = rawOrigins.map((url) => url.replace(/\/+$/, "").toLowerCase());

app.use(
  cors({
    origin: (origin, callback) => {
      
      if (!origin) return callback(null, true);
      
      const cleanOrigin = origin.replace(/\/+$/, "").toLowerCase();
      
      if (
        normalizedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      
      callback(new Error(`CORS policy violation: ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "EMPMS Backend API",
    timestamp: new Date().toISOString(),
  });
});


app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] EMPMS Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});
