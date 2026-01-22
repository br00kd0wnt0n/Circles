import { Router } from 'express';
import db from '../config/database.js';
import { optionalAuth } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/offers
 * Get all active offers (public endpoint)
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const offers = await db('offers')
    .join('businesses', 'offers.business_id', 'businesses.id')
    .where({ 'offers.is_active': true, 'businesses.is_active': true })
    .where(function() {
      this.whereNull('offers.valid_from')
        .orWhere('offers.valid_from', '<=', today);
    })
    .where(function() {
      this.whereNull('offers.valid_until')
        .orWhere('offers.valid_until', '>=', today);
    })
    .select(
      'offers.*',
      'businesses.name as business_name',
      'businesses.logo_url as business_logo',
      'businesses.address as business_address'
    )
    .orderBy('offers.priority', 'desc')
    .orderBy('offers.created_at', 'desc');

  const formatted = offers.map(o => ({
    id: o.id,
    title: o.title,
    description: o.description,
    color: o.color,
    imageUrl: o.image_url,
    promoCode: o.promo_code,
    validFrom: o.valid_from,
    validUntil: o.valid_until,
    business: {
      id: o.business_id,
      name: o.business_name,
      logo: o.business_logo,
      address: o.business_address
    }
  }));

  res.json(formatted);
}));

/**
 * GET /api/offers/:id
 * Get a specific offer
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const offer = await db('offers')
    .join('businesses', 'offers.business_id', 'businesses.id')
    .where({ 'offers.id': req.params.id })
    .select(
      'offers.*',
      'businesses.name as business_name',
      'businesses.logo_url as business_logo',
      'businesses.address as business_address',
      'businesses.phone as business_phone',
      'businesses.website as business_website',
      'businesses.description as business_description'
    )
    .first();

  if (!offer) {
    throw new AppError('Offer not found', 404);
  }

  res.json({
    id: offer.id,
    title: offer.title,
    description: offer.description,
    color: offer.color,
    imageUrl: offer.image_url,
    promoCode: offer.promo_code,
    validFrom: offer.valid_from,
    validUntil: offer.valid_until,
    business: {
      id: offer.business_id,
      name: offer.business_name,
      logo: offer.business_logo,
      address: offer.business_address,
      phone: offer.business_phone,
      website: offer.business_website,
      description: offer.business_description
    }
  });
}));

export default router;
