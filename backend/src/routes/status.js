import { Router } from 'express';
import { z } from 'zod';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schema
const updateStatusSchema = z.object({
  state: z.enum(['available', 'open', 'busy']),
  note: z.string().max(200).optional().nullable(),
  timeWindow: z.string().max(50).optional().nullable()
});

/**
 * GET /api/status
 * Get status of all contacts (friends' households)
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  // Get all contacts that are app users with their status
  const contactStatuses = await db('contacts')
    .join('households', 'contacts.linked_household_id', 'households.id')
    .where({ 'contacts.owner_household_id': req.household.id })
    .whereNotNull('contacts.linked_household_id')
    .select(
      'contacts.id as contact_id',
      'contacts.display_name',
      'households.id as household_id',
      'households.name as household_name',
      'households.status_state',
      'households.status_note',
      'households.status_time_window',
      'households.status_updated_at'
    );

  const statuses = contactStatuses.map(c => ({
    contactId: c.contact_id,
    displayName: c.display_name,
    householdId: c.household_id,
    householdName: c.household_name,
    status: {
      state: c.status_state,
      note: c.status_note,
      timeWindow: c.status_time_window,
      updatedAt: c.status_updated_at
    }
  }));

  res.json(statuses);
}));

/**
 * PUT /api/status
 * Update current household's status
 */
router.put('/', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const data = updateStatusSchema.parse(req.body);

  // Update status
  const [updated] = await db('households')
    .where({ id: req.household.id })
    .update({
      status_state: data.state,
      status_note: data.note,
      status_time_window: data.timeWindow,
      status_updated_at: new Date()
    })
    .returning('*');

  // Broadcast status update to all contacts who have us as a contact
  const io = req.app.get('io');

  // Find all households that have us as a contact
  const watchers = await db('contacts')
    .where({ linked_household_id: req.household.id })
    .select('owner_household_id');

  // Emit to each watcher's room
  for (const watcher of watchers) {
    io.to(`household:${watcher.owner_household_id}`).emit('status:update', {
      householdId: req.household.id,
      householdName: req.household.name,
      status: {
        state: updated.status_state,
        note: updated.status_note,
        timeWindow: updated.status_time_window,
        updatedAt: updated.status_updated_at
      }
    });
  }

  res.json({
    state: updated.status_state,
    note: updated.status_note,
    timeWindow: updated.status_time_window,
    updatedAt: updated.status_updated_at
  });
}));

/**
 * POST /api/status/subscribe
 * Save push subscription for current user
 */
router.post('/subscribe', authenticate, asyncHandler(async (req, res) => {
  const { subscription } = req.body;

  if (!subscription) {
    throw new AppError('Subscription required', 400);
  }

  // Save subscription to user record
  await db('users')
    .where({ id: req.user.id })
    .update({
      push_subscription: JSON.stringify(subscription)
    });

  res.json({ message: 'Push subscription saved' });
}));

/**
 * DELETE /api/status/subscribe
 * Remove push subscription for current user
 */
router.delete('/subscribe', authenticate, asyncHandler(async (req, res) => {
  await db('users')
    .where({ id: req.user.id })
    .update({
      push_subscription: null
    });

  res.json({ message: 'Push subscription removed' });
}));

export default router;
