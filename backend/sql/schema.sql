CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  external_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  anonymized_summary TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  source TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
  author TEXT,
  body TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE impact_events (
  id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES tickets(id) ON DELETE SET NULL,
  type TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);
