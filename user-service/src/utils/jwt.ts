import jwt from "jsonwebtoken";
import { redisClient, connectRedis } from "../shared/utils/redis";

const JWT_SECRET = process.env.JWT_SECRET_KEY || "testingsecretkey";
const JWT_ISSUER = process.env.JWT_ISSUER || "exchange";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION_TIME || "172800"; // Default 48 hours in seconds

export const generateToken = async (payload: any): Promise<string> => {
  const expiration = parseInt(JWT_EXPIRATION as string);
  const expiresInSeconds = expiration;

  const token = jwt.sign(payload, JWT_SECRET, {
    issuer: JWT_ISSUER,
    expiresIn: expiresInSeconds,
  });

  if (payload.id) {
    await connectRedis();
    await redisClient.set(`auth:${payload.id}`, token, {
      EX: expiresInSeconds,
    });
  }

  return token;
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
