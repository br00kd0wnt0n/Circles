import { Router } from 'express';
import db from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/events
 * Get upcoming events (public endpoint)
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const events = await db('events')
    .leftJoin('businesses', 'events.business_id', 'businesses.id')
    .where({ 'events.is_active': true })
    .where('events.event_date', '>=', today)
    .select(
      'events.*',
      'businesses.name as business_name',
      'businesses.logo_url as business_logo'
    )
    .orderBy('events.event_date', 'asc')
    .orderBy('events.priority', 'desc');

  const formatted = events.map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    color: e.color,
    imageUrl: e.image_url,
    date: e.event_date,
    time: e.event_time,
    endTime: e.end_time,
    location: e.location,
    lat: e.lat,
    lng: e.lng,
    eventUrl: e.event_url,
    business: e.business_id ? {
      id: e.business_id,
      name: e.business_name,
      logo: e.business_logo
    } : null
  }));

  res.json(formatted);
}));

/**
 * GET /api/events/calendar
 * Get events grouped by date for calendar view
 */
router.get('/calendar', optionalAuth, asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  let query = db('events')
    .leftJoin('businesses', 'events.business_id', 'businesses.id')
    .where({ 'events.is_active': true })
    .select(
      'events.*',
      'businesses.name as business_name',
      'businesses.logo_url as business_logo'
    )
    .orderBy('events.event_date', 'asc')
    .orderBy('events.event_time', 'asc');

  // Filter by month/year if provided
  if (month && year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    query = query
      .where('events.event_date', '>=', startDate)
      .where('events.event_date', '<=', endDate);
  }

  const events = await query;

  // Group by date
  const grouped = events.reduce((acc, e) => {
    const date = e.event_date.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({
      id: e.id,
      title: e.title,
      description: e.description,
      color: e.color,
      time: e.event_time,
      endTime: e.end_time,
      location: e.location,
      business: e.business_id ? {
        id: e.business_id,
        name: e.business_name
      } : null
    });
    return acc;
  }, {});

  res.json(grouped);
}));

/**
 * GET /api/events/:id
 * Get a specific event
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const event = await db('events')
    .leftJoin('businesses', 'events.business_id', 'businesses.id')
    .where({ 'events.id': req.params.id })
    .select(
      'events.*',
      'businesses.name as business_name',
      'businesses.logo_url as business_logo',
      'businesses.address as business_address',
      'businesses.phone as business_phone',
      'businesses.website as business_website'
    )
    .first();

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  res.json({
    id: event.id,
    title: event.title,
    description: event.description,
    color: event.color,
    imageUrl: event.image_url,
    date: event.event_date,
    time: event.event_time,
    endTime: event.end_time,
    location: event.location,
    lat: event.lat,
    lng: event.lng,
    eventUrl: event.event_url,
    business: event.business_id ? {
      id: event.business_id,
      name: event.business_name,
      logo: event.business_logo,
      address: event.business_address,
      phone: event.business_phone,
      website: event.business_website
    } : null
  });
}));

export default router;
