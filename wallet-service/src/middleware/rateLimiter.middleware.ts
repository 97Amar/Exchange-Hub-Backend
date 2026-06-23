import { Request } from "express";
import rateLimit, {
  ipKeyGenerator,
  RateLimitRequestHandler,
} from "express-rate-limit";
import { RESPONSE_CODES } from "../constants/statusCode";
import { GLOBAL_MESSAGES } from "../constants/messages";

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: any;
  statusCode?: number;
}

const createRateLimiter = (
  options: RateLimiterOptions,
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      status: options.statusCode || 429,
      message: options.message,
    },
    keyGenerator: options.keyGenerator || ipKeyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: options.statusCode || 429,
    // Add Retry-After header to tell clients when they can retry
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  });
};

export const sendOtpRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // 3 requests per window
  message: GLOBAL_MESSAGES.TOO_MANY_REQUESTS,
  statusCode: RESPONSE_CODES.TOOMANYREQ,
  keyGenerator: (req: Request) => {
    const identifier: string =
      req.body?.email ||
      req.body?.to ||
      req.body?.phone ||
      (req as any).userInfo?.userId ||
      "unknown";
    // Use ipKeyGenerator helper for proper IPv6 handling
    const ip = ipKeyGenerator(req as any);
    return `send-otp-${ip}-${identifier}`;
  },
});
