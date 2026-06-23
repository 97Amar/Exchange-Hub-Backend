import db from "../../../models";
import { mail } from "../../utils/connection";
import {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  OTP_MESSAGES,
  RESPONSE_CODES,
  SERVICES,
} from "../../utils/constants";
import logger from "../../utils/logger";
import { generateOtp } from "../../utils/otp";

/**
 * Mail Templates
 */
export const MailTemplate = {
  ONBOARD: {
    SUBJECT: "Security Alert: New Sign-In Attempt",
    HTMLTEXT: `
<div style="font-family: Arial, sans-serif; text-align: center; max-width: 600px; margin: 0 auto; color: #777; padding: 40px 20px;">
  <div style="margin-bottom: 30px;">
    <h2 style="color: #333; margin: 0; font-size: 22px; font-weight: normal; display: flex; align-items: center; justify-content: center; gap: 8px;">
      <span style="font-size: 24px;">⛰️</span> The Marketplace Hub
    </h2>
  </div>
  <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
    You recently attempted to sign in to your The Marketplace Hub account from a new
    device or location. As a security measure, we require additional confirmation before
    allowing access to your The Marketplace Hub account.
  </p>
  <p style="font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
    If you recognize this activity, please confirm it with the activation code. Here is your
    account activation code:
  </p>
  <div style="margin: 30px 0;">
    <span style="background-color: #f0fdf4; border-radius: 8px; padding: 15px 40px; display: inline-block; color: #00e676; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
      {{code}}
    </span>
  </div>
  <p style="font-size: 15px; line-height: 1.6; margin-top: 30px;">
    The verification code will be valid for 30 minutes. Please do not share this code with
    anyone.
  </p>
</div>`,
    TEMPLATE: "onboard_otp",
  },
  COMMON_EMAIL: {
    FOOTER: "© 2026 The Marketplace Hub",
  },
};

/**
 * Replaces placeholders in a template string.
 */
async function ReplaceData(template: string, replaceObj: any[]) {
  let result = template;
  replaceObj.forEach((obj) => {
    result = result.split(obj.key).join(obj.replaceWith);
  });
  return result;
}

/**
 * Fetches template content based on service and content data.
 */
export async function getTemplateContent(serviceName: string, content: any) {
  try {
    const service = serviceName.trim().toUpperCase();
    console.log(
      `DEBUG: [notification-service] getTemplateContent for service: "${serviceName}" -> normalized: "${service}"`,
    );
    console.log(
      `DEBUG: [notification-service] Available SERVICES: ${JSON.stringify(SERVICES)}`,
    );

    if ([SERVICES.ONBOARD, SERVICES.LOGIN].includes(service)) {
      const code = content.otp;
      const replaceObj = [
        { replaceWith: code, key: "{{code}}" },
        {
          replaceWith: process.env.FRONT_END || "http://localhost:3000",
          key: "{{siteurl}}",
        },
        { replaceWith: "verify.domain.com", key: "{{verifydomain}}" },
        { replaceWith: "support@example.com", key: "{{contactsupport}}" },
      ];
      const replaceData = await ReplaceData(
        MailTemplate.ONBOARD.HTMLTEXT,
        replaceObj,
      );
      return {
        subject: MailTemplate.ONBOARD.SUBJECT,
        body: replaceData,
        template: MailTemplate.ONBOARD.TEMPLATE,
      };
    }
    return undefined;
  } catch (error) {
    logger.error("Error getting template content", error);
    return undefined;
  }
}

/**
 * Sends an email and updates the notification status.
 */
export async function sendMail(
  id: number,
  to: string,
  content: any,
  serviceName: string,
) {
  try {
    console.log("🚀 [mail.helper] inside sendMail for notification ID:", id);
    const mailData = await getTemplateContent(serviceName, content);

    if (!mailData) {
      logger.warn(`No template found for service: ${serviceName}`);
      await db.OtpNotification.update(
        { status: NOTIFICATION_STATUS.FAILED },
        { where: { id } },
      );
      return;
    }

    const mailSent = await mail.sendMail(
      to,
      mailData.subject,
      mailData.body,
      MailTemplate.COMMON_EMAIL.FOOTER,
      mailData.template,
    );

    if (mailSent) {
      await db.OtpNotification.update(
        { status: NOTIFICATION_STATUS.SENT },
        { where: { id } },
      );
    } else {
      await db.OtpNotification.update(
        { status: NOTIFICATION_STATUS.FAILED },
        { where: { id } },
      );
    }
  } catch (error) {
    logger.error("Error in sendMail helper", error);
    return error;
  }
}

/**
 * Processes all pending emails.
 */
export async function getPendingEmails() {
  try {
    const pendingMails = await db.OtpNotification.findAll({
      where: {
        type: NOTIFICATION_TYPE.EMAIL,
        status: NOTIFICATION_STATUS.PENDING,
      },
      raw: true,
    });

    console.log(
      `🔎 [mail.helper] Found ${pendingMails.length} pending emails.`,
    );

    for (const m of pendingMails) {
      try {
        console.log(
          "📨 [mail.helper] Processing pending mail for:",
          m.username,
        );
        // We use m.username as 'to' address here, often in this project it's the email
        await sendMail(
          m.id!,
          m.username,
          m.content,
          m.service || NOTIFICATION_TYPE.EMAIL,
        );
      } catch (error) {
        logger.error(`Failed to send email for: ${m.id}`, error);
      }
    }
  } catch (error) {
    logger.error("Error in getPendingEmails", error);
    throw error;
  }
}

/**
 * Generates OTP, stores it, and creates a notification record.
 */
export async function checkOtpExist(data: any) {
  const { username, type, service } = data;
  let otpDigits = data.otp || 6;
  const whereCondition = { where: { username, service } };

  // Check if OTP exists and recreate (standard logic from user request)
  await db.Otp.destroy(whereCondition);
  // const otp = generateOtp(otpDigits);
  const otp = "111111";
  await db.Otp.create({ username, otp, service });

  let content = { otp: otp, service: service, message: "" };
  let message;

  if (type === NOTIFICATION_TYPE.EMAIL) {
    message = OTP_MESSAGES.EMAIL_SENT;
  } else {
    message = OTP_MESSAGES.OTP_SENT;
    content.message = `Welcome to ${process.env.PROJECT_NAME || "CryptoExchange"}, Your account verification code is ${otp}.`;
  }

  // Create notification record with initial PENDING status
  await db.OtpNotification.create({
    username,
    type,
    content,
    service,
    status: NOTIFICATION_STATUS.PENDING,
  });

  return { statusCode: RESPONSE_CODES.SUCCESS, message: message, otp: otp };
}
