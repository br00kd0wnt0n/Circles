-- ============================================
-- CIRCLES APP DATABASE SCHEMA
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
  phone TEXT UNIQUE,
  zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members (people in a household)
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('adult', 'child', 'pet')) DEFAULT 'adult',
  avatar TEXT DEFAULT '👤',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household status (availability)
CREATE TABLE IF NOT EXISTS household_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE UNIQUE,
  state TEXT CHECK (state IN ('available', 'open', 'busy')) DEFAULT 'available',
  note TEXT,
  time_window TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections (friendships between households)
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES households(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES households(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- Circles (groups of friends)
CREATE TABLE IF NOT EXISTS circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#9CAF88',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle members (households in a circle)
CREATE TABLE IF NOT EXISTS circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, household_id)
);

-- Invites (hangout invitations)
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  date DATE,
  time TEXT,
  location TEXT,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invite recipients
CREATE TABLE IF NOT EXISTS invite_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_id UUID REFERENCES invites(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  response TEXT CHECK (response IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  UNIQUE(invite_id, household_id)
);

-- Businesses (for local offers/events)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  zip_code TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers (local deals)
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  promo_code TEXT,
  valid_until DATE,
  color TEXT DEFAULT '#9CAF88',
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
  location TEXT,
  zip_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Households: users can read/update their own household
CREATE POLICY "Users can view their own household" ON households
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own household" ON households
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Household members: users can manage their own household members
CREATE POLICY "Users can view their household members" ON household_members
  FOR SELECT USING (household_id::text = auth.uid()::text);

CREATE POLICY "Users can manage their household members" ON household_members
  FOR ALL USING (household_id::text = auth.uid()::text);

-- Status: users can view connected households' status
CREATE POLICY "Users can view own status" ON household_status
  FOR SELECT USING (household_id::text = auth.uid()::text);

CREATE POLICY "Users can view connected households status" ON household_status
  FOR SELECT USING (
    household_id IN (
      SELECT CASE
        WHEN requester_id::text = auth.uid()::text THEN receiver_id
        ELSE requester_id
      END
      FROM connections
      WHERE status = 'accepted'
      AND (requester_id::text = auth.uid()::text OR receiver_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Users can update their own status" ON household_status
  FOR UPDATE USING (household_id::text = auth.uid()::text);

-- Connections: users can view/manage their own connections
CREATE POLICY "Users can view their connections" ON connections
  FOR SELECT USING (
    requester_id::text = auth.uid()::text OR receiver_id::text = auth.uid()::text
  );

CREATE POLICY "Users can create connections" ON connections
  FOR INSERT WITH CHECK (requester_id::text = auth.uid()::text);

CREATE POLICY "Users can update their connections" ON connections
  FOR UPDATE USING (
    requester_id::text = auth.uid()::text OR receiver_id::text = auth.uid()::text
  );

-- Circles: users can manage their own circles
CREATE POLICY "Users can view their circles" ON circles
  FOR SELECT USING (owner_household_id::text = auth.uid()::text);

CREATE POLICY "Users can manage their circles" ON circles
  FOR ALL USING (owner_household_id::text = auth.uid()::text);

-- Circle members: users can manage members of their circles
CREATE POLICY "Users can view circle members" ON circle_members
  FOR SELECT USING (
    circle_id IN (SELECT id FROM circles WHERE owner_household_id::text = auth.uid()::text)
  );

CREATE POLICY "Users can manage circle members" ON circle_members
  FOR ALL USING (
    circle_id IN (SELECT id FROM circles WHERE owner_household_id::text = auth.uid()::text)
  );

-- Invites: users can view invites they created or received
CREATE POLICY "Users can view their invites" ON invites
  FOR SELECT USING (
    creator_household_id::text = auth.uid()::text
    OR id IN (SELECT invite_id FROM invite_recipients WHERE household_id::text = auth.uid()::text)
  );

CREATE POLICY "Users can create invites" ON invites
  FOR INSERT WITH CHECK (creator_household_id::text = auth.uid()::text);

-- Invite recipients: users can view/respond to their invites
CREATE POLICY "Users can view invite recipients" ON invite_recipients
  FOR SELECT USING (
    household_id::text = auth.uid()::text
    OR invite_id IN (SELECT id FROM invites WHERE creator_household_id::text = auth.uid()::text)
  );

CREATE POLICY "Users can respond to invites" ON invite_recipients
  FOR UPDATE USING (household_id::text = auth.uid()::text);

-- Businesses/Offers/Events: publicly readable
CREATE POLICY "Anyone can view businesses" ON businesses FOR SELECT USING (true);
CREATE POLICY "Anyone can view active offers" ON offers FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active events" ON events FOR SELECT USING (is_active = true);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE household_status;
ALTER PUBLICATION supabase_realtime ADD TABLE invites;
ALTER PUBLICATION supabase_realtime ADD TABLE invite_recipients;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_status_household ON household_status(household_id);
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_circles_owner ON circles(owner_household_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_household ON circle_members(household_id);
CREATE INDEX IF NOT EXISTS idx_invites_creator ON invites(creator_household_id);
CREATE INDEX IF NOT EXISTS idx_invite_recipients_invite ON invite_recipients(invite_id);
CREATE INDEX IF NOT EXISTS idx_invite_recipients_household ON invite_recipients(household_id);
CREATE INDEX IF NOT EXISTS idx_offers_business ON offers(business_id);
CREATE INDEX IF NOT EXISTS idx_events_business ON events(business_id);

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
