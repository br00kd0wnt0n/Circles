-- ============================================
-- FIX RLS POLICIES - Remove Infinite Recursion
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- This fixes the "infinite recursion detected in policy" error

-- ============================================
-- STEP 1: Drop all existing policies
-- ============================================

-- Drop policies on households
DROP POLICY IF EXISTS "Users can view their households" ON households;
DROP POLICY IF EXISTS "Users can insert households" ON households;
DROP POLICY IF EXISTS "Users can update their households" ON households;
DROP POLICY IF EXISTS "Users can delete their households" ON households;
DROP POLICY IF EXISTS "households_select_policy" ON households;
DROP POLICY IF EXISTS "households_insert_policy" ON households;
DROP POLICY IF EXISTS "households_update_policy" ON households;
DROP POLICY IF EXISTS "households_delete_policy" ON households;

-- Drop policies on user_households
DROP POLICY IF EXISTS "Users can view their links" ON user_households;
DROP POLICY IF EXISTS "Users can insert their links" ON user_households;
DROP POLICY IF EXISTS "Users can delete their links" ON user_households;
DROP POLICY IF EXISTS "user_households_select_policy" ON user_households;
DROP POLICY IF EXISTS "user_households_insert_policy" ON user_households;
DROP POLICY IF EXISTS "user_households_delete_policy" ON user_households;

-- Drop policies on household_members
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Users can manage household members" ON household_members;
DROP POLICY IF EXISTS "household_members_select_policy" ON household_members;
DROP POLICY IF EXISTS "household_members_insert_policy" ON household_members;
DROP POLICY IF EXISTS "household_members_update_policy" ON household_members;
DROP POLICY IF EXISTS "household_members_delete_policy" ON household_members;

-- Drop policies on household_status
DROP POLICY IF EXISTS "Users can view household status" ON household_status;
DROP POLICY IF EXISTS "Users can manage household status" ON household_status;
DROP POLICY IF EXISTS "household_status_select_policy" ON household_status;
DROP POLICY IF EXISTS "household_status_insert_policy" ON household_status;
DROP POLICY IF EXISTS "household_status_update_policy" ON household_status;

-- Drop policies on contacts
DROP POLICY IF EXISTS "Users can view their contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage their contacts" ON contacts;
DROP POLICY IF EXISTS "contacts_select_policy" ON contacts;
DROP POLICY IF EXISTS "contacts_insert_policy" ON contacts;
DROP POLICY IF EXISTS "contacts_update_policy" ON contacts;
DROP POLICY IF EXISTS "contacts_delete_policy" ON contacts;

-- Drop policies on circles
DROP POLICY IF EXISTS "Users can view their circles" ON circles;
DROP POLICY IF EXISTS "Users can manage their circles" ON circles;
DROP POLICY IF EXISTS "circles_select_policy" ON circles;
DROP POLICY IF EXISTS "circles_insert_policy" ON circles;
DROP POLICY IF EXISTS "circles_update_policy" ON circles;
DROP POLICY IF EXISTS "circles_delete_policy" ON circles;

-- Drop policies on circle_members
DROP POLICY IF EXISTS "Users can view circle members" ON circle_members;
DROP POLICY IF EXISTS "Users can manage circle members" ON circle_members;
DROP POLICY IF EXISTS "circle_members_select_policy" ON circle_members;
DROP POLICY IF EXISTS "circle_members_insert_policy" ON circle_members;
DROP POLICY IF EXISTS "circle_members_delete_policy" ON circle_members;

-- Drop policies on invites
DROP POLICY IF EXISTS "Users can view their invites" ON invites;
DROP POLICY IF EXISTS "Users can create invites" ON invites;
DROP POLICY IF EXISTS "Users can update their invites" ON invites;
DROP POLICY IF EXISTS "invites_select_policy" ON invites;
DROP POLICY IF EXISTS "invites_insert_policy" ON invites;
DROP POLICY IF EXISTS "invites_update_policy" ON invites;

-- Drop policies on invite_recipients
DROP POLICY IF EXISTS "Users can view invite recipients" ON invite_recipients;
DROP POLICY IF EXISTS "Users can manage invite recipients" ON invite_recipients;
DROP POLICY IF EXISTS "invite_recipients_select_policy" ON invite_recipients;
DROP POLICY IF EXISTS "invite_recipients_insert_policy" ON invite_recipients;
DROP POLICY IF EXISTS "invite_recipients_update_policy" ON invite_recipients;

-- Drop policies on offers (if exists)
DROP POLICY IF EXISTS "Anyone can view offers" ON offers;
DROP POLICY IF EXISTS "offers_select_policy" ON offers;

-- Drop policies on events (if exists)
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "events_select_policy" ON events;


-- ============================================
-- STEP 2: Create helper function (SECURITY DEFINER)
-- ============================================
-- This function runs with elevated privileges to break the recursion cycle

CREATE OR REPLACE FUNCTION get_user_household_ids(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id FROM user_households WHERE user_id = user_uuid;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_household_ids(UUID) TO authenticated;


-- ============================================
-- STEP 3: Enable RLS on all tables
-- ============================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_recipients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on offers/events if they exist (optional tables)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers') THEN
    ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;


-- ============================================
-- STEP 4: Create new RLS policies
-- ============================================

-- ----------------------------------------
-- user_households: The foundation table
-- Only checks auth.uid() - NO references to other tables
-- ----------------------------------------

CREATE POLICY "user_households_select"
ON user_households FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_households_insert"
ON user_households FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_households_delete"
ON user_households FOR DELETE
TO authenticated
USING (user_id = auth.uid());


-- ----------------------------------------
-- households: Uses the helper function to avoid recursion
-- ----------------------------------------

CREATE POLICY "households_select"
ON households FOR SELECT
TO authenticated
USING (id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "households_insert"
ON households FOR INSERT
TO authenticated
WITH CHECK (true);  -- Anyone can create, linking is controlled by user_households

CREATE POLICY "households_update"
ON households FOR UPDATE
TO authenticated
USING (id IN (SELECT get_user_household_ids(auth.uid())))
WITH CHECK (id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "households_delete"
ON households FOR DELETE
TO authenticated
USING (id IN (SELECT get_user_household_ids(auth.uid())));


-- ----------------------------------------
-- household_members
-- ----------------------------------------

CREATE POLICY "household_members_select"
ON household_members FOR SELECT
TO authenticated
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "household_members_insert"
ON household_members FOR INSERT
TO authenticated
WITH CHECK (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "household_members_update"
ON household_members FOR UPDATE
TO authenticated
USING (household_id IN (SELECT get_user_household_ids(auth.uid())))
WITH CHECK (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "household_members_delete"
ON household_members FOR DELETE
TO authenticated
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));


-- ----------------------------------------
-- household_status
-- ----------------------------------------

CREATE POLICY "household_status_select"
ON household_status FOR SELECT
TO authenticated
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "household_status_insert"
ON household_status FOR INSERT
TO authenticated
WITH CHECK (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "household_status_update"
ON household_status FOR UPDATE
TO authenticated
USING (household_id IN (SELECT get_user_household_ids(auth.uid())))
WITH CHECK (household_id IN (SELECT get_user_household_ids(auth.uid())));


-- ----------------------------------------
-- contacts
-- ----------------------------------------

CREATE POLICY "contacts_select"
ON contacts FOR SELECT
TO authenticated
USING (owner_household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "contacts_insert"
ON contacts FOR INSERT
TO authenticated
WITH CHECK (owner_household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "contacts_update"
ON contacts FOR UPDATE
TO authenticated
USING (owner_household_id IN (SELECT get_user_household_ids(auth.uid())))
WITH CHECK (owner_household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "contacts_delete"
ON contacts FOR DELETE
TO authenticated
USING (owner_household_id IN (SELECT get_user_household_ids(auth.uid())));


-- ----------------------------------------
-- circles
-- ----------------------------------------

CREATE POLICY "circles_select"
ON circles FOR SELECT
TO authenticated
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "circles_insert"
ON circles FOR INSERT
TO authenticated
WITH CHECK (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "circles_update"
ON circles FOR UPDATE
TO authenticated
USING (household_id IN (SELECT get_user_household_ids(auth.uid())))
WITH CHECK (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "circles_delete"
ON circles FOR DELETE
TO authenticated
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));


-- ----------------------------------------
-- circle_members
-- ----------------------------------------

CREATE POLICY "circle_members_select"
ON circle_members FOR SELECT
TO authenticated
USING (
  circle_id IN (
    SELECT id FROM circles
    WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
  )
);

CREATE POLICY "circle_members_insert"
ON circle_members FOR INSERT
TO authenticated
WITH CHECK (
  circle_id IN (
    SELECT id FROM circles
    WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
  )
);

CREATE POLICY "circle_members_delete"
ON circle_members FOR DELETE
TO authenticated
USING (
  circle_id IN (
    SELECT id FROM circles
    WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
  )
);


-- ----------------------------------------
-- invites: Users can see invites they created or received
-- ----------------------------------------

CREATE POLICY "invites_select"
ON invites FOR SELECT
TO authenticated
USING (
  creator_household_id IN (SELECT get_user_household_ids(auth.uid()))
  OR
  id IN (
    SELECT invite_id FROM invite_recipients
    WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
  )
);

CREATE POLICY "invites_insert"
ON invites FOR INSERT
TO authenticated
WITH CHECK (creator_household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "invites_update"
ON invites FOR UPDATE
TO authenticated
USING (creator_household_id IN (SELECT get_user_household_ids(auth.uid())))
WITH CHECK (creator_household_id IN (SELECT get_user_household_ids(auth.uid())));


-- ----------------------------------------
-- invite_recipients
-- ----------------------------------------

CREATE POLICY "invite_recipients_select"
ON invite_recipients FOR SELECT
TO authenticated
USING (
  household_id IN (SELECT get_user_household_ids(auth.uid()))
  OR
  invite_id IN (
    SELECT id FROM invites
    WHERE creator_household_id IN (SELECT get_user_household_ids(auth.uid()))
  )
);

CREATE POLICY "invite_recipients_insert"
ON invite_recipients FOR INSERT
TO authenticated
WITH CHECK (
  invite_id IN (
    SELECT id FROM invites
    WHERE creator_household_id IN (SELECT get_user_household_ids(auth.uid()))
  )
);

CREATE POLICY "invite_recipients_update"
ON invite_recipients FOR UPDATE
TO authenticated
USING (household_id IN (SELECT get_user_household_ids(auth.uid())))
WITH CHECK (household_id IN (SELECT get_user_household_ids(auth.uid())));


-- ----------------------------------------
-- offers & events: Public read access
-- ----------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers') THEN
    EXECUTE 'CREATE POLICY "offers_public_read" ON offers FOR SELECT TO authenticated, anon USING (true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    EXECUTE 'CREATE POLICY "events_public_read" ON events FOR SELECT TO authenticated, anon USING (true)';
  END IF;
END $$;


-- ============================================
-- STEP 5: Verify policies were created
-- ============================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
