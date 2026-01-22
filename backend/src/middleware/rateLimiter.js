import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Auth rate limiter (stricter)
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * OTP rate limiter (very strict)
 * 3 OTP requests per hour per IP
 */
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many OTP requests, please try again in an hour' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Invite rate limiter
 * 20 invites per hour per user
 */
export const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Too many invites sent, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip
});

/**
 * Admin login rate limiter (strict)
 * 5 attempts per 15 minutes per IP
 */
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many admin login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Admin setup rate limiter (very strict)
 * Only 3 attempts per hour - setup should only happen once
 */
export const adminSetupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many setup attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  generalLimiter,
  authLimiter,
  otpLimiter,
  inviteLimiter,
  adminAuthLimiter,
  adminSetupLimiter
};
