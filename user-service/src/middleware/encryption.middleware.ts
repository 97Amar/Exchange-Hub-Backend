import { Request, Response, NextFunction } from "express";
import { decryption, encryption } from "../utils/encryption";

export const encryptionMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const isEncryptionEnabled = process.env.APP_ENCRYPT === "true";
    const secretKey = process.env.APP_ENCRYPT_KEY || "default-secret-key";

    if (!isEncryptionEnabled) {
        return next();
    }

    // 1. Handle Incoming Request Decryption
    // Decrypt reqData from body or query
    if (req.body && req.body.reqData) {
        try {
            const decrypted = decryption(req.body.reqData, secretKey);
            if (decrypted) {
                req.body = JSON.parse(decrypted);
            }
        } catch (err) {
            console.error("Failed to decrypt request body", err);
        }
    }

    if (req.query && req.query.reqData) {
        try {
            const decrypted = decryption(req.query.reqData as string, secretKey);
            if (decrypted) {
                req.query = JSON.parse(decrypted);
            }
        } catch (err) {
            console.error("Failed to decrypt request query", err);
        }
    }

    // 2. Handle Outgoing Response Encryption
    const originalJson = res.json;
    res.json = function (body: any) {
        if (body && body.data) {
            const encryptedData = encryption(body.data, secretKey);
            if (encryptedData) {
                body.data = encryptedData;
            }
        }
        return originalJson.call(this, body);
    };

    next();
};
