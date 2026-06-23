import cron from "node-cron";
import { getPendingEmails } from "../modules/mail/mail.helper";
import { logger } from "../utils/logger";

// Mail Cron Job
// Runs every 30 seconds to check for pending emails and send them.
let isProcessing = false;

const mailCron = cron.schedule("*/10 * * * * *", async () => {
  // Prevent overlapping runs
  if (isProcessing) {
    return;
  }

  try {
    isProcessing = true;
    logger.info("[CRON] ⏰ Checking for pending emails...");
    await getPendingEmails();
  } catch (error) {
    logger.error("[CRON] ❌ Error processing pending emails", error);
  } finally {
    isProcessing = false;
  }
});

export default mailCron;
