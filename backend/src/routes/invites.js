import { Router } from 'express';
import { z } from 'zod';
import db from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { inviteLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { sendInviteSMS } from '../services/twilioService.js';
import { sendPushNotification } from '../services/pushService.js';
import env from '../config/env.js';

const router = Router();

// Validation schemas
const createInviteSchema = z.object({
  activityType: z.string().max(50).optional(),
  activityName: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  proposedDate: z.string().optional(), // ISO date string
  proposedTime: z.string().max(50).optional(),
  message: z.string().max(500).optional(),
  recipientIds: z.array(z.string().uuid()).min(1)
});

const respondSchema = z.object({
  response: z.enum(['accepted', 'declined'])
});

/**
 * GET /api/invites
 * Get all invites (sent and received) for current household
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  // Get invites created by this household
  const sentInvites = await db('invites')
    .where({ created_by_household_id: req.household.id })
    .orderBy('created_at', 'desc');

  // Get invites received by this household
  const receivedInvites = await db('invite_recipients')
    .join('invites', 'invite_recipients.invite_id', 'invites.id')
    .where({ 'invite_recipients.household_id': req.household.id })
    .select('invites.*', 'invite_recipients.response', 'invite_recipients.responded_at')
    .orderBy('invites.created_at', 'desc');

  // Format invites with recipients/creator info
  const formatInvite = async (invite, type) => {
    let recipients = [];
    let creator = null;

    if (type === 'sent') {
      // Get recipients with their responses
      recipients = await db('invite_recipients')
        .leftJoin('households', 'invite_recipients.household_id', 'households.id')
        .where({ invite_id: invite.id })
        .select(
          'invite_recipients.*',
          'households.name as household_name'
        );
    } else {
      // Get creator info
      const creatorHousehold = await db('households')
        .where({ id: invite.created_by_household_id })
        .first();
      creator = creatorHousehold ? {
        id: creatorHousehold.id,
        name: creatorHousehold.name
      } : null;
    }

    return {
      id: invite.id,
      type,
      activityType: invite.activity_type,
      activityName: invite.activity_name,
      location: invite.location,
      proposedDate: invite.proposed_date,
      proposedTime: invite.proposed_time,
      message: invite.message,
      status: invite.status,
      createdAt: invite.created_at,
      ...(type === 'sent' && { recipients }),
      ...(type === 'received' && {
        creator,
        myResponse: invite.response,
        respondedAt: invite.responded_at
      })
    };
  };

  const sent = await Promise.all(sentInvites.map(i => formatInvite(i, 'sent')));
  const received = await Promise.all(receivedInvites.map(i => formatInvite(i, 'received')));

  res.json({ sent, received });
}));

/**
 * POST /api/invites
 * Create a new invite
 */
router.post('/', authenticate, inviteLimiter, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const data = createInviteSchema.parse(req.body);

  // Create invite
  const [invite] = await db('invites')
    .insert({
      created_by_household_id: req.household.id,
      activity_type: data.activityType,
      activity_name: data.activityName,
      location: data.location,
      proposed_date: data.proposedDate,
      proposed_time: data.proposedTime,
      message: data.message,
      status: 'pending'
    })
    .returning('*');

  // Get contacts for recipients
  const contacts = await db('contacts')
    .whereIn('id', data.recipientIds)
    .where({ owner_household_id: req.household.id });

  const io = req.app.get('io');

  // Add recipients and send notifications
  for (const contact of contacts) {
    // Add recipient record
    if (contact.linked_household_id) {
      await db('invite_recipients').insert({
        invite_id: invite.id,
        household_id: contact.linked_household_id
      });

      // Send in-app notification via socket
      io.to(`household:${contact.linked_household_id}`).emit('invite:new', {
        invite: {
          id: invite.id,
          activityName: invite.activity_name || 'hang out',
          proposedDate: invite.proposed_date,
          proposedTime: invite.proposed_time
        },
        from: {
          id: req.household.id,
          name: req.household.name
        }
      });

      // Send push notification
      const recipientUser = await db('household_members')
        .join('users', 'household_members.user_id', 'users.id')
        .where({ household_id: contact.linked_household_id, is_primary: true })
        .first();

      if (recipientUser?.push_subscription) {
        await sendPushNotification(
          JSON.parse(recipientUser.push_subscription),
          {
            title: 'New invite!',
            body: `${req.household.name} wants to ${invite.activity_name || 'hang out'}`,
            data: { type: 'invite', inviteId: invite.id }
          }
        );
      }
    } else if (contact.phone) {
      // Send SMS to non-app user
      const inviteLink = `${env.FRONTEND_URL}?invite=${invite.id}&phone=${encodeURIComponent(contact.phone)}`;
      await sendInviteSMS(contact.phone, req.household.name, inviteLink);
    }
  }

  // Return created invite
  const recipients = await db('invite_recipients')
    .leftJoin('households', 'invite_recipients.household_id', 'households.id')
    .where({ invite_id: invite.id })
    .select('invite_recipients.*', 'households.name as household_name');

  res.status(201).json({
    id: invite.id,
    type: 'sent',
    activityType: invite.activity_type,
    activityName: invite.activity_name,
    location: invite.location,
    proposedDate: invite.proposed_date,
    proposedTime: invite.proposed_time,
    message: invite.message,
    status: invite.status,
    createdAt: invite.created_at,
    recipients
  });
}));

/**
 * PUT /api/invites/:id/respond
 * Respond to an invite
 */
router.put('/:id/respond', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const { response } = respondSchema.parse(req.body);

  // Find the recipient record
  const recipient = await db('invite_recipients')
    .where({
      invite_id: req.params.id,
      household_id: req.household.id
    })
    .first();

  if (!recipient) {
    throw new AppError('Invite not found', 404);
  }

  // Update response
  await db('invite_recipients')
    .where({
      invite_id: req.params.id,
      household_id: req.household.id
    })
    .update({
      response,
      responded_at: new Date()
    });

  // Get invite and creator info
  const invite = await db('invites')
    .where({ id: req.params.id })
    .first();

  const io = req.app.get('io');

  // Notify invite creator via socket
  io.to(`household:${invite.created_by_household_id}`).emit('invite:response', {
    inviteId: invite.id,
    householdId: req.household.id,
    householdName: req.household.name,
    response
  });

  // Send push notification to creator
  const creatorUser = await db('household_members')
    .join('users', 'household_members.user_id', 'users.id')
    .where({ household_id: invite.created_by_household_id, is_primary: true })
    .first();

  if (creatorUser?.push_subscription) {
    await sendPushNotification(
      JSON.parse(creatorUser.push_subscription),
      {
        title: `${req.household.name} ${response}!`,
        body: `Your invite was ${response}`,
        data: { type: 'invite_response', inviteId: invite.id }
      }
    );
  }

  res.json({ message: `Invite ${response}` });
}));

/**
 * DELETE /api/invites/:id
 * Cancel/delete an invite (creator only)
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  if (!req.household) {
    throw new AppError('No household found', 404);
  }

  const deleted = await db('invites')
    .where({
      id: req.params.id,
      created_by_household_id: req.household.id
    })
    .delete();

  if (!deleted) {
    throw new AppError('Invite not found', 404);
  }

  res.json({ message: 'Invite cancelled' });
}));

export default router;
