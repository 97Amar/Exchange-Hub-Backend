import { ERROR_MESSAGES } from "../constants/messages";

export function validateEmail(email: string) {
  if (!email) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.EMAIL_IS_REQUIRED,
    };
  }
  // Check first character is ASCII
  const firstChar = email.charAt(0);
  if (firstChar.charCodeAt(0) > 127) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.FIRST_CHARACTER_MUST_BE_ASCII,
    };
  }

  // Check if email contains only allowed characters (a-z, A-Z, 0-9, and .)
  const validCharRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!validCharRegex.test(email)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_EMAIL_FORMAT,
    };
  }

  // Check for consecutive dots
  if (email.includes("..")) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.CONSECUTIVE_DOTS_IN_EMAIL,
    };
  }

  // Check if dots are at valid positions
  const [localPart, domain] = email.split("@");
  if (
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    domain.startsWith(".") ||
    domain.endsWith(".")
  ) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.DOT_CANNOT_START_END,
    };
  }

  // Check email length
  if (email.length > 254) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.EMAIL_LENGTH_EXCEEDED,
    };
  }

  if (localPart.length > 64 || localPart.length < 6) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.EMAIL_LENGTH_INVALID,
    };
  }
  // All validations passed
  return {
    isValid: true,
    error: null,
  };
}
