-- Drop existing tables if they exist
DROP TABLE IF EXISTS impact_events;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('reporter', 'admin')),
  created_at TIMESTAMP DEFAULT now()
);

-- Create tickets table
CREATE TABLE tickets (
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

-- Create comments table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id),
  is_automated BOOLEAN DEFAULT false,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Create impact events table
CREATE TABLE impact_events (
  id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ad_removed', 'advertiser_warned', 'policy_updated')),
  description TEXT NOT NULL,
  admin_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX tickets_reporter_id_idx ON tickets(reporter_id);
CREATE INDEX tickets_status_idx ON tickets(status);
CREATE INDEX comments_ticket_id_idx ON comments(ticket_id);
CREATE INDEX impact_events_ticket_id_idx ON impact_events(ticket_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tickets table
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
