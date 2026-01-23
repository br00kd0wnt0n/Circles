-- ============================================
-- CIRCLES APP DATABASE SCHEMA
-- Supabase Edition with Row Level Security
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Households (families/groups)
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Household mapping (links Supabase auth users to households)
CREATE TABLE IF NOT EXISTS user_households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, household_id)
);

-- Household members (people in a household)
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- optional link to auth user
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('adult', 'child', 'pet')) DEFAULT 'adult',
  avatar TEXT DEFAULT '👤',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household status (availability)
CREATE TABLE IF NOT EXISTS household_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE UNIQUE NOT NULL,
  state TEXT CHECK (state IN ('available', 'open', 'busy')) DEFAULT 'available',
  note TEXT,
  time_window TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts (friends/connections for a household)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  linked_household_id UUID REFERENCES households(id) ON DELETE SET NULL, -- if they're an app user
  display_name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT DEFAULT '👤',
  is_app_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circles (groups of contacts)
CREATE TABLE IF NOT EXISTS circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#9CAF88',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle members (contacts in a circle)
CREATE TABLE IF NOT EXISTS circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, contact_id)
);

-- Invites (hangout invitations)
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  activity_name TEXT,
  activity_type TEXT,
  proposed_date DATE,
  proposed_time TEXT,
  location TEXT,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invite recipients
CREATE TABLE IF NOT EXISTS invite_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_id UUID REFERENCES invites(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL, -- if recipient is app user
  response TEXT CHECK (response IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  UNIQUE(invite_id, contact_id)
);

-- Businesses (for local offers/events)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  zip_code TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers (local deals)
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  promo_code TEXT,
  valid_from DATE,
  valid_until DATE,
  color TEXT DEFAULT '#9CAF88',
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events (local events)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  time TEXT,
  end_time TEXT,
  location TEXT,
  zip_code TEXT,
  color TEXT DEFAULT '#7BA7BC',
  image_url TEXT,
  event_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user's household ID
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS UUID AS $$
  SELECT household_id FROM user_households
  WHERE user_id = auth.uid() AND is_primary = TRUE
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user owns a household
CREATE OR REPLACE FUNCTION user_owns_household(hh_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_households
    WHERE user_id = auth.uid() AND household_id = hh_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
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
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HOUSEHOLDS POLICIES
-- ============================================

CREATE POLICY "Users can view their own household" ON households
  FOR SELECT USING (user_owns_household(id));

CREATE POLICY "Users can create household" ON households
  FOR INSERT WITH CHECK (TRUE); -- Anyone authenticated can create

CREATE POLICY "Users can update their own household" ON households
  FOR UPDATE USING (user_owns_household(id));

-- ============================================
-- USER_HOUSEHOLDS POLICIES
-- ============================================

CREATE POLICY "Users can view their own mappings" ON user_households
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own mapping" ON user_households
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- HOUSEHOLD MEMBERS POLICIES
-- ============================================

CREATE POLICY "Users can view their household members" ON household_members
  FOR SELECT USING (user_owns_household(household_id));

CREATE POLICY "Users can create members in their household" ON household_members
  FOR INSERT WITH CHECK (user_owns_household(household_id));

CREATE POLICY "Users can update their household members" ON household_members
  FOR UPDATE USING (user_owns_household(household_id));

CREATE POLICY "Users can delete their household members" ON household_members
  FOR DELETE USING (user_owns_household(household_id));

-- ============================================
-- HOUSEHOLD STATUS POLICIES
-- ============================================

CREATE POLICY "Users can view own status" ON household_status
  FOR SELECT USING (user_owns_household(household_id));

-- Users can view status of households they have as contacts
CREATE POLICY "Users can view contacts status" ON household_status
  FOR SELECT USING (
    household_id IN (
      SELECT linked_household_id FROM contacts
      WHERE owner_household_id = get_my_household_id()
      AND linked_household_id IS NOT NULL
    )
  );

CREATE POLICY "Users can insert their status" ON household_status
  FOR INSERT WITH CHECK (user_owns_household(household_id));

CREATE POLICY "Users can update their own status" ON household_status
  FOR UPDATE USING (user_owns_household(household_id));

-- ============================================
-- CONTACTS POLICIES
-- ============================================

CREATE POLICY "Users can view their contacts" ON contacts
  FOR SELECT USING (owner_household_id = get_my_household_id());

CREATE POLICY "Users can create contacts" ON contacts
  FOR INSERT WITH CHECK (owner_household_id = get_my_household_id());

CREATE POLICY "Users can update their contacts" ON contacts
  FOR UPDATE USING (owner_household_id = get_my_household_id());

CREATE POLICY "Users can delete their contacts" ON contacts
  FOR DELETE USING (owner_household_id = get_my_household_id());

-- ============================================
-- CIRCLES POLICIES
-- ============================================

CREATE POLICY "Users can view their circles" ON circles
  FOR SELECT USING (owner_household_id = get_my_household_id());

CREATE POLICY "Users can create circles" ON circles
  FOR INSERT WITH CHECK (owner_household_id = get_my_household_id());

CREATE POLICY "Users can update their circles" ON circles
  FOR UPDATE USING (owner_household_id = get_my_household_id());

CREATE POLICY "Users can delete their circles" ON circles
  FOR DELETE USING (owner_household_id = get_my_household_id());

-- ============================================
-- CIRCLE MEMBERS POLICIES
-- ============================================

CREATE POLICY "Users can view their circle members" ON circle_members
  FOR SELECT USING (
    circle_id IN (SELECT id FROM circles WHERE owner_household_id = get_my_household_id())
  );

CREATE POLICY "Users can add to their circles" ON circle_members
  FOR INSERT WITH CHECK (
    circle_id IN (SELECT id FROM circles WHERE owner_household_id = get_my_household_id())
  );

CREATE POLICY "Users can remove from their circles" ON circle_members
  FOR DELETE USING (
    circle_id IN (SELECT id FROM circles WHERE owner_household_id = get_my_household_id())
  );

-- ============================================
-- INVITES POLICIES
-- ============================================

CREATE POLICY "Users can view invites they created" ON invites
  FOR SELECT USING (creator_household_id = get_my_household_id());

CREATE POLICY "Users can view invites they received" ON invites
  FOR SELECT USING (
    id IN (
      SELECT invite_id FROM invite_recipients
      WHERE household_id = get_my_household_id()
    )
  );

CREATE POLICY "Users can create invites" ON invites
  FOR INSERT WITH CHECK (creator_household_id = get_my_household_id());

CREATE POLICY "Users can update their invites" ON invites
  FOR UPDATE USING (creator_household_id = get_my_household_id());

-- ============================================
-- INVITE RECIPIENTS POLICIES
-- ============================================

CREATE POLICY "Invite creators can view recipients" ON invite_recipients
  FOR SELECT USING (
    invite_id IN (SELECT id FROM invites WHERE creator_household_id = get_my_household_id())
  );

CREATE POLICY "Recipients can view their own" ON invite_recipients
  FOR SELECT USING (household_id = get_my_household_id());

CREATE POLICY "Invite creators can add recipients" ON invite_recipients
  FOR INSERT WITH CHECK (
    invite_id IN (SELECT id FROM invites WHERE creator_household_id = get_my_household_id())
  );

CREATE POLICY "Recipients can respond" ON invite_recipients
  FOR UPDATE USING (household_id = get_my_household_id());

-- ============================================
-- PUBLIC DATA POLICIES (Offers, Events, Businesses)
-- ============================================

CREATE POLICY "Anyone can view active businesses" ON businesses
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view active offers" ON offers
  FOR SELECT USING (
    is_active = TRUE
    AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
  );

CREATE POLICY "Anyone can view active events" ON events
  FOR SELECT USING (
    is_active = TRUE
    AND (date IS NULL OR date >= CURRENT_DATE)
  );

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE household_status;
ALTER PUBLICATION supabase_realtime ADD TABLE invites;
ALTER PUBLICATION supabase_realtime ADD TABLE invite_recipients;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_households_user ON user_households(user_id);
CREATE INDEX IF NOT EXISTS idx_user_households_household ON user_households(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_status_household ON household_status(household_id);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_household_id);
CREATE INDEX IF NOT EXISTS idx_contacts_linked ON contacts(linked_household_id);
CREATE INDEX IF NOT EXISTS idx_circles_owner ON circles(owner_household_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_contact ON circle_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_invites_creator ON invites(creator_household_id);
CREATE INDEX IF NOT EXISTS idx_invite_recipients_invite ON invite_recipients(invite_id);
CREATE INDEX IF NOT EXISTS idx_invite_recipients_household ON invite_recipients(household_id);
CREATE INDEX IF NOT EXISTS idx_offers_business ON offers(business_id);
CREATE INDEX IF NOT EXISTS idx_offers_valid ON offers(valid_until) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_business ON events(business_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date) WHERE is_active = TRUE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER circles_updated_at
  BEFORE UPDATE ON circles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER household_status_updated_at
  BEFORE UPDATE ON household_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create status record when household is created
CREATE OR REPLACE FUNCTION create_household_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO household_status (household_id, state)
  VALUES (NEW.id, 'available');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_household_insert
  AFTER INSERT ON households
  FOR EACH ROW EXECUTE FUNCTION create_household_status();

-- ============================================
-- SMS LOGS (for analytics/tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_phone TEXT NOT NULL, -- Masked phone number for privacy
  message_type TEXT CHECK (message_type IN ('invite', 'status_update', 'general')) DEFAULT 'general',
  twilio_sid TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own SMS logs
CREATE POLICY "Users can view own SMS logs" ON sms_logs
  FOR SELECT USING (user_id = auth.uid());

-- Only service role can insert (via Edge Function)
CREATE POLICY "Service role can insert SMS logs" ON sms_logs
  FOR INSERT WITH CHECK (TRUE); -- Edge function runs with service role

CREATE INDEX IF NOT EXISTS idx_sms_logs_user ON sms_logs(user_id);

-- ============================================
-- STORAGE BUCKETS (for avatars, logos, etc.)
-- ============================================

-- Run this in Supabase Dashboard > Storage:
-- CREATE BUCKET avatars WITH (public = true);
-- CREATE BUCKET logos WITH (public = true);
