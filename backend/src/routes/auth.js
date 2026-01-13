import { Router } from 'express';
import { z } from 'zod';
import db from '../config/database.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { sendOTP, verifyOTP } from '../services/twilioService.js';

const router = Router();

// Validation schemas
const phoneSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Invalid phone number format (E.164 required)')
});

const verifySchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
  code: z.string().length(6, 'OTP must be 6 digits')
});

/**
 * POST /api/auth/request-otp
 * Request OTP code sent via SMS
 */
router.post('/request-otp', otpLimiter, asyncHandler(async (req, res) => {
  const { phone } = phoneSchema.parse(req.body);

  // Send OTP via Twilio
  const result = await sendOTP(phone);

  if (!result.success) {
    throw new AppError('Failed to send OTP', 500);
  }

  res.json({
    message: 'OTP sent successfully',
    phone: phone.slice(0, -4) + '****' // Mask phone in response
  });
}));

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return JWT token
 */
router.post('/verify-otp', authLimiter, asyncHandler(async (req, res) => {
  const { phone, code } = verifySchema.parse(req.body);

  // Verify OTP via Twilio
  const verified = await verifyOTP(phone, code);

  if (!verified) {
    throw new AppError('Invalid or expired OTP', 401);
  }

  // Find or create user
  let user = await db('users').where({ phone }).first();

  if (!user) {
    // Create new user
    const [newUser] = await db('users')
      .insert({
        phone,
        phone_verified: true
      })
      .returning('*');
    user = newUser;
  } else {
    // Update verification status
    await db('users')
      .where({ id: user.id })
      .update({ phone_verified: true });
  }

  // Check if user has a household
  const membership = await db('household_members')
    .where({ user_id: user.id, is_primary: true })
    .first();

  // Generate JWT
  const token = generateToken(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      displayName: user.display_name,
      avatarUrl: user.avatar_url
    },
    hasHousehold: !!membership,
    isNewUser: !membership
  });
}));

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const { user, household } = req;

  // Get household members if exists
  let members = [];
  if (household) {
    members = await db('household_members')
      .where({ household_id: household.id })
      .orderBy('is_primary', 'desc');
  }

  res.json({
    user: {
      id: user.id,
      phone: user.phone,
      displayName: user.display_name,
      avatarUrl: user.avatar_url
    },
    household: household ? {
      id: household.id,
      name: household.name,
      status: {
        state: household.status_state,
        note: household.status_note,
        timeWindow: household.status_time_window
      },
      members
    } : null
  });
}));

/**
 * POST /api/auth/logout
 * Logout (client should discard token)
 */
router.post('/logout', authenticate, (req, res) => {
  // JWT is stateless, so we just acknowledge the logout
  // Client should discard the token
  res.json({ message: 'Logged out successfully' });
});

export default router;
