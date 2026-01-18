import express from 'express';
import db from '../../config/database.js';
import { adminAuth } from '../../middleware/adminAuth.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

/**
 * GET /api/admin/events
 * List all events with business info
 */
router.get('/', async (req, res, next) => {
  try {
    const events = await db('events')
      .leftJoin('businesses', 'events.business_id', 'businesses.id')
      .select(
        'events.*',
        'businesses.name as business_name'
      )
      .orderBy('events.event_date', 'asc');

    res.json(events);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/events/:id
 * Get a single event
 */
router.get('/:id', async (req, res, next) => {
  try {
    const event = await db('events')
      .leftJoin('businesses', 'events.business_id', 'businesses.id')
      .where('events.id', req.params.id)
      .select(
        'events.*',
        'businesses.name as business_name'
      )
      .first();

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/events
 * Create a new event
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      business_id,
      title,
      description,
      color,
      image_url,
      event_date,
      event_time,
      end_time,
      location,
      lat,
      lng,
      event_url,
      is_active,
      priority
    } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and event date are required' });
    }

    const [event] = await db('events')
      .insert({
        business_id,
        title,
        description,
        color: color || '#9CAF88',
        image_url,
        event_date,
        event_time,
        end_time,
        location,
        lat,
        lng,
        event_url,
        is_active: is_active !== false,
        priority: priority || 0
      })
      .returning('*');

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/events/:id
 * Update an event
 */
router.put('/:id', async (req, res, next) => {
  try {
    const {
      business_id,
      title,
      description,
      color,
      image_url,
      event_date,
      event_time,
      end_time,
      location,
      lat,
      lng,
      event_url,
      is_active,
      priority
    } = req.body;

    const [event] = await db('events')
      .where('id', req.params.id)
      .update({
        business_id,
        title,
        description,
        color,
        image_url,
        event_date,
        event_time,
        end_time,
        location,
        lat,
        lng,
        event_url,
        is_active,
        priority,
        updated_at: new Date()
      })
      .returning('*');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/events/:id
 * Delete an event
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await db('events')
      .where('id', req.params.id)
      .delete();

    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
