import "dotenv/config";
import express, { Request, Response, Application } from "express";
import cors from "cors";
import WalletRouter from "./src/modules/route";
import { encryptionMiddleware } from "./src/middleware/encryption.middleware";

import { initDatabase } from "./src/database/database";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/config/swagger";


const app: Application = express();


// 👉 Change port if needed
const PORT: number = Number(process.env.PORT) || 4003;

// Middleware
app.use(express.json());
app.use(encryptionMiddleware);
app.use(cors());


// Routes
const walletRouter = new WalletRouter();
app.use("/v1/wallet", walletRouter.router);

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Root Route
 */
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OPERATIONAL",
    service: "wallet-service",
    message: "Server is running 🚀",
  });
});

/**
 * Start Servers
 */
const server = app.listen(PORT, () => {
  console.log(`✅ API Server running on http://localhost:${PORT}`);
});



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
