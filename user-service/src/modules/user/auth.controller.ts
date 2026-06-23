import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../../../constants/messages";
import { RESPONSE_CODES } from "../../../constants/statusCode";
import * as DbModel from "../../../models";
import Api400Error from "../../exception/api400Error";
import { sendNotification } from "../otp/otp.helper";
import { NOTIFICATION_TYPE } from "../../utils/constants";
import logger from "../../utils/logger";
import { generateToken } from "../../utils/jwt";
import { AuthRequest } from "../../middleware/auth.middleware";

const BCRYPT_SALT_ROUNDS = 10;

export const signUPWithPassword = async (
  request: Request,
  response: Response,
) => {
  try {
    let { firstName, lastName, email, password, userType, phone } =
      request.body;
    firstName = firstName || "";
    lastName = lastName || "";
    userType = userType || "USER";
    phone = phone || "";

    const userExists = await DbModel.UserRegister.findOne({
      where: { email },
    });
    if (userExists) {
      throw new Api400Error(ERROR_MESSAGES.REGISTER_ALREADY_DONE);
    }
    if (!password) {
      throw new Api400Error(ERROR_MESSAGES.PASSWORD_MISSING);
    }

    // Hash password before storing
    console.log("DEBUG: Registering user with email:", email);
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Save user data to DB with inactive status (pending OTP verification)
    const user = await DbModel.UserRegister.create({
      first_name: firstName,
      last_name: lastName,
      email,
      password: hashedPassword,
      user_type: userType,
      phone: phone,
      status: "inactive",
    });

    const content = { service: "ONBOARD" };

    const sendOTP = await sendNotification(
      JSON.stringify(content),
      NOTIFICATION_TYPE.EMAIL,
      "ONBOARD",
      email,
    );

    if (sendOTP.error) {
      throw new Api400Error(sendOTP.message as string);
    }

    const token = await generateToken({
      id: user.user_id,
      email,
      firstName,
      lastName,
      userType,
    });

    return response.status(RESPONSE_CODES.SUCCESS).json({
      status: RESPONSE_CODES.SUCCESS,
      message: SUCCESS_MESSAGES.OTP_GENERATED_SUCCESSFULLY,
      data: {
        token,
      },
    });
  } catch (error: any) {
    logger.error("Error in signup with password.", error);
    if (error instanceof Api400Error) {
      return response.status(RESPONSE_CODES.BAD_REQUEST).json({ status: RESPONSE_CODES.BAD_REQUEST, message: error.message });
    }
    return response
      .status(RESPONSE_CODES.INTERNALSERVER)
      .json({ status: RESPONSE_CODES.INTERNALSERVER, message: ERROR_MESSAGES.SOMETHING_WENT_WRONG });
  }
};

export const verifyOTP = async (request: Request, response: Response) => {
  try {
    const { email, otp, service } = request.body;

    // 1. Call gRPC service to verify OTP
    const { verifyOtp } = require("../../grpc/client/mail-client");
    const verifyRes = await verifyOtp(email, otp, service || "ONBOARD");

    if (verifyRes.status !== "0" && verifyRes.status !== "200") {
      throw new Api400Error(verifyRes.message || ERROR_MESSAGES.INVALID_OTP);
    }

    // 2. Update user status in DB
    const user = await DbModel.UserRegister.findOne({ where: { email } });
    if (!user) {
      throw new Api400Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    await user.update({ status: "active" });

    const token = await generateToken({
      id: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
    });

    return response.status(RESPONSE_CODES.SUCCESS).json({
      status: RESPONSE_CODES.SUCCESS,
      message: SUCCESS_MESSAGES.USER_VERIFIED_SUCCESSFULLY,
      data: {
        token,
        user: {
          id: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
        },
      },
    });
  } catch (error: any) {
    logger.error("Error in verify OTP.", error);
    if (error instanceof Api400Error) {
      return response.status(RESPONSE_CODES.BAD_REQUEST).json({ status: RESPONSE_CODES.BAD_REQUEST, message: error.message });
    }
    return response
      .status(RESPONSE_CODES.INTERNALSERVER)
      .json({ status: RESPONSE_CODES.INTERNALSERVER, message: ERROR_MESSAGES.SOMETHING_WENT_WRONG });
  }
};

export const sendOTP = async (request: Request, response: Response) => {
  try {
    const { email, service } = request.body;

    // Check if user exists
    const user = await DbModel.UserRegister.findOne({ where: { email } });
    if (!user) {
      throw new Api400Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (service !== "LOGIN" && user.status === "active") {
      throw new Api400Error(ERROR_MESSAGES.REGISTER_ALREADY_DONE);
    }

    const content = { service: service || "ONBOARD" };

    const sendOTPRes = await sendNotification(
      JSON.stringify(content),
      NOTIFICATION_TYPE.EMAIL,
      service || "ONBOARD",
      email,
    );

    if (sendOTPRes.error) {
      throw new Api400Error(sendOTPRes.message as string);
    }

    return response.status(RESPONSE_CODES.SUCCESS).json({
      status: RESPONSE_CODES.SUCCESS,
      message: SUCCESS_MESSAGES.OTP_GENERATED_SUCCESSFULLY,
    });
  } catch (error: any) {
    logger.error("Error in resend OTP.", error);
    if (error instanceof Api400Error) {
      return response.status(RESPONSE_CODES.BAD_REQUEST).json({ status: RESPONSE_CODES.BAD_REQUEST, message: error.message });
    }
    return response
      .status(RESPONSE_CODES.INTERNALSERVER)
      .json({ status: RESPONSE_CODES.INTERNALSERVER, message: ERROR_MESSAGES.SOMETHING_WENT_WRONG });
  }
};

export const login = async (request: Request, response: Response) => {
  try {
    const { email, password } = request.body;
    const user = await DbModel.UserRegister.findOne({ where: { email } });
    if (!user) {
      throw new Api400Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Api400Error(
        ERROR_MESSAGES.INVALID_CREDENTIALS || "Invalid credentials",
      );
    }
    const content = { service: "LOGIN" };
    const sendOTPRes = await sendNotification(
      JSON.stringify(content),
      NOTIFICATION_TYPE.EMAIL,
      "LOGIN",
      email,
    );

    if (sendOTPRes.error) {
      throw new Api400Error(sendOTPRes.message as string);
    }

    return response.status(RESPONSE_CODES.SUCCESS).json({
      status: RESPONSE_CODES.SUCCESS,
      message: SUCCESS_MESSAGES.CREDENTIALS_VERIFIED,
      data: {
        requiresOtp: true,
        email,
      },
    });
  } catch (error: any) {
    logger.error("Error in login.", error);
    if (error instanceof Api400Error) {
      return response.status(RESPONSE_CODES.BAD_REQUEST).json({ status: RESPONSE_CODES.BAD_REQUEST, message: error.message });
    }
    return response
      .status(RESPONSE_CODES.INTERNALSERVER)
      .json({ status: RESPONSE_CODES.INTERNALSERVER, message: ERROR_MESSAGES.SOMETHING_WENT_WRONG });
  }
};

export const logout = async (request: AuthRequest, response: Response) => {
  try {
    const { redisClient, connectRedis } = require("../../utils/redis");
    console.log("DebugRedis>>>>>>>>>>>", request.user);
    if (request.user && request.user.id) {
      await connectRedis();
      await redisClient.del(`auth:${request.user.id}`);
    }
    return response.status(RESPONSE_CODES.SUCCESS).json({
      status: RESPONSE_CODES.SUCCESS,
      message:
        SUCCESS_MESSAGES.LOGOUT_SUCCESSFULLY || "Logged out successfully",
    });
  } catch (error: any) {
    logger.error("Error in logout.", error);
    return response
      .status(RESPONSE_CODES.INTERNALSERVER)
      .json({ status: RESPONSE_CODES.INTERNALSERVER, message: ERROR_MESSAGES.SOMETHING_WENT_WRONG });
  }
};
