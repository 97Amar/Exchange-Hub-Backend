import { Response } from "express";
import { s3, BUCKET_NAME } from "../../config/s3.config";
import * as DbModel from "../../../models";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../../../constants/messages";
import { RESPONSE_CODES } from "../../../constants/statusCode";
import Api400Error from "../../exception/api400Error";
import logger from "../../utils/logger";
import { AuthRequest } from "../../middleware/auth.middleware";

export const getMyProfile = async (
  request: AuthRequest,
  response: Response,
) => {
  try {
    const user = await DbModel.UserRegister.findOne({
      where: { user_id: request.user.id },
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new Api400Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return response.status(RESPONSE_CODES.SUCCESS).json({
      status: RESPONSE_CODES.SUCCESS,
      message: SUCCESS_MESSAGES.PROFILE_FETCHED,
      data: user,
    });
  } catch (error: any) {
    logger.error('Error in fetching profile.', error);
    if (error instanceof Api400Error) {
      return response.status(RESPONSE_CODES.BAD_REQUEST).json({ status: RESPONSE_CODES.BAD_REQUEST, message: error.message });
    }
    return response.status(RESPONSE_CODES.INTERNALSERVER).json({ status: RESPONSE_CODES.INTERNALSERVER, message: ERROR_MESSAGES.SOMETHING_WENT_WRONG });
  }
};

export const updateMyProfile = async (
  request: AuthRequest,
  response: Response,
) => {
  try {
    const user = await DbModel.UserRegister.findOne({
      where: { user_id: request.user.id }
    });

    if (!user) {
      throw new Api400Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const { firstName, lastName, phone, city, state, country } = request.body;

    let profilePicUrl = user.profile_pic;

    const file = request.file;
    if (file) {
      const params = {
        Bucket: BUCKET_NAME,
        Key: `profiles/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '')}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      
      const uploadResult = await s3.upload(params).promise();
      profilePicUrl = uploadResult.Location;
    }

    await user.update({
      first_name: firstName || user.first_name,
      last_name: lastName !== undefined ? lastName : user.last_name,
      phone: phone !== undefined ? phone : user.phone,
      city: city !== undefined ? city : user.city,
      state: state !== undefined ? state : user.state,
      country: country !== undefined ? country : user.country,
      profile_pic: profilePicUrl
    });

    const userData = user.toJSON();
    delete userData.password;

    return response.status(RESPONSE_CODES.SUCCESS).json({
      status: RESPONSE_CODES.SUCCESS,
      message: SUCCESS_MESSAGES.PROFILE_UPDATED,
      data: userData,
    });
  } catch (error: any) {
    logger.error('Error in updating profile.', error);
    if (error instanceof Api400Error) {
      return response.status(RESPONSE_CODES.BAD_REQUEST).json({ status: RESPONSE_CODES.BAD_REQUEST, message: error.message });
    }
    return response.status(RESPONSE_CODES.INTERNALSERVER).json({ status: RESPONSE_CODES.INTERNALSERVER, message: ERROR_MESSAGES.SOMETHING_WENT_WRONG });
  }
};
