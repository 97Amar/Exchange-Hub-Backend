import db from "../../../models";
import { generateOtp } from "../../utils/otp";
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_STATUS,
  OTP_MESSAGES,
  RESPONSE_CODES,
  SERVICES,
} from "../../utils/constants";
import logger from "../../utils/logger";

export async function addUserOtpData(request: any) {
  const transaction = await db.sequelize.transaction();
  try {
    const { username, type, service, content: rawContent, target } = request;

    let content =
      typeof rawContent === "string"
        ? JSON.parse(rawContent)
        : rawContent || {};

    if (content && content.otp !== null && content.otp !== undefined) {
      let otpDigits = content.otp;
      await db.Otp.destroy({ where: { username, service }, transaction });

      let otp = "111111";
      // if (typeof otpDigits === "string" && String(otpDigits).length > 2) {
      //   otp = otpDigits;
      // } else {
      //   otp = generateOtp(Number(otpDigits));
      // }

      await db.Otp.create(
        {
          username,
          otp,
          service,
          target,
        },
        { transaction },
      );
      content.otp = otp;
    }

    content.service = service;
    content.target = target;
    await db.OtpNotification.create(
      {
        username,
        type,
        content,
        status: NOTIFICATION_STATUS.PENDING,
        service: service || NOTIFICATION_TYPE.EMAIL,
      },
      { transaction },
    );
    await transaction.commit();

    const message =
      type === NOTIFICATION_TYPE.EMAIL
        ? OTP_MESSAGES.EMAIL_SENT
        : OTP_MESSAGES.OTP_SENT;

    return { statusCode: RESPONSE_CODES.SUCCESS, message: message };
  } catch (error) {
    logger.error("Error in addNotificationData", error);
    await transaction.rollback();
    throw error;
  }
}

/**
 * Verify OTP Data
 * 
 * Checks if the provided OTP is valid for the given email and service.
 */
export async function verifyOtpData(email: string, otp: string, service: string) {
  try {
    const trimmedEmail = email?.trim();
    const trimmedOtp = otp?.trim();
    const serviceName = (service || "ONBOARD").trim();

    console.log(`DEBUG: [notification-service] verifyOtpData START`);
    console.log(`DEBUG: [notification-service] email: "${trimmedEmail}" (len: ${trimmedEmail?.length})`);
    console.log(`DEBUG: [notification-service] otp: "${trimmedOtp}" (len: ${trimmedOtp?.length})`);
    console.log(`DEBUG: [notification-service] service: "${serviceName}" (len: ${serviceName?.length})`);

    const otpRecord = await db.Otp.findOne({
      where: {
        username: trimmedEmail,
        otp: trimmedOtp,
        service: serviceName,
      },
    });

    if (!otpRecord) {
      const anyOtp = await db.Otp.findOne({ where: { username: email } });
      console.log(`DEBUG: [notification-service] No match found. Closest record for user: ${JSON.stringify(anyOtp)}`);
      return {
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        message: OTP_MESSAGES.INVALID_OTP
      };
    }

    const EXPIRE_TIME = 30 * 60 * 1000; // 30 minutes
    const createdAt = otpRecord.createdAt;
    const isExpired = new Date().getTime() - new Date(createdAt as any).getTime() > EXPIRE_TIME;

    if (isExpired) {
      return {
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        message: OTP_MESSAGES.INVALID_OTP
      };
    }

    // Optional: Check expiration logic here if applicable
    // For now, we'll just delete the OTP once verified to prevent reuse
    await db.Otp.destroy({
      where: {
        username: email,
        service: service || "ONBOARD",
      },
    });

    return {
      statusCode: RESPONSE_CODES.SUCCESS,
      message: OTP_MESSAGES.OTP_VERIFIED
    };
  } catch (error) {
    logger.error("Error in verifyOtpData", error);
    throw error;
  }
}
