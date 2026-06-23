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
  NO_FILE_UPLOADED: "No file uploaded",
  PROJECT_NAME_REQUIRED: "Project name is required",
  VALID_PHONE_NUMBER:
    "Please enter a valid phone number in international format, e.g., +1234567890",
  PHONE_COUNTRY_REQUIRED:
    "Phone number and country code are required to validate.",
  PASSWORDS_NOT_MATCH: "Passwords do not match",
  COUNTRY_CODE_REQUIRED: "Country code is required.",
  TOKEN_MISSING: "Authorization token missing or invalid",
  INVALID_TOKEN: "Invalid or expired token",
  INVALID_SESSION: "Invalid or expired session",
  GRPC_NOTIFICATION_FAILED: "Failed to send notification via gRPC service",
};

export const SUCCESS_MESSAGES = {
  OTP_GENERATED_SUCCESSFULLY: "OTP is generated successfully.",
  USER_VERIFIED_SUCCESSFULLY: "User verified successfully.",
  LOGOUT_SUCCESSFULLY: "Logged out successfully.",
  PROFILE_FETCHED: "Profile fetched successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  REPOSITORY_UPLOADED: "Repository uploaded and listed successfully",
  REPOSITORIES_FETCHED: "Repositories fetched successfully",
  CREDENTIALS_VERIFIED:
    "Credentials verified. Please enter the OTP sent to your email.",
};

export const TOO_MANY_REQUESTS = "Too many requests, please try again later";
