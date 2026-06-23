export const NOTIFICATION_TYPE = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  WHATSAPP: "WHATSAPP",
};

export const NOTIFICATION_STATUS = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED",
};

export const SERVICES = {
  ONBOARD: "ONBOARD",
  LOGIN: "LOGIN",
  OTP_SERVICE: NOTIFICATION_TYPE.EMAIL,
};

export const RESPONSE_CODES = {
  SUCCESS: 0,
  ERROR: 1,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  CREATED: 201,
};

export const OTP_MESSAGES = {
  EMAIL_SENT: "Successfully sent OTP via Email.",
  OTP_SENT: "Successfully sent OTP.",
  FAILED: "Failed to process OTP request.",
  INVALID_OTP: "The provided OTP is invalid or has expired.",
  OTP_VERIFIED: "OTP verified successfully.",
};
