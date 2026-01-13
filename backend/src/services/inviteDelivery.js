import { sendPushNotification } from './pushService.js';
import { sendSMS } from './twilioService.js';
import db from '../config/database.js';

/**
 * Deliver an invite to all recipients via their preferred channels
 */
export async function deliverInvite(invite, deliveryMethods = {}) {
  const results = {
    sent: [],
    failed: [],
    pending: []
  };

  // Get invite details
  const inviteDetails = await db('invites')
    .where('id', invite.id)
    .first();

  if (!inviteDetails) {
    throw new Error('Invite not found');
  }

  // Get sender household name
  const sender = await db('households')
    .where('id', inviteDetails.created_by_household_id)
    .first();

  const senderName = sender?.name || 'A friend';

  // Get all recipients
  const recipients = await db('invite_recipients')
    .where('invite_id', invite.id)
    .join('households', 'invite_recipients.household_id', 'households.id')
    .leftJoin('users', 'households.id', 'users.household_id')
    .select(
      'invite_recipients.*',
      'households.name as household_name',
      'users.phone',
      'users.push_subscription'
    );

  // Format invite message
  const title = `New invite from ${senderName}!`;
  const body = formatInviteMessage(inviteDetails);

  for (const recipient of recipients) {
    const method = deliveryMethods[recipient.household_id] || 'in-app';

    try {
      if (method === 'in-app' && recipient.push_subscription) {
        // Send push notification
        const pushResult = await sendPushNotification(
          JSON.parse(recipient.push_subscription),
          {
            title,
            body,
            data: {
              type: 'invite',
              inviteId: invite.id
            },
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            actions: [
              { action: 'accept', title: 'Accept' },
              { action: 'decline', title: 'Decline' }
            ]
          }
        );

        if (pushResult.success) {
          results.sent.push({
            householdId: recipient.household_id,
            method: 'push',
            timestamp: new Date().toISOString()
          });
        } else if (pushResult.expired) {
          // Subscription expired, fall back to SMS if available
          if (recipient.phone) {
            await deliverViaSMS(recipient, title, body, invite.id, results);
          } else {
            results.failed.push({
              householdId: recipient.household_id,
              method: 'push',
              error: 'Subscription expired, no phone fallback'
            });
          }
        } else {
          results.failed.push({
            householdId: recipient.household_id,
            method: 'push',
            error: pushResult.error
          });
        }
      } else if (method === 'sms' && recipient.phone) {
        await deliverViaSMS(recipient, title, body, invite.id, results);
      } else if (method === 'in-app' && !recipient.push_subscription) {
        // No push subscription, try SMS fallback
        if (recipient.phone) {
          await deliverViaSMS(recipient, title, body, invite.id, results);
        } else {
          results.pending.push({
            householdId: recipient.household_id,
            reason: 'No delivery method available'
          });
        }
      }
    } catch (error) {
      console.error(`Failed to deliver to ${recipient.household_id}:`, error);
      results.failed.push({
        householdId: recipient.household_id,
        method,
        error: error.message
      });
    }
  }

  // Log delivery results
  await db('invite_delivery_logs').insert({
    invite_id: invite.id,
    results: JSON.stringify(results),
    created_at: new Date()
  });

  return results;
}

async function deliverViaSMS(recipient, title, body, inviteId, results) {
  const smsMessage = `${title}\n\n${body}\n\nView in Circles: https://circles.app/invite/${inviteId}`;

  const smsResult = await sendSMS(recipient.phone, smsMessage);

  if (smsResult.success) {
    results.sent.push({
      householdId: recipient.household_id,
      method: 'sms',
      messageId: smsResult.messageId,
      timestamp: new Date().toISOString()
    });
  } else {
    results.failed.push({
      householdId: recipient.household_id,
      method: 'sms',
      error: smsResult.error
    });
  }
}

function formatInviteMessage(invite) {
  const parts = [];

  if (invite.activity_name && invite.activity_name !== 'No specific plan') {
    parts.push(invite.activity_name);
  }

  if (invite.proposed_date) {
    parts.push(`on ${invite.proposed_date}`);
  }

  if (invite.proposed_time) {
    parts.push(`at ${invite.proposed_time}`);
  }

  if (parts.length === 0) {
    return 'Wants to hang out soon!';
  }

  return parts.join(' ');
}

/**
 * Send an app invite via SMS to non-app users
 */
export async function sendAppInvite(phone, senderName) {
  const message = `${senderName} invited you to Circles! Download the app to coordinate hangouts with friends and family: https://circles.app/download`;

  return sendSMS(phone, message);
}

export default {
  deliverInvite,
  sendAppInvite
};
