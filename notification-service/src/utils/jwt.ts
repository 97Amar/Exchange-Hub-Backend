import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET_KEY || "testingsecretkey";

export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};
