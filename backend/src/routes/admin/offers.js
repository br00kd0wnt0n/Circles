import express from 'express';
import db from '../../config/database.js';
import { adminAuth } from '../../middleware/adminAuth.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

/**
 * GET /api/admin/offers
 * List all offers with business info
 */
router.get('/', async (req, res, next) => {
  try {
    const offers = await db('offers')
      .leftJoin('businesses', 'offers.business_id', 'businesses.id')
      .select(
        'offers.*',
        'businesses.name as business_name'
      )
      .orderBy('offers.created_at', 'desc');

    res.json(offers);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/offers/:id
 * Get a single offer
 */
router.get('/:id', async (req, res, next) => {
  try {
    const offer = await db('offers')
      .leftJoin('businesses', 'offers.business_id', 'businesses.id')
      .where('offers.id', req.params.id)
      .select(
        'offers.*',
        'businesses.name as business_name'
      )
      .first();

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json(offer);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/offers
 * Create a new offer
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      business_id,
      title,
      description,
      color,
      image_url,
      promo_code,
      valid_from,
      valid_until,
      is_active,
      priority
    } = req.body;

    if (!business_id || !title) {
      return res.status(400).json({ error: 'Business ID and title are required' });
    }

    // Verify business exists
    const business = await db('businesses').where('id', business_id).first();
    if (!business) {
      return res.status(400).json({ error: 'Business not found' });
    }

    const [offer] = await db('offers')
      .insert({
        business_id,
        title,
        description,
        color: color || '#9CAF88',
        image_url,
        promo_code,
        valid_from,
        valid_until,
        is_active: is_active !== false,
        priority: priority || 0
      })
      .returning('*');

    res.status(201).json(offer);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/offers/:id
 * Update an offer
 */
router.put('/:id', async (req, res, next) => {
  try {
    const {
      business_id,
      title,
      description,
      color,
      image_url,
      promo_code,
      valid_from,
      valid_until,
      is_active,
      priority
    } = req.body;

    const [offer] = await db('offers')
      .where('id', req.params.id)
      .update({
        business_id,
        title,
        description,
        color,
        image_url,
        promo_code,
        valid_from,
        valid_until,
        is_active,
        priority,
        updated_at: new Date()
      })
      .returning('*');

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json(offer);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/offers/:id
 * Delete an offer
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await db('offers')
      .where('id', req.params.id)
      .delete();

    if (!deleted) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json({ message: 'Offer deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
