export const ERROR_MESSAGES = {
  REGISTER_ALREADY_DONE:
    "Email already exist. Please try with different email.",
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again",
  PASSWORD_MISSING: "Please enter your password.",
  EMAIL_IS_REQUIRED: "Email is required",
  FIRST_CHARACTER_MUST_BE_ASCII: "First character must be ASCII",
  INVALID_EMAIL_FORMAT:
    "Email can only contain letters (a-z, A-Z), numbers (0-9), and special characters (._%+-)",
  CONSECUTIVE_DOTS_IN_EMAIL: "Email cannot contain consecutive dots",
  EMAIL_DOMAIN: `Email domain {EMAIL_DOMAIN} is restricted`,
  DOT_CANNOT_START_END: "Dot (.) cannot be at the start or end of email parts",
  EMAIL_LENGTH_EXCEEDED: "Email address is too long",
  EMAIL_LENGTH_INVALID: "Email must be of lenght 6-64 characters",
  INVALID_OTP: "Invalid OTP. Please try again.",
  USER_NOT_FOUND: "User not found.",
  INVALID_CREDENTIALS: "The credentials you provided are incorrect.",
};

export const SUCCESS_MESSAGES = {
  OTP_GENERATED_SUCCESSFULLY: "OTP is generated successfully.",
  USER_VERIFIED_SUCCESSFULLY: "User verified successfully.",
  LOGOUT_SUCCESSFULLY: "Logged out successfully.",
};

export const GLOBAL_MESSAGES = {
  TOO_MANY_REQUESTS: "Too many requests, please try again later",
};
