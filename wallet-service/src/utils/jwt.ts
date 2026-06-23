import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET_KEY || "testingsecretkey";
const JWT_ISSUER = process.env.JWT_ISSUER || "mountainBank";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION_TIME || "360000000";

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
