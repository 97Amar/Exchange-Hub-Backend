import { sendMail } from "../../grpc/client/mail-client";
import { RESPONSE_CODES } from "../../../constants/statusCode";
import { ERROR_MESSAGES } from "../../../constants/messages";
import logger from "../../utils/logger";

/**
 * OTP HELPER
 * 
 * Simplified helper for sending OTP emails via gRPC.
 */
export const sendNotification = async (
  content: string,
  type: string,
  service: string,
  username: string,
): Promise<{ message: string; error: boolean }> => {
  try {
    // We use the simplified sendMail function from our gRPC client
    const res = await sendMail(username, "Your OTP Code", content, username, service);
    console.log("DEBUG: gRPC sendMail response:", JSON.stringify(res));
    
    return {
      error: res.status !== "SUCCESS" && ![0, 200, RESPONSE_CODES.SUCCESS, RESPONSE_CODES.CREATED, RESPONSE_CODES.ACCEPTED].includes(Number(res.status)),
      message: res.message,
    };
  } catch (error) {
    // 3. Centralized error logging for easier debugging.
    logger.error("Error in sendNotification helper", { metadata: { error } });
    throw new Error(ERROR_MESSAGES.GRPC_NOTIFICATION_FAILED);
  }
};


