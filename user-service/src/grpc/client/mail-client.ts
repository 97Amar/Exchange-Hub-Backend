import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import logger from "../../utils/logger";
import { NOTIFICATION_TYPE } from "../../utils/constants";
/**
 * gRPC MAIL CLIENT
 * Simplified version focusing on OTP functionality.
 */

const PROTO_PATH = path.resolve(__dirname, "../proto/mail.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const notificationProto: any =
  grpc.loadPackageDefinition(packageDefinition).notification;
const GRPC_HOST = (process.env.NOTIFICATION_SERVICE_GRPC_HOST || "")
  .replace(/^https?:\/\//, "");
console.log("DEBUG: user-service mail-client GRPC_HOST:", GRPC_HOST);

// Initialize the gRPC Client
export const notificationClient = new notificationProto.NotificationService(
  GRPC_HOST,
  grpc.credentials.createInsecure(),
);

/**
 * Sends an email via gRPC (Optimized for OTP)
 */
export const sendMail = (
  to: string,
  subject: string,
  body: string,
  username: string,
  service: string,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    notificationClient.sendMail(
      { to, subject, body, type: NOTIFICATION_TYPE.EMAIL, username, service },
      (err: Error | null, res: any) => {
        if (err) {
          logger.error("gRPC sendMail error", { metadata: { error: err } });
          return reject(err);
        }
        resolve(res);
      },
    );
  });
};

/**
 * Verifies an OTP via gRPC
 */
export const verifyOtp = (
  email: string,
  otp: string,
  service: string,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    notificationClient.verifyOtp(
      { email, otp, service },
      (err: Error | null, res: any) => {
        if (err) {
          logger.error("gRPC verifyOtp error", { metadata: { error: err } });
          return reject(err);
        }
        resolve(res);
      },
    );
  });
};
