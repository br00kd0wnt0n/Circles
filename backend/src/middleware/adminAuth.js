import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import env from '../config/env.js';

/**
 * Admin authentication middleware
 * Verifies JWT token and attaches admin user to request
 */
export async function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);

      // Verify admin still exists and is active
      const admin = await db('admin_users')
        .where('id', decoded.adminId)
        .where('is_active', true)
        .first();

      if (!admin) {
        return res.status(401).json({ error: 'Admin not found or inactive' });
      }

      req.admin = {
        id: admin.id,
        email: admin.email,
        role: admin.role
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Require specific admin role
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

export default { adminAuth, requireRole };
