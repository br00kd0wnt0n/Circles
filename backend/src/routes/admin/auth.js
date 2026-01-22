import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../config/database.js';
import env from '../../config/env.js';
import { adminAuthLimiter, adminSetupLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Admin login
 * POST /api/admin/auth/login
 */
router.post('/login', adminAuthLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find admin user
    const admin = await db('admin_users')
      .where('email', email.toLowerCase())
      .first();

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get current admin info
 * GET /api/admin/auth/me
 */
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const admin = await db('admin_users')
      .where('id', decoded.adminId)
      .select('id', 'email', 'role')
      .first();

    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    res.json(admin);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(error);
  }
});

/**
 * Create initial admin (only works once)
 * POST /api/admin/auth/setup
 */
router.post('/setup', adminSetupLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if any admin exists
    const existingAdmin = await db('admin_users').first();
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [admin] = await db('admin_users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: 'super_admin',
        created_at: new Date()
      })
      .returning(['id', 'email', 'role']);

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
