import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import Api400Error from "../exception/api400Error";
import { ERROR_MESSAGES } from "../../constants/messages";
import { RESPONSE_CODES } from "../../constants/statusCode";
import { redisClient, connectRedis } from "../../../shared/utils/redis";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Api400Error(ERROR_MESSAGES.TOKEN_MISSING);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      throw new Api400Error(ERROR_MESSAGES.INVALID_TOKEN);
    }

    // Verify token in Redis
    await connectRedis();
    const storedToken = await redisClient.get(`auth:${decoded.id}`);
    if (storedToken !== token) {
      throw new Api400Error(ERROR_MESSAGES.INVALID_SESSION);
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error instanceof Api400Error) {
      return res
        .status(RESPONSE_CODES.UNAUTHORIZED)
        .json({ status: RESPONSE_CODES.UNAUTHORIZED, message: error.message });
    }
    return res.status(RESPONSE_CODES.INTERNALSERVER).json({
      status: RESPONSE_CODES.INTERNALSERVER,
      message: ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    });
  }
};
