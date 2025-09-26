const express = require('express');
const db = require('../db');

const router = express.Router();

const VALID_IMPACT_TYPES = ['ad_removed', 'advertiser_warned', 'policy_updated', 'report_used', 'enhanced_monitoring', 'content_filtered', 'in_review_log'];

/**
 * @swagger
 * /api/impact-events:
 *   get:
 *     summary: Get all impact events
 *     description: Retrieve a list of all impact events (across all tickets)
 *     tags: [Impact Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum number of impact events to return
 *     responses:
 *       '200':
 *         description: List of impact events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 impact_events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ImpactEvent'
 *       '500':
 *         description: Server error
 */
router.get('/', async (req, res) => {
  const { limit } = req.query;
  
  let limitNum = null;
  if (limit !== undefined) {
    limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ ok: false, error: 'invalid_limit' });
    }
  }

  try {
    let sql = `
      SELECT ie.*, u.username as admin_name
      FROM impact_events ie
      LEFT JOIN users u ON ie.admin_id = u.id
      ORDER BY ie.created_at DESC
    `;
    const params = [];

    if (limitNum !== null) {
      sql += ` LIMIT $1`;
      params.push(limitNum);
    }

    const result = await db.query(sql, params);

    res.json({ ok: true, impact_events: result.rows });
  } catch (err) {
    console.error('Error fetching impact events:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});


/**
 * @swagger
 * /api/impact-events:
 *   post:
 *     summary: Create a new impact event
 *     description: Create an impact event for a ticket. Only admins can create impact events.
 *     tags: [Impact Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_id
 *               - type
 *               - description
 *               - admin_id
 *             properties:
 *               ticket_id:
 *                 type: integer
 *                 description: ID of the ticket this impact is for
 *               type:
 *                 type: string
 *                 enum: [ad_removed, advertiser_warned, policy_updated, report_used, enhanced_monitoring, content_filtered]
 *               description:
 *                 type: string
 *                 description: Detailed description of the impact
 *               admin_id:
 *                 type: integer
 *                 description: ID of the admin creating the impact
 *     responses:
 *       201:
 *         description: Impact event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 impact_event:
 *                   $ref: '#/components/schemas/ImpactEvent'
 *       400:
 *         description: Missing required fields or invalid impact type
 *       404:
 *         description: Ticket not found or user not authorized
 *       500:
 *         description: Server error
 */
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
      case 'report_used':
        commentBody = `Impact: Report was used in Analytics Summary. ${description}`;
        break;
      case 'enhanced_monitoring':
        commentBody = `Impact: Enhanced Monitoring is Activated. ${description}`;
        break;
      case 'content_filtered':
        commentBody = `Impact: Content Filter is Updated. ${description}`;
        break;
      case 'in_review_log':
        commentBody = `Impact: Ticket reviewed. ${description}`;
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

/**
 * @swagger
 * /api/impact-events/stats:
 *   get:
 *     summary: Get impact event statistics
 *     description: Retrieve aggregated statistics about impact events grouped by type
 *     tags: [Impact Events]
 *     responses:
 *       200:
 *         description: Impact event statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 stats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ImpactEventStats'
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/impact-events/timeline:
 *   get:
 *     summary: Get impact event timeline
 *     description: Retrieve daily counts of impact events by type within a date range
 *     tags: [Impact Events]
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the timeline (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the timeline (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Timeline of impact events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 timeline:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TimelineEntry'
 *       500:
 *         description: Server error
 */
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
          policy_updated: 0,
          report_used: 0,
          enhanced_monitoring: 0,
          content_filtered: 0
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