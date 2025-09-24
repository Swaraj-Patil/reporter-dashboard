const express = require('express');
const db = require('../db');

const router = express.Router();

// Valid impact event types
const VALID_IMPACT_TYPES = ['ad_removed', 'advertiser_warned', 'policy_updated'];

// GET /impact-events?ticket_id=123
router.get('/', async (req, res) => {
  const { ticket_id } = req.query;
  
  if (!ticket_id) {
    return res.status(400).json({ ok: false, error: 'missing_ticket_id' });
  }

  try {
    const result = await db.query(
      `SELECT ie.*, u.username as admin_name
       FROM impact_events ie
       LEFT JOIN users u ON ie.admin_id = u.id
       WHERE ie.ticket_id = $1
       ORDER BY ie.created_at DESC`,
      [ticket_id]
    );

    res.json({ ok: true, impact_events: result.rows });
  } catch (err) {
    console.error('Error fetching impact events:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// POST /impact-events
router.post('/', async (req, res) => {
  const { ticket_id, type, description, admin_id } = req.body;

  if (!ticket_id || !type || !description || !admin_id) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  if (!VALID_IMPACT_TYPES.includes(type)) {
    return res.status(400).json({ 
      ok: false, 
      error: 'invalid_type',
      valid_types: VALID_IMPACT_TYPES
    });
  }

  try {
    // First check if ticket exists and admin has proper role
    const checkResult = await db.query(
      `SELECT t.id, u.role
       FROM tickets t
       INNER JOIN users u ON u.id = $2
       WHERE t.id = $1 AND u.role = 'admin'`,
      [ticket_id, admin_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'ticket_not_found_or_unauthorized' 
      });
    }

    // Create the impact event
    const result = await db.query(
      `INSERT INTO impact_events (ticket_id, type, description, admin_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *, 
         (SELECT username FROM users WHERE id = $4) as admin_name`,
      [ticket_id, type, description, admin_id]
    );

    const impactEvent = result.rows[0];

    // Add an automated comment about the impact
    let commentBody;
    switch (type) {
      case 'ad_removed':
        commentBody = `Impact: Ad was removed. ${description}`;
        break;
      case 'advertiser_warned':
        commentBody = `Impact: Advertiser received a warning. ${description}`;
        break;
      case 'policy_updated':
        commentBody = `Impact: Policy was updated. ${description}`;
        break;
    }

    await db.query(
      `INSERT INTO comments (ticket_id, is_automated, body)
       VALUES ($1, true, $2)`,
      [ticket_id, commentBody]
    );

    // If it's a policy update, update ticket status to responded
    if (type === 'policy_updated') {
      await db.query(
        `UPDATE tickets SET status = 'responded'
         WHERE id = $1 AND status != 'responded'`,
        [ticket_id]
      );
    }

    // Notify connected clients
    if (req.app.get('io')) {
      // Emit the impact event creation
      req.app.get('io').emit('impact:created', {
        ticket_id: impactEvent.ticket_id,
        impact_event: {
          id: impactEvent.id,
          type: impactEvent.type,
          description: impactEvent.description,
          admin: impactEvent.admin_name,
          created_at: impactEvent.created_at
        }
      });

      // If status changed to responded, emit that too
      if (type === 'policy_updated') {
        req.app.get('io').emit('ticket:status_updated', {
          id: ticket_id,
          status: 'responded',
          updated_at: new Date()
        });
      }
    }

    res.status(201).json({ ok: true, impact_event: impactEvent });
  } catch (err) {
    console.error('Error creating impact event:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// GET /impact-events/stats
router.get('/stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        type,
        COUNT(*) as count,
        MIN(created_at) as first_occurrence,
        MAX(created_at) as last_occurrence
      FROM impact_events
      GROUP BY type
      ORDER BY count DESC
    `);

    res.json({ ok: true, stats: result.rows });
  } catch (err) {
    console.error('Error fetching impact event stats:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// GET /impact-events/timeline
router.get('/timeline', async (req, res) => {
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT 
        DATE(created_at) as date,
        type,
        COUNT(*) as count
      FROM impact_events
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(end_date);
    }

    query += `
      GROUP BY DATE(created_at), type
      ORDER BY date DESC, type
    `;

    const result = await db.query(query, params);

    // Transform the results into a more frontend-friendly format
    const timeline = {};
    result.rows.forEach(row => {
      if (!timeline[row.date]) {
        timeline[row.date] = {
          date: row.date,
          ad_removed: 0,
          advertiser_warned: 0,
          policy_updated: 0
        };
      }
      timeline[row.date][row.type] = parseInt(row.count);
    });

    res.json({ 
      ok: true, 
      timeline: Object.values(timeline)
    });
  } catch (err) {
    console.error('Error fetching impact event timeline:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

module.exports = router;