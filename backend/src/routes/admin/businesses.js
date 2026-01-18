import express from 'express';
import db from '../../config/database.js';
import { adminAuth } from '../../middleware/adminAuth.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

/**
 * GET /api/admin/businesses
 * List all businesses
 */
router.get('/', async (req, res, next) => {
  try {
    const businesses = await db('businesses')
      .orderBy('name', 'asc');

    res.json(businesses);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/businesses/:id
 * Get a single business
 */
router.get('/:id', async (req, res, next) => {
  try {
    const business = await db('businesses')
      .where('id', req.params.id)
      .first();

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(business);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/businesses
 * Create a new business
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, logo_url, address, lat, lng, phone, website, description, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    const [business] = await db('businesses')
      .insert({
        name,
        logo_url,
        address,
        lat,
        lng,
        phone,
        website,
        description,
        is_active: is_active !== false
      })
      .returning('*');

    res.status(201).json(business);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/businesses/:id
 * Update a business
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { name, logo_url, address, lat, lng, phone, website, description, is_active } = req.body;

    const [business] = await db('businesses')
      .where('id', req.params.id)
      .update({
        name,
        logo_url,
        address,
        lat,
        lng,
        phone,
        website,
        description,
        is_active,
        updated_at: new Date()
      })
      .returning('*');

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(business);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/businesses/:id
 * Delete a business
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await db('businesses')
      .where('id', req.params.id)
      .delete();

    if (!deleted) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({ message: 'Business deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
