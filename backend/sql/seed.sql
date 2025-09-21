INSERT INTO tickets (external_id, title, description, status, source)
VALUES
('t1', 'Ad targeting suspicious: "diet pills"', 'The ad targets young adults and includes a direct email contact john.doe@example.com proposing unsafe diet pills.', 'received', 'extension'),
('t2', 'Misleading ad claiming guaranteed returns', 'Ad promises guaranteed returns and shows a phone +1-555-000-1234. Possible scam.', 'in_review', 'web'),
('t3', 'Ad with hate speech', 'Ad contains derogatory language targeting a protected class.', 'responded', 'web');
