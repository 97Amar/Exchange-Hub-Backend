import "dotenv/config";
import express, { Request, Response, Application } from "express";
import { startServer } from "./src/grpc/server/server";
import "./src/crone/mail"; // Start mail cron job

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 4001;

// Middleware
app.use(express.json());

// Health Check Route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OPERATIONAL",
    service: "notification-service",
    message: "Server is running 🚀",
  });
});

// Start Express API Server
app.listen(PORT, () => {
  console.log(`✅ Express Server running on http://localhost:${PORT}`);
});

// Start the gRPC Server (Refactored)
startServer();
