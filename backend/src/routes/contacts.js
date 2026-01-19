import { Router } from 'express';
import { z } from 'zod';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { sendAppInviteSMS } from '../services/twilioService.js';
import env from '../config/env.js';

const router = Router();

// Validation schemas
const createContactSchema = z.object({
  displayName: z.string().min(1).max(100),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/).optional(),
  avatar: z.string().max(10).optional(),
  circleIds: z.array(z.string().uuid()).optional()
});

const importContactsSchema = z.object({
  contacts: z.array(z.object({
    displayName: z.string().min(1).max(100),
    phone: z.string().regex(/^\+[1-9]\d{6,14}$/)
  }))
});

/**
 * GET /api/contacts
 * Get all contacts for current household with their status
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const contacts = await db('contacts')
    .leftJoin('households', 'contacts.linked_household_id', 'households.id')
    .where({ 'contacts.owner_household_id': req.household.id })
    .select(
      'contacts.*',
      'households.name as household_name',
      'households.status_state',
      'households.status_note',
      'households.status_time_window',
      'households.status_updated_at'
    )
    .orderBy('contacts.display_name', 'asc');

  // Get circles for each contact
  const contactsWithCircles = await Promise.all(
    contacts.map(async (contact) => {
      const circles = await db('circle_members')
        .join('circles', 'circle_members.circle_id', 'circles.id')
        .where({ 'circle_members.contact_id': contact.id })
        .select('circles.id', 'circles.name', 'circles.color');

      return {
        id: contact.id,
        displayName: contact.display_name,
        phone: contact.phone,
        avatar: contact.avatar,
        isAppUser: contact.is_app_user,
        linkedHouseholdId: contact.linked_household_id,
        householdName: contact.household_name,
        status: contact.linked_household_id ? {
          state: contact.status_state,
          note: contact.status_note,
          timeWindow: contact.status_time_window,
          updatedAt: contact.status_updated_at
        } : null,
        circles
      };
    })
  );

  res.json(contactsWithCircles);
}));

/**
 * POST /api/contacts
 * Add a new contact
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const data = createContactSchema.parse(req.body);

  // Check if this phone belongs to an existing user
  let linkedHouseholdId = null;
  let isAppUser = false;

  if (data.phone) {
    const existingUser = await db('users')
      .where({ phone: data.phone })
      .first();

    if (existingUser) {
      const membership = await db('household_members')
        .where({ user_id: existingUser.id, is_primary: true })
        .first();

      if (membership) {
        linkedHouseholdId = membership.household_id;
        isAppUser = true;
      }
    }
  }

  // Create contact
  const [contact] = await db('contacts')
    .insert({
      owner_household_id: req.household.id,
      display_name: data.displayName,
      phone: data.phone,
      avatar: data.avatar,
      linked_household_id: linkedHouseholdId,
      is_app_user: isAppUser
    })
    .returning('*');

  // Add to circles if specified
  if (data.circleIds && data.circleIds.length > 0) {
    const circleMemberships = data.circleIds.map(circleId => ({
      circle_id: circleId,
      contact_id: contact.id
    }));
    await db('circle_members').insert(circleMemberships);
  }

  res.status(201).json({
    id: contact.id,
    displayName: contact.display_name,
    phone: contact.phone,
    avatar: contact.avatar,
    isAppUser: contact.is_app_user,
    linkedHouseholdId: contact.linked_household_id
  });
}));

/**
 * POST /api/contacts/import
 * Bulk import contacts from phone
 */
router.post('/import', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const { contacts } = importContactsSchema.parse(req.body);

  const results = {
    imported: 0,
    skipped: 0,
    matched: 0
  };

  for (const contact of contacts) {
    // Check if already exists
    const existing = await db('contacts')
      .where({
        owner_household_id: req.household.id,
        phone: contact.phone
      })
      .first();

    if (existing) {
      results.skipped++;
      continue;
    }

    // Check if phone belongs to existing user
    let linkedHouseholdId = null;
    let isAppUser = false;

    const existingUser = await db('users')
      .where({ phone: contact.phone })
      .first();

    if (existingUser) {
      const membership = await db('household_members')
        .where({ user_id: existingUser.id, is_primary: true })
        .first();

      if (membership) {
        linkedHouseholdId = membership.household_id;
        isAppUser = true;
        results.matched++;
      }
    }

    // Create contact
    await db('contacts').insert({
      owner_household_id: req.household.id,
      display_name: contact.displayName,
      phone: contact.phone,
      linked_household_id: linkedHouseholdId,
      is_app_user: isAppUser
    });

    results.imported++;
  }

  res.json(results);
}));

/**
 * POST /api/contacts/:id/invite-to-app
 * Send app invitation SMS to contact
 */
router.post('/:id/invite-to-app', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const contact = await db('contacts')
    .where({ id: req.params.id, owner_household_id: req.household.id })
    .first();

  if (!contact) {
    throw new AppError('Contact not found', 404);
  }

  if (!contact.phone) {
    throw new AppError('Contact has no phone number', 400);
  }

  if (contact.is_app_user) {
    throw new AppError('Contact is already an app user', 400);
  }

  // Generate signup link
  const signupLink = `${env.FRONTEND_URL}?invite=app&ref=${req.household.id}`;

  // Send SMS
  const result = await sendAppInviteSMS(
    contact.phone,
    req.household.name,
    signupLink
  );

  if (!result.success) {
    throw new AppError('Failed to send invite', 500);
  }

  res.json({ message: 'Invite sent successfully' });
}));

/**
 * PUT /api/contacts/:id
 * Update a contact
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const { displayName, avatar } = req.body;

  const updateData = { updated_at: new Date() };
  if (displayName !== undefined) updateData.display_name = displayName;
  if (avatar !== undefined) updateData.avatar = avatar;

  const [updated] = await db('contacts')
    .where({ id: req.params.id, owner_household_id: req.household.id })
    .update(updateData)
    .returning('*');

  if (!updated) {
    throw new AppError('Contact not found', 404);
  }

  // Get circles for this contact
  const circles = await db('circle_members')
    .join('circles', 'circle_members.circle_id', 'circles.id')
    .where({ 'circle_members.contact_id': updated.id })
    .select('circles.id', 'circles.name', 'circles.color');

  res.json({
    id: updated.id,
    displayName: updated.display_name,
    phone: updated.phone,
    avatar: updated.avatar,
    isAppUser: updated.is_app_user,
    linkedHouseholdId: updated.linked_household_id,
    circles
  });
}));

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const deleted = await db('contacts')
    .where({ id: req.params.id, owner_household_id: req.household.id })
    .delete();

  if (!deleted) {
    throw new AppError('Contact not found', 404);
  }

  res.json({ message: 'Contact deleted' });
}));

export default router;
