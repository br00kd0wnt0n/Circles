import { Router } from 'express';
import { z } from 'zod';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const createHouseholdSchema = z.object({
  name: z.string().min(1).max(100),
  zipCode: z.string().max(10).optional(),
  members: z.array(z.object({
    name: z.string().min(1).max(100),
    role: z.enum(['adult', 'child', 'pet']).optional(),
    avatar: z.string().max(10).optional()
  })).optional()
});

const updateHouseholdSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  zipCode: z.string().max(10).optional()
});

const addMemberSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.enum(['adult', 'child', 'pet']).optional(),
  avatar: z.string().max(10).optional()
});

/**
 * POST /api/households
 * Create a new household (during onboarding)
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { name, zipCode, members = [] } = createHouseholdSchema.parse(req.body);

  // Check if user already has a household
  const existing = await db('household_members')
    .where({ user_id: req.user.id })
    .first();

  if (existing) {
    throw new AppError('User already has a household', 409);
  }

  // Create household
  const insertData = {
    name,
    status_state: 'available'
  };
  if (zipCode) {
    insertData.zip_code = zipCode;
  }

  const [household] = await db('households')
    .insert(insertData)
    .returning('*');

  // Add user as primary member
  const userMember = {
    household_id: household.id,
    user_id: req.user.id,
    name: req.user.display_name || name.replace('The ', '').replace('s', ''),
    role: 'adult',
    is_primary: true
  };

  await db('household_members').insert(userMember);

  // Add additional members
  if (members.length > 0) {
    const additionalMembers = members.map(m => ({
      household_id: household.id,
      name: m.name,
      role: m.role || 'adult',
      avatar: m.avatar,
      is_primary: false
    }));
    await db('household_members').insert(additionalMembers);
  }

  // Fetch all members
  const allMembers = await db('household_members')
    .where({ household_id: household.id })
    .orderBy('is_primary', 'desc');

  const response = {
    id: household.id,
    name: household.name,
    status: {
      state: household.status_state,
      note: household.status_note,
      timeWindow: household.status_time_window
    },
    members: allMembers
  };
  if (household.zip_code) response.zipCode = household.zip_code;

  res.status(201).json(response);
}));

/**
 * GET /api/households/me
 * Get current user's household
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const members = await db('household_members')
    .where({ household_id: req.household.id })
    .orderBy('is_primary', 'desc');

  const response = {
    id: req.household.id,
    name: req.household.name,
    status: {
      state: req.household.status_state,
      note: req.household.status_note,
      timeWindow: req.household.status_time_window
    },
    members
  };
  if (req.household.zip_code) response.zipCode = req.household.zip_code;

  res.json(response);
}));

/**
 * PUT /api/households/me
 * Update current user's household
 */
router.put('/me', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const { name, zipCode } = updateHouseholdSchema.parse(req.body);

  const updateData = { updated_at: new Date() };
  if (name !== undefined) updateData.name = name;
  if (zipCode !== undefined) updateData.zip_code = zipCode;

  const [updated] = await db('households')
    .where({ id: req.household.id })
    .update(updateData)
    .returning('*');

  const members = await db('household_members')
    .where({ household_id: updated.id })
    .orderBy('is_primary', 'desc');

  const response = {
    id: updated.id,
    name: updated.name,
    status: {
      state: updated.status_state,
      note: updated.status_note,
      timeWindow: updated.status_time_window
    },
    members
  };
  if (updated.zip_code) response.zipCode = updated.zip_code;

  res.json(response);
}));

/**
 * POST /api/households/me/members
 * Add a member to current household
 */
router.post('/me/members', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const data = addMemberSchema.parse(req.body);

  const [member] = await db('household_members')
    .insert({
      household_id: req.household.id,
      name: data.name,
      role: data.role || 'adult',
      avatar: data.avatar,
      is_primary: false
    })
    .returning('*');

  res.status(201).json(member);
}));

/**
 * PUT /api/households/me/members/:memberId
 * Update a household member
 */
router.put('/me/members/:memberId', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const { memberId } = req.params;
  const data = addMemberSchema.parse(req.body);

  const [member] = await db('household_members')
    .where({ id: memberId, household_id: req.household.id })
    .update({
      name: data.name,
      role: data.role,
      avatar: data.avatar
    })
    .returning('*');

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  res.json(member);
}));

/**
 * DELETE /api/households/me/members/:memberId
 * Remove a household member
 */
router.delete('/me/members/:memberId', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const { memberId } = req.params;

  // Don't allow removing primary member
  const member = await db('household_members')
    .where({ id: memberId, household_id: req.household.id })
    .first();

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  if (member.is_primary) {
    throw new AppError('Cannot remove primary member', 400);
  }

  await db('household_members')
    .where({ id: memberId })
    .delete();

  res.json({ message: 'Member removed' });
}));

export default router;
