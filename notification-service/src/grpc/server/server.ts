import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import logger from "../../utils/logger";
import * as MailModule from "../../modules/otp/otp.controller";

/**
 * gRPC SERVER (Simplified for Beginners)
 * 
 * This file sets up the gRPC server. We've kept only the essential 
 * configuration to make it easy to learn.
 */

// 1. Where should the server run?
const grpcHost = "0.0.0.0"; // Listen on all network interfaces
const grpcPort = process.env.GRPC_PORT;   // The standard port for our gRPC service
const URL = `${grpcHost}:${grpcPort}`;

// 2. Load the Service "Contract" (.proto file)
const PROTO_PATH = path.resolve(__dirname, "..", "..", "..", "..", "shared", "proto", "mail.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const proto: any = grpc.loadPackageDefinition(packageDefinition);

// 3. Create the Server
const server = new grpc.Server();

// 4. Register our OTP Service
// We tell gRPC: "When someone calls SendMail, run our controller function"
server.addService(proto.notification.NotificationService.service, {
  sendMail: MailModule.sendMail,
  verifyOtp: MailModule.verifyOtp,

  // Minimal placeholders for other methods defined in the proto
  sendNotification: (call: any, cb: any) => cb(null, { status: "OK", message: "Not implemented in this simple version" }),
});

/**
 * Start the Server
 */
export function startServer() {
  // Use insecure credentials for easy local development
  const credentials = grpc.ServerCredentials.createInsecure();

  server.bindAsync(URL, credentials, (error, port) => {
    if (error) {
      logger.error(`❌ Failed to start gRPC server: ${error.message}`);
    } else {
      logger.info(`✅ gRPC OTP Server is running on port: ${port}`);
    }
  });
}

// Simple graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down gRPC server...");
  server.tryShutdown(() => process.exit(0));
});

export default server;
