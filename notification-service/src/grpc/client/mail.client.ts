import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

/**
 * gRPC REFERENCE CLIENT (Notification Service)
 * 
 * Even though this is the 'notification-service' (the server), we include 
 * this client file for two main reasons:
 * 1. TESTING: So we can write scripts to test our own service.
 * 2. REFERENCE: So other developers know exactly how to connect to us.
 */

// 1. Path to the proto file
const PROTO_PATH = path.resolve(__dirname, "../proto/mail.proto");

// 2. Load the proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const notificationProto: any = grpc.loadPackageDefinition(packageDefinition).notification;

// 3. Current host. Since this is for the service itself, 
// 'localhost' is usually fine for testing.
const GRPC_HOST = process.env.NOTIFICATION_SERVICE_GRPC_HOST || "localhost:50051";

/**
 * The Client Instance.
 * This is the "Stub" that we use to call functions on the server.
 */
export const notificationClient = new notificationProto.NotificationService(
  GRPC_HOST,
  grpc.credentials.createInsecure()
);

/**
 * Example function to send a notification via this client.
 */
export const sendNotification = (content: string, type: string, username: string) => {
  return new Promise((resolve, reject) => {
    notificationClient.sendNotification(
      { content, type, service: "INTERNAL_TEST", username },
      (err: any, response: any) => {
        if (err) return reject(err);
        resolve(response);
      }
    );
  });
};

/**
 * Example function to send an email via this client.
 */
export const sendMail = (to: string, subject: string, body: string) => {
  return new Promise((resolve, reject) => {
    notificationClient.sendMail(
      { to, subject, body, type: "EMAIL" },
      (err: any, response: any) => {
        if (err) return reject(err);
        resolve(response);
      }
    );
  });
};
