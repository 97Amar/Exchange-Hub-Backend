import "dotenv/config";
console.log("🔍 DEBUG: Starting exchange-service/index.ts");
import express, { Request, Response, Application } from "express";

import cors from "cors";
import { BybitRouter, BinanceRouter } from "./src/modules/route";
import { encryptionMiddleware } from "./src/middleware/encryption.middleware";
import { initDatabase } from "./src/database/database";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/config/swagger";
import { startServer } from "./src/grpc/server/server";
import { createServer } from "http";
import { initExchangeStreams } from "./src/socket/server";
import { ensureTopicsExist } from "./src/shared/utils/kafka-config";

const app: Application = express();

const httpServer = createServer(app);

// 👉 Change port if needed
const PORT: number = Number(process.env.PORT) || 4002;

// Middleware
app.use(express.json());
app.use(encryptionMiddleware);
app.use(cors());

// Routes
const bybitRouter = new BybitRouter();
app.use("/v1/bybit", bybitRouter.router);

const binanceRouter = new BinanceRouter();
app.use("/v1/binance", binanceRouter.router);

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Root Route
 */
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OPERATIONAL",
    service: "exchange-service",
    message: "Server is running 🚀",
  });
});

/**
 * Start Servers
 */
async function main() {
  try {
    // Ensure Kafka topics exist
    await ensureTopicsExist("exchange-service", ["EXCHANGE_SUBSCRIPTION", "EXCHANGE_USER_DATA", "EXCHANGE_MARKET_DATA"]);

    const server = httpServer.listen(PORT, () => {
      console.log(`✅ API Server running on http://localhost:${PORT}`);
    });

    // Initialize Socket Server
    initExchangeStreams(server);

    // Start gRPC Server
    startServer();

    // Initialize Database
    initDatabase();

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error("❌ Server error:", err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start Exchange Service:", error);
    process.exit(1);
  }
}

main();

process.on("uncaughtException", (err: any) => {
  if (err.message && err.message.includes("WebSocket was closed before the connection was established")) {
    console.warn("⚠️ Ignored reconnecting-websocket premature close exception.");
  } else if (err.code === -2015) {
    console.error("❌ Binance WebSocket Authentication Failed (-2015)", err);
  } else {
    console.error("❌ Uncaught Exception:", err);
    process.exit(1);
  }
});

