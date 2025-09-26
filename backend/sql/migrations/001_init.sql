-- Initial schema migration

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('reporter', 'admin')),
  created_at TIMESTAMP DEFAULT now()
);

-- Create tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  external_id TEXT UNIQUE,
  reporter_id INT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  anonymized_summary TEXT,
  status TEXT NOT NULL CHECK (status IN ('received', 'in_review', 'responded')) DEFAULT 'received',
  source TEXT,
  privacy_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id),
  is_automated BOOLEAN DEFAULT false,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Create impact events table if it doesn't exist
CREATE TABLE IF NOT EXISTS impact_events (
  id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ad_removed', 'advertiser_warned', 'policy_updated', 'report_used', 'enhanced_monitoring', 'content_filtered', 'in_review_log')),
  description TEXT NOT NULL,
  admin_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_reporter ON tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_impact_events_ticket ON impact_events(ticket_id);