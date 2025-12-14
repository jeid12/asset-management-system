import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === "development", // Auto-create tables in dev
  logging: process.env.NODE_ENV === "development",
  entities: [__dirname + "/entities/**/*.{ts,js}"],
  migrations: [__dirname + "/migrations/**/*.{ts,js}"],
  subscribers: [__dirname + "/subscribers/**/*.{ts,js}"],
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  extra: {
    max: 5, // Reduced pool size for free tier
    min: 1, // Keep at least 1 connection alive
    idleTimeoutMillis: 10000, // Close idle clients after 10 seconds
    connectionTimeoutMillis: 3000, // Timeout after 3 seconds
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },
});
