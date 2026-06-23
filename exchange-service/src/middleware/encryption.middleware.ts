import { Request, Response, NextFunction } from "express";
import { encryption, decryption } from "../utils/encryption";

const IS_ENCRYPTION = process.env.APP_ENCRYPT === "true";

export const encryptionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!IS_ENCRYPTION) {
        return next();
    }

    // 1. Decrypt Request Body
    if (req.body && req.body.reqData && typeof req.body.reqData === "string") {
        const decryptedBody = decryption(req.body.reqData);
        if (decryptedBody) {
            try {
                req.body = JSON.parse(decryptedBody);
            } catch (error) {
                console.error("Failed to parse decrypted body:", error);
                // If it's not JSON, just keep it as string or handle error
            }
        }
    }

    // 1.1 Decrypt Query Params
    if (req.query && req.query.reqData && typeof req.query.reqData === "string") {
        const decryptedQuery = decryption(req.query.reqData as string);
        if (decryptedQuery) {
            try {
                req.query = JSON.parse(decryptedQuery);
            } catch (error) {
                console.error("Failed to parse decrypted query:", error);
            }
        }
    }

    // 2. Intercept Response to Encrypt Data
    const originalJson = res.json;
    res.json = function (body: any) {
        if (body && body.data !== undefined && body.data !== null) {
            // Only encrypt the 'data' field IF it's not already a string (and not an error)
            if (typeof body.data !== "string") {
                const encryptedData = encryption(body.data);
                if (encryptedData && typeof encryptedData === "string") {
                    body.data = encryptedData;
                }
            }
        }
        return originalJson.call(this, body);
    };

    next();
};
