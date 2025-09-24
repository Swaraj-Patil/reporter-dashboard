const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { anonymizeText } = require('../utils/anonymize');

const router = express.Router();

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Get a list of tickets
 *     description: Retrieve a list of tickets with optional anonymization and status filtering
 *     parameters:
 *       - in: query
 *         name: anonymize
 *         schema:
 *           type: boolean
 *         description: Whether to anonymize sensitive information
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Comma-separated list of ticket statuses to filter by
 *     responses:
 *       200:
 *         description: A list of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 tickets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 *       500:
 *         description: Database error
 */
router.get('/', async (req, res) => {
  const anonymize = req.query.anonymize === 'true';
  const statusFilter = req.query.status ? req.query.status.split(',') : null;
  
  try {
    let query = `
      SELECT t.*, 
        u.username as reporter_name,
        (SELECT COUNT(*) FROM comments c WHERE c.ticket_id = t.id) as comment_count,
        (SELECT COUNT(*) FROM impact_events ie WHERE ie.ticket_id = t.id) as impact_count
      FROM tickets t
      LEFT JOIN users u ON t.reporter_id = u.id`;

    const params = [];
    if (statusFilter) {
      query += ` WHERE t.status = ANY($1)`;
      params.push(statusFilter);
    }

    query += ` ORDER BY t.created_at DESC LIMIT 200`;
    
    const ticketsRes = await db.query(query, params);
    const rows = ticketsRes.rows.map((t) => ({
      id: t.id,
      external_id: t.external_id,
      title: t.title,
      description: anonymize ? undefined : t.description,
      summary: anonymize ? (t.anonymized_summary || anonymizeText(t.description)) : t.anonymized_summary,
      status: t.status,
      source: t.source,
      reporter: t.reporter_name,
      privacy_enabled: t.privacy_enabled,
      comment_count: parseInt(t.comment_count),
      impact_count: parseInt(t.impact_count),
      created_at: t.created_at,
      updated_at: t.updated_at
    }));

    res.json({ ok: true, tickets: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get a ticket by ID
 *     description: Retrieve detailed information about a specific ticket
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket ID
 *       - in: query
 *         name: anonymize
 *         schema:
 *           type: boolean
 *         description: Whether to anonymize sensitive information
 *     responses:
 *       200:
 *         description: Detailed ticket information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 ticket:
 *                   $ref: '#/components/schemas/TicketDetail'
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Database error
 */
router.get('/:id', async (req, res) => {
  const anonymize = req.query.anonymize === 'true';
  const id = req.params.id;
  try {
    const ticketResult = await db.query(
      `SELECT t.*, u.username as reporter_name
       FROM tickets t
       LEFT JOIN users u ON t.reporter_id = u.id
       WHERE t.id = $1`,
      [id]
    );
    
    if (ticketResult.rowCount === 0) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }

    const ticket = ticketResult.rows[0];

    // Fetch comments with author information
    const comments = await db.query(
      `SELECT c.*, u.username as author_name
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id = $1
       ORDER BY c.created_at ASC`,
      [ticket.id]
    );

    // Fetch impact events with admin information
    const impacts = await db.query(
      `SELECT ie.*, u.username as admin_name
       FROM impact_events ie
       LEFT JOIN users u ON ie.admin_id = u.id
       WHERE ie.ticket_id = $1
       ORDER BY ie.created_at DESC`,
      [ticket.id]
    );

    const response = {
      ok: true,
      ticket: {
        id: ticket.id,
        external_id: ticket.external_id,
        title: ticket.title,
        description: anonymize ? undefined : ticket.description,
        summary: anonymize ? (ticket.anonymized_summary || anonymizeText(ticket.description)) : ticket.anonymized_summary,
        status: ticket.status,
        source: ticket.source,
        reporter: ticket.reporter_name,
        privacy_enabled: ticket.privacy_enabled,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at
      },
      comments: comments.rows,
      impacts: impacts.rows
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// POST /tickets
// body: { title, description, source, reporter_id }
router.post('/', async (req, res) => {
  const { title, description, source, reporter_id } = req.body || {};
  if (!title || !description) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  try {
    const external_id = uuidv4();
    const anonymized_summary = anonymizeText(description);
    
    // Insert the ticket
    const ticketResult = await db.query(
      `INSERT INTO tickets (
        external_id, title, description, anonymized_summary, 
        status, source, reporter_id, privacy_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *, 
        (SELECT username FROM users WHERE id = $7) as reporter_name`,
      [
        external_id,
        title,
        description,
        anonymized_summary,
        'received',
        source || 'web',
        reporter_id,
        false
      ]
    );

    const ticket = ticketResult.rows[0];

    // Add an automated welcome comment
    await db.query(
      `INSERT INTO comments (ticket_id, is_automated, body)
       VALUES ($1, true, $2)`,
      [ticket.id, 'Thanks — your report has been received and will be reviewed.']
    );

    const response = {
      ok: true,
      ticket: {
        id: ticket.id,
        external_id: ticket.external_id,
        title: ticket.title,
        status: ticket.status,
        reporter: ticket.reporter_name,
        created_at: ticket.created_at,
        description: ticket.description,
      }
    };

    // Emit WebSocket event
    if (req.app.get('io')) {
      req.app.get('io').emit('ticket:created', response.ticket);
    }

    res.status(201).json(response);
  } catch (err) {
    console.error('Error creating ticket:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// PATCH /tickets/:id/status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['received', 'in_review', 'responded'].includes(status)) {
    return res.status(400).json({ ok: false, error: 'invalid_status' });
  }

  try {
    const result = await db.query(
      `UPDATE tickets
       SET status = $1
       WHERE id = $2
       RETURNING id, external_id, title, status, updated_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }

    const ticket = result.rows[0];
    
    // Add automated comment for status change
    await db.query(
      `INSERT INTO comments (ticket_id, is_automated, body)
       VALUES ($1, true, $2)`,
      [id, `Ticket status updated to ${status}`]
    );

    // Notify connected clients
    if (req.app.get('io')) {
      req.app.get('io').emit('ticket:status_updated', {
        id: ticket.id,
        status: ticket.status,
        updated_at: ticket.updated_at
      });
    }

    res.json({ ok: true, ticket });
  } catch (err) {
    console.error('Error updating ticket status:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// PATCH /tickets/:id/privacy
router.patch('/:id/privacy', async (req, res) => {
  const { id } = req.params;
  const { privacy_enabled } = req.body;
  
  try {
    const result = await db.query(
      `UPDATE tickets
       SET privacy_enabled = $1
       WHERE id = $2
       RETURNING id, external_id, privacy_enabled`,
      [privacy_enabled, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }

    const ticket = result.rows[0];
    
    // Notify connected clients
    if (req.app.get('io')) {
      req.app.get('io').emit('ticket:privacy_updated', {
        id: ticket.id,
        privacy_enabled: ticket.privacy_enabled
      });
    }

    res.json({ ok: true, ticket });
  } catch (err) {
    console.error('Error updating ticket privacy:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

module.exports = router;
