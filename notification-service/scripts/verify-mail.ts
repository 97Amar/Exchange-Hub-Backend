import { getPendingEmails } from "../src/modules/mail/mail.helper";
import db from "../models";
import logger from "../src/utils/logger";

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
    const pendingCount = await db.OtpNotification.count({ where: { status: 'PENDING' } });
    console.log(`Initial Pending Count: ${pendingCount}`);

    // 2. Process
    console.log("Processing pending emails...");
    await getPendingEmails();

    // 3. Check results
    const sentCount = await db.OtpNotification.count({ where: { status: 'SENT' } });
    const remainingPending = await db.OtpNotification.count({ where: { status: 'PENDING' } });
    
    console.log(`Final Sent Count: ${sentCount}`);
    console.log(`Remaining Pending Count: ${remainingPending}`);

    if (sentCount > 0 && remainingPending === 0) {
      console.log("✅ Verification Successful!");
    } else {
      console.log("⚠️ Verification results were unexpected.");
    }

  } catch (error) {
    console.error("❌ Verification Failed:", error);
  } finally {
    process.exit(0);
  }
}

verify();
