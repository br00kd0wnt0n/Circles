import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import db from '../config/database.js';

/**
 * JWT Authentication Middleware
 * Verifies the JWT token and attaches user to request
 */
export async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Get user from database
    const user = await db('users')
      .where({ id: decoded.userId })
      .first();

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user and household to request
    req.user = user;

    // Get user's household
    const membership = await db('household_members')
      .where({ user_id: user.id, is_primary: true })
      .first();

    if (membership) {
      const household = await db('households')
        .where({ id: membership.household_id })
        .first();
      req.household = household;
      req.householdId = household?.id;
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await db('users')
      .where({ id: decoded.userId })
      .first();

    if (user) {
      req.user = user;

      const membership = await db('household_members')
        .where({ user_id: user.id, is_primary: true })
        .first();

      if (membership) {
        const household = await db('households')
          .where({ id: membership.household_id })
          .first();
        req.household = household;
        req.householdId = household?.id;
      }
    }

    next();
  } catch {
    // Silently continue without auth
    next();
  }
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId) {
  return jwt.sign(
    { userId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export default { authenticate, optionalAuth, generateToken };
