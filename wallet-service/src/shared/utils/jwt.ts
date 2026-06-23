import jwt from "jsonwebtoken";

const JWT_SECRET = (process.env.JWT_SECRET_KEY || "testingsecretkey") as string;
const JWT_ISSUER = (process.env.JWT_ISSUER || "exchange") as string;
const JWT_EXPIRATION = (process.env.JWT_EXPIRATION_TIME || "172800") as string;



export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
