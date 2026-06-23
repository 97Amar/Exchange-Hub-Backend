import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import logger from "../../utils/logger";
import * as OtpModule from "../../modules/otp/otp.controller";

/**
 * MINIMAL gRPC SERVER (User Service)
 *
 * This file is built specifically for learning. We've removed
 * the complex settings like "retries" and "keepalives" so you
 * can focus on how gRPC starts and runs.
 */

// 1. Where do we want this server to listen?
// IP '0.0.0.0' means "listen on all network addresses"
const grpcIp = process.env.GRPC_HOST || "0.0.0.0";
const grpcPort = process.env.GRPC_PORT || "5001";

// Combining them into a single URL
const URL = `${grpcIp}:${grpcPort}`;

// 2. Load our "Service Contract" (The .proto file)
const PROTO_PATH = path.resolve(__dirname, "..", "..", "..", "..", "shared", "proto", "mail.proto");

// Options for loading the proto file correctly
const protoOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

// Loading the actual definition into memory
const packageDefinition = protoLoader.loadSync(PROTO_PATH, protoOptions);
const proto: any = grpc.loadPackageDefinition(packageDefinition);


// 3. Create the Server Instance
const server = new grpc.Server();

// 4. Connect our Code to the Service
// We tell gRPC: "When someone calls SendMail on port 53001, run our controller function"
server.addService(proto.notification.NotificationService.service, {
  sendMail: OtpModule.sendOtp, // This maps to our function in the controller
});

/**
 * Function to start the server
 */
export function startServer() {
  // We use "Insecure" credentials just for development/learning
  const credentials = grpc.ServerCredentials.createInsecure();

  // Bind (Attach) the server to the URL and start it
  server.bindAsync(URL, credentials, (error, port) => {
    if (error) {
      // If something goes wrong (like port is already used), we log an error
      logger.error("Failed to start gRPC server", {
        metadata: { error: error.message },
      });
    } else {
      // Success! The server is now waiting for calls
      logger.info(`✅ gRPC Server for OTP is running at: ${URL}`);
    }
  });
}

// Start the server immediately when this file is loaded
startServer();

export default server;
