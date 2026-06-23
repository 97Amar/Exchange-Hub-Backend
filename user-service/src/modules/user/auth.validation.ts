import Joi from "joi";
import * as utilitiesHelper from "../../helpers/utilities.helper";
import { ERROR_MESSAGES } from "../../../constants/messages";
const { parsePhoneNumber } = require('libphonenumber-js');

export const signUpWithPassword = {
  body: Joi.object({
    userType: Joi.string().valid("USER").insensitive().required(),

    firstName: Joi.string()
      .trim()
      .min(2)
      .max(30)
      .pattern(/^([a-zA-Z]+(\s[a-zA-Z]+)*)$/)
      .required(),
    lastName: Joi.string()
      .min(2)
      .max(30)
      .pattern(new RegExp(/^(?!.*\d)[a-zA-Z\s'-]+$/))
      .required(),
    email: Joi.string()
      .email({ tlds: { allow: false } }) // Use Joi's built-in email validation
      .custom((value, helpers) => {
        const emailValidate = utilitiesHelper.validateEmail(value);
        if (!emailValidate.isValid) {
          throw new Error(emailValidate.error || "Invalid email");
        }
        return value;
      })
      .required(),
    countryCode1: Joi.string()
      .pattern(/^\+(\d{1,3})$/)
      .optional()
      .allow(""),
    phoneNumber1: Joi.string()
      // .min(10)
      .max(15)
      .optional()
      .allow("")
      .custom((value, helpers) => {
        if (value) {
          const countryCode = helpers.state.ancestors[0].countryCode1;
          if (!countryCode) {
            return helpers.error("any.required", {
              message: ERROR_MESSAGES.COUNTRY_CODE_REQUIRED,
            });
          }
          const fullPhoneNumber = countryCode + value.trim();
          const phoneNumber = parsePhoneNumber(fullPhoneNumber);
          if (!phoneNumber || !phoneNumber.isValid()) {
            return helpers.error("string.phoneNumber");
          }
        }
        return value;
      })
      .messages({
        "string.phoneNumber": ERROR_MESSAGES.VALID_PHONE_NUMBER,
        "any.required": ERROR_MESSAGES.PHONE_COUNTRY_REQUIRED,
      }),
    phone: Joi.string()
      .optional()
      .allow(""),
    agree: Joi.boolean()
      .optional(),

    password: Joi.when("isPassKey", {
      is: "1",
      then: Joi.string().allow("").optional(),
      otherwise: Joi.string()
        .min(8)
        .max(32)
        .pattern(
          new RegExp(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,32}$/,
          ),
        )
        .required(),
    }),
    confirmPassword: Joi.when("isPassKey", {
      is: "1",
      then: Joi.string().allow("").optional(),
      otherwise: Joi.string()
        .optional()

        .valid(Joi.ref("password"))
        .messages({ "any.only": ERROR_MESSAGES.PASSWORDS_NOT_MATCH }),
    }),
    type: Joi.string().valid("EMAIL", "SMS").default("EMAIL").optional(),
    deviceType: Joi.string().valid("1", "0").default("1").optional(),
  }),
};

export const verifyOtp = {
  body: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    otp: Joi.string()
      .length(6)
      .required(),
    service: Joi.string()
      .optional()
      .default("ONBOARD"),
  }),
};

export const sendOtp = {
  body: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    service: Joi.string()
      .optional()
      .default("ONBOARD"),
  }),
};

export const login = {
  body: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    password: Joi.string()
      .required(),
  }),
};
