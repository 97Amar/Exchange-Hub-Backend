import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { NOTIFICATION_TYPE } from "../src/utils/constants";

/**
 * gRPC Test Script for NotificationService
 *
 * Run this with: npx ts-node scripts/test-grpc.ts
 */

const PROTO_PATH = path.resolve(__dirname, "../src/shared/proto/mail.proto");
const GRPC_HOST = process.env.NOTIFICATION_SERVICE_GRPC_HOST;
const SERVER_URL = GRPC_HOST;


// 1. Load the proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto: any = grpc.loadPackageDefinition(packageDefinition);
const NotificationService = proto.notification.NotificationService;

// 2. Create the client
const client = new NotificationService(
  SERVER_URL,
  grpc.credentials.createInsecure(),
);

// 3. Define the request
const mailData = {
  to: "test@example.com",
  subject: "gRPC Test Email",
  body: "This is a test email sent via gRPC test script.",
  type: "TEST",
  username: "test_user",
  service: NOTIFICATION_TYPE.EMAIL,
};

console.log("🚀 Sending gRPC SendMail request...");

// 4. Make the call
client.SendMail(mailData, (error: any, response: any) => {
  if (error) {
    console.error("❌ gRPC Request Failed:", error.message);
    process.exit(1);
  } else {
    console.log("✅ gRPC notification side Response Received:");
    console.log(JSON.stringify(response, null, 2));

    // Simple assertion for freshers to understand
    if (response.status === "0" || response.status === 0) {
      console.log("🎉 Test Passed!");
    } else {
      console.warn("⚠️ Service returned non-success status.");
    }
  }
});
