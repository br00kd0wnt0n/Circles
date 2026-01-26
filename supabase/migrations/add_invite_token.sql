-- Add invite_token column to contacts table for invite link flow
-- Run this migration in Supabase SQL Editor

-- Add the invite_token column
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS invite_token UUID DEFAULT NULL;

-- Create an index for fast lookup by invite token
CREATE INDEX IF NOT EXISTS idx_contacts_invite_token
ON contacts(invite_token)
WHERE invite_token IS NOT NULL;

-- Update existing contacts to have invite tokens (optional - new contacts will get them automatically)
-- Uncomment if you want to generate tokens for existing contacts:
-- UPDATE contacts SET invite_token = uuid_generate_v4() WHERE invite_token IS NULL AND is_app_user = FALSE;
