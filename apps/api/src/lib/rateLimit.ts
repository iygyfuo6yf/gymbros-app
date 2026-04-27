import rateLimit from 'express-rate-limit';
import { toApiError } from './apiError.js';

function buildRateLimit(max: number) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(toApiError(429, 'RATE_LIMITED', 'Too many requests, please try again later'));
    }
  });
}

export const authRateLimiter = buildRateLimit(20);
export const mealAnalysisRateLimiter = buildRateLimit(30);
export const mealUploadRateLimiter = buildRateLimit(20);
