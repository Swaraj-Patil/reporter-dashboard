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

-- Insert initial data only if tables are empty
DO $$ 
BEGIN
    -- Only insert users if none exist
    IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO users (username, role) VALUES
        ('john_reporter', 'reporter'),
        ('jane_reporter', 'reporter'),
        ('admin1', 'admin'),
        ('admin2', 'admin');

        -- Only insert tickets if none exist
        INSERT INTO tickets (external_id, reporter_id, title, description, status, source, anonymized_summary)
        VALUES
        ('t1', 1, 'Ad targeting suspicious: "diet pills"', 'The ad targets young adults and includes a direct email contact john.doe@example.com proposing unsafe diet pills.', 'received', 'extension', 'Ad targeting young adults with unsafe health products'),
        ('t2', 1, 'Misleading ad claiming guaranteed returns', 'Ad promises guaranteed returns and shows a phone +1-555-000-1234. Possible scam.', 'in_review', 'web', 'Investment scam ad with unrealistic promises'),
        ('t3', 2, 'Ad with hate speech', 'Ad contains derogatory language targeting a protected class.', 'responded', 'web', 'Ad reported for discriminatory content'),
        ('t4', 2, 'Cryptocurrency scam ad', 'Ad claiming to double cryptocurrency investments within 24 hours.', 'received', 'extension', 'Suspicious cryptocurrency investment ad');

        -- Insert initial comments
        INSERT INTO comments (ticket_id, user_id, is_automated, body)
        VALUES
        (1, NULL, true, 'Ticket received and automated scanning detected potential health-related violations.'),
        (1, 3, false, 'Initial review confirms violation of health product advertising policies.'),
        (2, NULL, true, 'Automated system flagged potential financial scam indicators.'),
        (2, 3, false, 'Under review - requesting additional documentation from advertiser.'),
        (3, NULL, true, 'Content flagged for potential policy violations.'),
        (3, 4, false, 'Confirmed violation of hate speech policy. Ad removed and advertiser account suspended.'),
        (4, NULL, true, 'Automated detection identified high-risk financial content.');

        -- Insert initial impact events
        INSERT INTO impact_events (ticket_id, type, description, admin_id)
        VALUES
        (1, 'ad_removed', 'Health product ad removed due to policy violation', 3),
        (2, 'advertiser_warned', 'Warning issued to advertiser about misleading financial claims', 3),
        (3, 'policy_updated', 'Hate speech detection rules updated based on this case', 4),
        (3, 'ad_removed', 'Ad removed and advertiser account suspended', 4);
    END IF;
END $$;