-- Insert sample users
INSERT INTO users (username, role) VALUES
('john_reporter', 'reporter'),
('jane_reporter', 'reporter'),
('admin1', 'admin'),
('admin2', 'admin');

-- Insert sample tickets
INSERT INTO tickets (external_id, reporter_id, title, description, status, source, anonymized_summary)
VALUES
('t1', 1, 'Ad targeting suspicious: "diet pills"', 'The ad targets young adults and includes a direct email contact john.doe@example.com proposing unsafe diet pills.', 'received', 'extension', 'Ad targeting young adults with unsafe health products'),
('t2', 1, 'Misleading ad claiming guaranteed returns', 'Ad promises guaranteed returns and shows a phone +1-555-000-1234. Possible scam.', 'in_review', 'web', 'Investment scam ad with unrealistic promises'),
('t3', 2, 'Ad with hate speech', 'Ad contains derogatory language targeting a protected class.', 'responded', 'web', 'Ad reported for discriminatory content'),
('t4', 2, 'Cryptocurrency scam ad', 'Ad claiming to double cryptocurrency investments within 24 hours.', 'received', 'extension', 'Suspicious cryptocurrency investment ad');

-- Insert sample comments
INSERT INTO comments (ticket_id, user_id, is_automated, body)
VALUES
(1, NULL, true, 'Ticket received and automated scanning detected potential health-related violations.'),
(1, 3, false, 'Initial review confirms violation of health product advertising policies.'),
(2, NULL, true, 'Automated system flagged potential financial scam indicators.'),
(2, 3, false, 'Under review - requesting additional documentation from advertiser.'),
(3, NULL, true, 'Content flagged for potential policy violations.'),
(3, 4, false, 'Confirmed violation of hate speech policy. Ad removed and advertiser account suspended.'),
(4, NULL, true, 'Automated detection identified high-risk financial content.');

-- Insert sample impact events
INSERT INTO impact_events (ticket_id, type, description, admin_id)
VALUES
(1, 'ad_removed', 'Health product ad removed due to policy violation', 3),
(2, 'advertiser_warned', 'Warning issued to advertiser about misleading financial claims', 3),
(3, 'policy_updated', 'Hate speech detection rules updated based on this case', 4),
(3, 'ad_removed', 'Ad removed and advertiser account suspended', 4);
