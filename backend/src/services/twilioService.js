import twilio from 'twilio';
import env from '../config/env.js';

// Initialize Twilio client
let client = null;

function getClient() {
  if (!client && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

/**
 * Send OTP via Twilio Verify
 */
export async function sendOTP(phone) {
  const twilioClient = getClient();

  // Development mode - skip actual SMS
  if (env.NODE_ENV === 'development' && !twilioClient) {
    console.log(`[DEV] OTP would be sent to ${phone}`);
    return { success: true, dev: true };
  }

  if (!twilioClient || !env.TWILIO_VERIFY_SERVICE_SID) {
    console.error('Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const verification = await twilioClient.verify.v2
      .services(env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phone,
        channel: 'sms'
      });

    console.log(`OTP sent to ${phone}, status: ${verification.status}`);
    return { success: true, status: verification.status };
  } catch (error) {
    console.error('Twilio send OTP error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verify OTP via Twilio Verify
 */
export async function verifyOTP(phone, code) {
  const twilioClient = getClient();

  // Development mode - accept any 6-digit code
  if (env.NODE_ENV === 'development' && !twilioClient) {
    console.log(`[DEV] OTP verification for ${phone}: ${code}`);
    // Accept "123456" as valid in development
    return code === '123456';
  }

  if (!twilioClient || !env.TWILIO_VERIFY_SERVICE_SID) {
    console.error('Twilio not configured');
    return false;
  }

  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phone,
        code: code
      });

    console.log(`OTP verification for ${phone}: ${verificationCheck.status}`);
    return verificationCheck.status === 'approved';
  } catch (error) {
    console.error('Twilio verify OTP error:', error.message);
    return false;
  }
}

/**
 * Send SMS invite to non-app user
 */
export async function sendInviteSMS(phone, inviterName, inviteLink) {
  const twilioClient = getClient();

  // Development mode
  if (env.NODE_ENV === 'development' && !twilioClient) {
    console.log(`[DEV] Invite SMS to ${phone} from ${inviterName}: ${inviteLink}`);
    return { success: true, dev: true };
  }

  if (!twilioClient || !env.TWILIO_PHONE_NUMBER) {
    console.error('Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const message = await twilioClient.messages.create({
      to: phone,
      from: env.TWILIO_PHONE_NUMBER,
      body: `${inviterName} invited you to hang out via Circles! View and respond: ${inviteLink}

Sent from Circles - Family social coordination made simple.`
    });

    console.log(`Invite SMS sent to ${phone}, SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('Twilio send SMS error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send app invitation SMS
 */
export async function sendAppInviteSMS(phone, inviterName, signupLink) {
  const twilioClient = getClient();

  // Development mode
  if (env.NODE_ENV === 'development' && !twilioClient) {
    console.log(`[DEV] App invite SMS to ${phone} from ${inviterName}: ${signupLink}`);
    return { success: true, dev: true };
  }

  if (!twilioClient || !env.TWILIO_PHONE_NUMBER) {
    console.error('Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const message = await twilioClient.messages.create({
      to: phone,
      from: env.TWILIO_PHONE_NUMBER,
      body: `${inviterName} wants to connect with you on Circles - the easiest way for families to coordinate plans! Join here: ${signupLink}

Sent from Circles`
    });

    console.log(`App invite SMS sent to ${phone}, SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('Twilio send SMS error:', error.message);
    return { success: false, error: error.message };
  }
}

export default {
  sendOTP,
  verifyOTP,
  sendInviteSMS,
  sendAppInviteSMS
};
