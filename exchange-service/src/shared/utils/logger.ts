/**
 * Shared Logger Utility
 * Simple console-based logger that works without any npm dependencies.
 * Each service has its own winston-based logger in src/utils/logger.ts
 */
const logger = {
  info: (message: string, meta?: unknown) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta ?? "");
  },
  error: (message: string, meta?: unknown) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta ?? "");
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta ?? "");
  },
  debug: (message: string, meta?: unknown) => {
    console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta ?? "");
  },
};

export { logger };
export default logger;
