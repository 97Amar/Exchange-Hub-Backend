import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { redisClient, connectRedis } from "../shared/utils/redis";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = (req as any).headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ status: 401, message: "Authorization token missing or invalid" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ status: 401, message: "Invalid or expired token" });
    }

    // Verify token in Redis
    await connectRedis();
    const storedToken = await redisClient.get(`auth:${decoded.id}`);
    if (storedToken !== token) {
      return res.status(401).json({ status: 401, message: "Invalid or expired session" });
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(500).json({ status: 500, message: "Something went wrong" });
  }
};
