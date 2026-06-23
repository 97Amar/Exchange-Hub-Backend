import * as CryptoJS from "crypto-js";

const key = process.env.APP_ENCRYPT_KEY || "default-secret-key";

/**
 * Decrypts an AES encrypted string back to its original value.
 * @param payload The encrypted string
 * @returns Decrypted string or undefined if decryption fails
 */
export function decryption(payload: string): string | undefined {
    try {
        if (payload) {
            const decryptedText = CryptoJS.AES.decrypt(payload, key);
            const decryptData = decryptedText.toString(CryptoJS.enc.Utf8);
            return decryptData || undefined;
        }
    } catch (error) {
        console.error("Decryption error:", error);
        return undefined;
    }
}

/**
 * Encrypts a value to an AES encrypted string.
 * @param payload The value to encrypt
 * @returns Encrypted string or error if encryption fails
 */
export function encryption(payload: any) {
    try {
        if (payload !== undefined && payload !== null) {
            const ciphertext = CryptoJS.AES.encrypt(
                typeof payload === "string" ? payload : JSON.stringify(payload),
                key
            ).toString();
            return ciphertext;
        }
    } catch (error) {
        return error;
    }
}
