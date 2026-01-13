import webpush from 'web-push';
import env from '../config/env.js';

// Configure web-push with VAPID keys
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

/**
 * Send a push notification
 */
export async function sendPushNotification(subscription, payload) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    console.log('[DEV] Push notification would be sent:', payload);
    return { success: true, dev: true };
  }

  try {
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    console.log('Push notification sent:', result.statusCode);
    return { success: true, statusCode: result.statusCode };
  } catch (error) {
    console.error('Push notification error:', error.message);

    // Handle expired subscriptions
    if (error.statusCode === 410) {
      return { success: false, expired: true };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Send push to multiple subscriptions
 */
export async function sendPushToMany(subscriptions, payload) {
  const results = await Promise.allSettled(
    subscriptions.map(sub => sendPushNotification(sub, payload))
  );

  return {
    sent: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
    failed: results.filter(r => r.status === 'rejected' || !r.value?.success).length,
    expired: results.filter(r => r.value?.expired).length
  };
}

export default {
  sendPushNotification,
  sendPushToMany
};
