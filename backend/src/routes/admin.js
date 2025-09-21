const express = require('express');
const db = require('../db');
const { anonymizeText } = require('../utils/anonymize');

const router = express.Router();

// middleware: simple header-based admin key
router.use((req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  next();
});

// POST /admin/review
// body: { ticketId, action, comment }
// action: 'in_review' or 'responded'
router.post('/review', async (req, res) => {
  const { ticketId, action, comment } = req.body || {};
  if (!ticketId || !action) return res.status(400).json({ ok: false, error: 'missing_fields' });
  if (!['in_review', 'responded'].includes(action)) return res.status(400).json({ ok: false, error: 'invalid_action' });

  try {
    // update ticket status
    await db.query(`UPDATE tickets SET status=$1, updated_at=NOW() WHERE id=$2`, [action, ticketId]);

    // insert comment
    if (comment && comment.trim().length > 0) {
      await db.query(`INSERT INTO comments (ticket_id, author, body) VALUES ($1,$2,$3)`, [
        ticketId,
        'reviewer',
        comment
      ]);
    } else {
      // default automated reviewer message
      await db.query(`INSERT INTO comments (ticket_id, author, body) VALUES ($1,$2,$3)`, [
        ticketId,
        'reviewer',
        action === 'in_review'
          ? 'This report is now being reviewed by our moderation team.'
          : 'We have responded — thank you for reporting. The issue has been addressed.'
      ]);
    }

    // create a simulated impact event for demonstration
    const impactTypes = action === 'responded'
      ? ['ad_removed', 'advertiser_warned', 'policy_updated']
      : ['in_review_log'];
    const chosen = impactTypes[Math.floor(Math.random() * impactTypes.length)];
    let desc = '';
    if (chosen === 'ad_removed') desc = 'Simulated: matching ad removed from platform.';
    if (chosen === 'advertiser_warned') desc = 'Simulated: advertiser received a warning.';
    if (chosen === 'policy_updated') desc = 'Simulated: policy guidance updated for this ad category.';
    if (chosen === 'in_review_log') desc = 'Simulated: review logged; no action taken yet.';

    const impactInsert = await db.query(
      `INSERT INTO impact_events (ticket_id, type, description) VALUES ($1,$2,$3) RETURNING id, type, description, created_at`,
      [ticketId, chosen, desc]
    );

    const impact = impactInsert.rows[0];

    // return success + latest ticket state
    const ticketRes = await db.query(
      `SELECT id, external_id, title, status, anonymized_summary FROM tickets WHERE id=$1 LIMIT 1`,
      [ticketId]
    );
    const ticket = ticketRes.rows[0];

    res.json({ ok: true, ticket, impact });

    // broadcast via socket if available
    if (req.app.get('io')) {
      req.app.get('io').emit('ticket_updated', { ticket, impact, action });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

module.exports = router;
