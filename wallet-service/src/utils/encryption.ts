import CryptoJS from "crypto-js";

/**
 * AES Decryption
 * @param ciphertext - The encrypted string
 * @param secretKey - The key used for decryption
 * @returns The decrypted string or null
 */
export const decryption = (ciphertext: string, secretKey: string): string | null => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        return decryptedData || null;
    } catch (error) {
        console.error("Decryption Error:", error);
        return null;
    }
};

/**
 * AES Encryption
 * @param data - The raw object or string to encrypt
 * @param secretKey - The key used for encryption
 * @returns The encrypted string or null
 */
export const encryption = (data: any, secretKey: string): string | null => {
    try {
        const jsonString = typeof data === "string" ? data : JSON.stringify(data);
        const ciphertext = CryptoJS.AES.encrypt(jsonString, secretKey).toString();
        return ciphertext || null;
    } catch (error) {
        console.error("Encryption Error:", error);
        return null;
    }
};
