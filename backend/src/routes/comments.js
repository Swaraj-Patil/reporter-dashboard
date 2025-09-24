const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /comments?ticket_id=123
router.get('/', async (req, res) => {
  const { ticket_id } = req.query;
  
  if (!ticket_id) {
    return res.status(400).json({ ok: false, error: 'missing_ticket_id' });
  }

  try {
    const result = await db.query(
      `SELECT c.*, u.username as author_name
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id = $1
       ORDER BY c.created_at DESC`,
      [ticket_id]
    );

    res.json({ ok: true, comments: result.rows });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// POST /comments
// body: { ticket_id, body, user_id }
router.post('/', async (req, res) => {
  const { ticket_id, body, user_id } = req.body;

  if (!ticket_id || !body) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  try {
    // First check if ticket exists
    const ticketCheck = await db.query(
      'SELECT id, status FROM tickets WHERE id = $1',
      [ticket_id]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'ticket_not_found' });
    }

    // Insert the comment
    const result = await db.query(
      `INSERT INTO comments (ticket_id, user_id, body, is_automated)
       VALUES ($1, $2, $3, false)
       RETURNING *, 
         (SELECT username FROM users WHERE id = $2) as author_name`,
      [ticket_id, user_id, body]
    );

    const comment = result.rows[0];

    // Update ticket's updated_at timestamp
    await db.query(
      'UPDATE tickets SET updated_at = NOW() WHERE id = $1',
      [ticket_id]
    );

    // Notify connected clients
    if (req.app.get('io')) {
      req.app.get('io').emit('comment:created', {
        ticket_id: comment.ticket_id,
        comment: {
          id: comment.id,
          body: comment.body,
          author: comment.author_name,
          is_automated: comment.is_automated,
          created_at: comment.created_at
        }
      });
    }

    res.status(201).json({ ok: true, comment });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// POST /comments/automated
// body: { ticket_id, body }
router.post('/automated', async (req, res) => {
  const { ticket_id, body } = req.body;

  if (!ticket_id || !body) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  try {
    // Check if ticket exists
    const ticketCheck = await db.query(
      'SELECT id FROM tickets WHERE id = $1',
      [ticket_id]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'ticket_not_found' });
    }

    // Insert the automated comment
    const result = await db.query(
      `INSERT INTO comments (ticket_id, body, is_automated)
       VALUES ($1, $2, true)
       RETURNING *`,
      [ticket_id, body]
    );

    const comment = result.rows[0];

    // Notify connected clients
    if (req.app.get('io')) {
      req.app.get('io').emit('comment:created', {
        ticket_id: comment.ticket_id,
        comment: {
          id: comment.id,
          body: comment.body,
          is_automated: true,
          created_at: comment.created_at
        }
      });
    }

    res.status(201).json({ ok: true, comment });
  } catch (err) {
    console.error('Error creating automated comment:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// DELETE /comments/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM comments
       WHERE id = $1 AND NOT is_automated
       RETURNING id, ticket_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'comment_not_found_or_automated' 
      });
    }

    const comment = result.rows[0];

    // Notify connected clients
    if (req.app.get('io')) {
      req.app.get('io').emit('comment:deleted', {
        id: comment.id,
        ticket_id: comment.ticket_id
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

module.exports = router;