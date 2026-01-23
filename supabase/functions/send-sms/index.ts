/**
 * Supabase Edge Function: send-sms
 *
 * Sends SMS notifications via Twilio for:
 * - Invite notifications to friends
 * - Status change alerts
 *
 * Environment variables required:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  to: string
  message: string
  type: 'invite' | 'status_update' | 'general'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client to verify the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const { to, message, type }: SMSRequest = await req.json()

    if (!to || !message) {
      throw new Error('Missing required fields: to, message')
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/
    if (!phoneRegex.test(to.replace(/\D/g, ''))) {
      throw new Error('Invalid phone number format')
    }

    // Get Twilio credentials from environment
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured')
    }

    // Format phone number (ensure it has country code)
    let formattedTo = to.replace(/\D/g, '')
    if (!formattedTo.startsWith('1') && formattedTo.length === 10) {
      formattedTo = '1' + formattedTo
    }
    formattedTo = '+' + formattedTo

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      },
      body: new URLSearchParams({
        To: formattedTo,
        From: fromNumber,
        Body: message,
      }),
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioData)
      throw new Error(twilioData.message || 'Failed to send SMS')
    }

    // Log the SMS send (optional - for analytics)
    await supabaseClient.from('sms_logs').insert({
      user_id: user.id,
      to_phone: formattedTo.slice(-4).padStart(formattedTo.length, '*'), // Masked for privacy
      message_type: type,
      twilio_sid: twilioData.sid,
      status: twilioData.status,
    }).select().single()

    return new Response(
      JSON.stringify({
        success: true,
        messageId: twilioData.sid,
        status: twilioData.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending SMS:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 400,
      }
    )
  }
})
