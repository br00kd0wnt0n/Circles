import { Router } from 'express';
import { z } from 'zod';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const createCircleSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

const updateCircleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

/**
 * GET /api/circles
 * Get all circles for current household
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const circles = await db('circles')
    .where({ owner_household_id: req.household.id })
    .orderBy('created_at', 'asc');

  // Get member counts for each circle
  const circlesWithCounts = await Promise.all(
    circles.map(async (circle) => {
      const memberCount = await db('circle_members')
        .where({ circle_id: circle.id })
        .count('* as count')
        .first();

      return {
        ...circle,
        memberCount: parseInt(memberCount.count, 10)
      };
    })
  );

  res.json(circlesWithCounts);
}));

/**
 * GET /api/circles/:id
 * Get a specific circle with members
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const circle = await db('circles')
    .where({ id: req.params.id, owner_household_id: req.household.id })
    .first();

  if (!circle) {
    throw new AppError('Circle not found', 404);
  }

  // Get members with their contact/household info
  const members = await db('circle_members')
    .join('contacts', 'circle_members.contact_id', 'contacts.id')
    .leftJoin('households', 'contacts.linked_household_id', 'households.id')
    .where({ 'circle_members.circle_id': circle.id })
    .select(
      'contacts.*',
      'households.name as household_name',
      'households.status_state',
      'households.status_note',
      'households.status_time_window'
    );

  res.json({
    ...circle,
    members
  });
}));

/**
 * POST /api/circles
 * Create a new circle
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const data = createCircleSchema.parse(req.body);

  const [circle] = await db('circles')
    .insert({
      owner_household_id: req.household.id,
      name: data.name,
      color: data.color || '#9CAF88'
    })
    .returning('*');

  res.status(201).json({
    ...circle,
    memberCount: 0
  });
}));

/**
 * PUT /api/circles/:id
 * Update a circle
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const data = updateCircleSchema.parse(req.body);

  const [circle] = await db('circles')
    .where({ id: req.params.id, owner_household_id: req.household.id })
    .update(data)
    .returning('*');

  if (!circle) {
    throw new AppError('Circle not found', 404);
  }

  res.json(circle);
}));

/**
 * DELETE /api/circles/:id
 * Delete a circle
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const deleted = await db('circles')
    .where({ id: req.params.id, owner_household_id: req.household.id })
    .delete();

  if (!deleted) {
    throw new AppError('Circle not found', 404);
  }

  res.json({ message: 'Circle deleted' });
}));

/**
 * POST /api/circles/:id/members
 * Add a contact to a circle
 */
router.post('/:id/members', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const { contactId } = req.body;

  // Verify circle belongs to user
  const circle = await db('circles')
    .where({ id: req.params.id, owner_household_id: req.household.id })
    .first();

  if (!circle) {
    throw new AppError('Circle not found', 404);
  }

  // Verify contact belongs to user
  const contact = await db('contacts')
    .where({ id: contactId, owner_household_id: req.household.id })
    .first();

  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  // Add to circle
  await db('circle_members')
    .insert({
      circle_id: circle.id,
      contact_id: contact.id
    })
    .onConflict(['circle_id', 'contact_id'])
    .ignore();

  res.status(201).json({ message: 'Contact added to circle' });
}));

/**
 * DELETE /api/circles/:id/members/:contactId
 * Remove a contact from a circle
 */
router.delete('/:id/members/:contactId', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const { id, contactId } = req.params;

  // Verify circle belongs to user
  const circle = await db('circles')
    .where({ id, owner_household_id: req.household.id })
    .first();

  if (!circle) {
    throw new AppError('Circle not found', 404);
  }

  await db('circle_members')
    .where({ circle_id: id, contact_id: contactId })
    .delete();

  res.json({ message: 'Contact removed from circle' });
}));

export default router;
