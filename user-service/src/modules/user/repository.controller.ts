import { Request, Response } from "express";
import { s3, BUCKET_NAME } from "../../config/s3.config";
import * as DbModel from "../../../models";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../../../constants/messages";
import { RESPONSE_CODES } from "../../../constants/statusCode";
import Api400Error from "../../exception/api400Error";
import logger from "../../utils/logger";
import { AuthRequest } from "../../middleware/auth.middleware";

export const uploadRepository = async (
  request: AuthRequest,
  response: Response,
) => {
  try {
    const file = request.file;
    if (!file) {
      throw new Api400Error(ERROR_MESSAGES.NO_FILE_UPLOADED);
    }

    const { projectName, category, techStack, description, price } = request.body;

    if (!projectName) {
      throw new Api400Error(ERROR_MESSAGES.PROJECT_NAME_REQUIRED);
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: `repositories/${Date.now()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadResult = await s3.upload(params).promise();

    const repository = await DbModel.Repository.create({
      name: projectName,
      category,
      tech_stack: JSON.stringify(techStack),
      description,
      price,
      s3_url: uploadResult.Location,
      user_id: request.user.id
    });

    console.log("DEBUG: Repository uploaded to S3 and saved to DB:", uploadResult.Location);

    return response.status(RESPONSE_CODES.SUCCESS).json({
      status: RESPONSE_CODES.SUCCESS,
      message: SUCCESS_MESSAGES.REPOSITORY_UPLOADED,
      data: {
        id: repository.id,
        url: uploadResult.Location,
        projectName
      },
    });
  } catch (error: any) {
    logger.error('Error in repository upload.', error);
    if (error instanceof Api400Error) {
      return response.status(RESPONSE_CODES.BAD_REQUEST).json({ status: RESPONSE_CODES.BAD_REQUEST, message: error.message });
    }
    return response.status(RESPONSE_CODES.INTERNALSERVER).json({ status: RESPONSE_CODES.INTERNALSERVER, message: ERROR_MESSAGES.SOMETHING_WENT_WRONG });
  }
};

export const getMyRepositories = async (
  request: AuthRequest,
  response: Response,
) => {
  try {
    const repositories = await DbModel.Repository.findAll({
      where: { user_id: request.user.id },
      order: [["created_at", "DESC"]],
    });

    return response.status(RESPONSE_CODES.SUCCESS).json({
      status: RESPONSE_CODES.SUCCESS,
      message: SUCCESS_MESSAGES.REPOSITORIES_FETCHED,
      data: repositories,
    });
  } catch (error: any) {
    logger.error('Error in fetching repositories.', error);
    return response.status(RESPONSE_CODES.INTERNALSERVER).json({ status: RESPONSE_CODES.INTERNALSERVER, message: ERROR_MESSAGES.SOMETHING_WENT_WRONG });
  }
};
