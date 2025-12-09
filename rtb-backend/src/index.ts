// src/index.ts
import "reflect-metadata";
import express, { Application } from "express";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";
import { config, validateEnv } from "./config/env.config";
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import userRoutes from "./routes/user.routes";
import schoolRoutes from "./routes/school.routes";
import deviceRoutes from "./routes/device.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import applicationRoutes from "./routes/device-application.routes";
import notificationRoutes from "./routes/notification.routes";
import auditLogRoutes from "./routes/audit-log.routes";
import reportRoutes from "./routes/report.routes";

// Validate environment variables
validateEnv();

const app: Application = express();
const PORT = config.server.port;

// Middleware
app.use(cors(config.cors));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "..", config.upload.uploadDir)));

// Swagger UI setup
if (config.swagger.enabled) {
  app.use(config.swagger.path, swaggerUi.serve, swaggerUi.setup(specs, {
    swaggerOptions: {
      url: `${config.swagger.path}.json`,
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
    customSiteTitle: config.swagger.title,
  }));

  // Serve Swagger spec as JSON
  app.get(`${config.swagger.path}.json`, (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
}

// Health check route
app.get("/", (_req, res) => {
  res.json({ 
    message: "RTB Asset Management System API is running!", 
    version: config.swagger.version,
    environment: config.server.nodeEnv,
    docs: config.swagger.enabled ? config.swagger.path : "disabled"
  });
});

// API Routes
const apiPath = config.server.apiBasePath;
app.use(`${apiPath}/auth`, authRoutes);
app.use(`${apiPath}/profile`, profileRoutes);
app.use(`${apiPath}/users`, userRoutes);
app.use(`${apiPath}/schools`, schoolRoutes);
app.use(`${apiPath}/devices`, deviceRoutes);
app.use(`${apiPath}/dashboard`, dashboardRoutes);
app.use(`${apiPath}/applications`, applicationRoutes);
app.use(`${apiPath}/notifications`, notificationRoutes);
app.use(`${apiPath}/audit-logs`, auditLogRoutes);
app.use(`${apiPath}/reports`, reportRoutes);

// Initialize database connection and start server
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connected successfully");
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${config.server.nodeEnv}`);
      console.log(`🌍 CORS Origin: ${config.cors.origin.join(', ')}`);
      if (config.swagger.enabled) {
        const baseUrl = config.deployment.renderExternalUrl || `http://localhost:${PORT}`;
        console.log(`📚 Swagger UI: ${baseUrl}${config.swagger.path}`);
      }
    });
  })
  .catch((error) => {
    console.error("❌ Error connecting to database:", error);
    process.exit(1);
  }); console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📚 Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("❌ Error connecting to database:", error);
    process.exit(1);
  });
