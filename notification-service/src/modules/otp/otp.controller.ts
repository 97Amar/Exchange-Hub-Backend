import { NOTIFICATION_TYPE } from "../../utils/constants";
import { logger } from "../../utils/logger";
import { addUserOtpData, verifyOtpData } from "./otp.helper";

/**
 * OTP CONTROLLER (Simplified for Beginners)
 *
 * This file contains the logic for handling OTP-related requests via gRPC.
 * We focus ONLY on sending the OTP email to keep things simple.
 */

/**
 * gRPC Handler: SendMail (Specifically for OTP)
 *
 * @param call - The incoming gRPC request (contains 'to', 'subject', 'body', etc.)
 * @param callback - The function we call to send the response back to the sender.
 */
export const sendMail = async (call: any, callback: any) => {
  // 1. Extract the OTP details from the request
  const { to, subject, body, username, type, service } = call.request;

  let otpCode = undefined;
  if (body && typeof body === "string") {
    const match = body.match(/\b\d{6}\b/);
    if (match) otpCode = match[0];
  }

  // 2. Prepare request for addUserOtpData
  const otpRequest = {
    ...call.request,
    content: { otp: otpCode || 6, body: body },
    username: username || to, // Default to email if no username provided
    service: service || NOTIFICATION_TYPE.EMAIL,
    target: to,
    type: (type && type !== "TEST") ? type : "EMAIL",
  };

  const res = await addUserOtpData(otpRequest);

  // 3. Log that we received the request (for debugging)
  console.log("\n" + "=".repeat(50));
  console.log(
    "🚀 [gRPC] HIT: SendMail function called inside notification-service!",
  );
  console.log("=".repeat(50));

  logger.info(`[gRPC] 📨 Target Email: ${to}`);
  logger.info(
    `[gRPC] 🔍 Full Request: ${JSON.stringify(call.request, null, 2)}`,
  );

  // 4. Send a success response back to the User Service
  callback(null, { status: res.statusCode, message: res.message });
};

/**
 * gRPC Handler: VerifyOtp
 * 
 * Validates the OTP provided by the user service.
 */
export const verifyOtp = async (call: any, callback: any) => {
  try {
    const { email, otp, service } = call.request;

    logger.info(`[gRPC] 🔐 Verifying OTP for: ${email}`);

    const res = await verifyOtpData(email, otp, service);

    callback(null, { 
      status: res.statusCode.toString(), 
      message: res.message 
    });
  } catch (error: any) {
    logger.error(`[gRPC] ❌ Error in verifyOtp: ${error.message}`);
    callback(null, { 
      status: "500", 
      message: "Internal server error during verification" 
    });
  }
};

/* 
   Note: We removed 'sendNotification' and other complex methods 
   to focus purely on the OTP email flow as requested.
*/
