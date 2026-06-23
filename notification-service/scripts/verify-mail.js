"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mail_helper_1 = require("../src/modules/mail/mail.helper");
const models_1 = __importDefault(require("../models"));
const logger_1 = __importDefault(require("../src/utils/logger"));
/**
 * Verification Script
 *
 * 1. Checks for pending notifications.
 * 2. Runs the background processing logic.
 * 3. Verifies that notifications are updated to 'SENT'.
 */
async function verify() {
    try {
        console.log("--- Starting Mail Verification ---");
        // 1. Check pending count
        const pendingCount = await models_1.default.OtpNotification.count({ where: { status: 'PENDING' } });
        console.log(`Initial Pending Count: ${pendingCount}`);
        // 2. Process
        console.log("Processing pending emails...");
        await (0, mail_helper_1.getPendingEmails)();
        // 3. Check results
        const sentCount = await models_1.default.OtpNotification.count({ where: { status: 'SENT' } });
        const remainingPending = await models_1.default.OtpNotification.count({ where: { status: 'PENDING' } });
        console.log(`Final Sent Count: ${sentCount}`);
        console.log(`Remaining Pending Count: ${remainingPending}`);
        if (sentCount > 0 && remainingPending === 0) {
            console.log("✅ Verification Successful!");
        }
        else {
            console.log("⚠️ Verification results were unexpected.");
        }
    }
    catch (error) {
        console.error("❌ Verification Failed:", error);
    }
    finally {
        process.exit(0);
    }
}
verify();
//# sourceMappingURL=verify-mail.js.map