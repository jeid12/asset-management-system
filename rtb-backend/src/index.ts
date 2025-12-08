// src/index.ts
import "reflect-metadata";
import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import userRoutes from "./routes/user.routes";
import schoolRoutes from "./routes/school.routes";
import deviceRoutes from "./routes/device.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import applicationRoutes from "./routes/device-application.routes";
import notificationRoutes from "./routes/notification.routes";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Swagger UI setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, {
  swaggerOptions: {
    url: "/api-docs.json",
    displayOperationId: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: false,
    showCommonExtensions: false,
  },
  customCss: `
    .topbar { display: none; }
    .swagger-ui .topbar-wrapper { display: none; }
  `,
  customSiteTitle: "RTB Asset Management API",
}));

// Serve Swagger spec as JSON
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

// Health check route
app.get("/", (_req, res) => {
  res.json({ message: "RTB Asset Management System API is running!", docs: "/api-docs" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// Initialize database connection and start server
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connected successfully");
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📚 Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("❌ Error connecting to database:", error);
    process.exit(1);
  });
