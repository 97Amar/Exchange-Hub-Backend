import logger from "../../utils/logger";

/**
 * OTP CONTROLLER (User Service Side)
 *
 * This file handles the logic for our "Send OTP" gRPC commands.
 * Even though the main logic lives in the notification-service,
 * this provides a clean example for learning.
 */

/**
 * gRPC Handler: SendMail
 *
 * This function runs when someone calls our service to send an OTP email.
 */
export const sendOtp = (call: any, callback: any) => {
  // 1. Get the data sent by the requester
  const { to, subject, body } = call.request;

  // 2. Log it so we can see it's working
  logger.info(`[User Service gRPC Server] 📧 Preparing to send OTP for: ${to}`);

  // 3. Return a success response
  callback(null, {
    status: "SUCCESS",
    message: `OTP request for ${to} received and acknowledged.`,
  });
};
