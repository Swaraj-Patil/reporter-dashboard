require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');
const ticketsRouter = require('./routes/tickets');
const commentsRouter = require('./routes/comments');
const impactEventsRouter = require('./routes/impact-events');
const adminRouter = require('./routes/admin');
const db = require('./db');

const app = express();
const server = http.createServer(app);

// attach socket.io
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join admin room if admin
  socket.on('join:admin', (token) => {
    // In a real app, verify the admin token here
    if (token === process.env.ADMIN_KEY) {
      socket.join('admin');
      console.log('Admin joined:', socket.id);
    }
  });

  // Handle ticket events
  socket.on('ticket:created', (ticket) => {
    io.to('admin').emit('ticket:created', ticket);
  });

  socket.on('ticket:updated', (ticket) => {
    io.emit('ticket:updated', ticket);
  });

  // Handle comment events
  socket.on('comment:created', (comment) => {
    io.emit('comment:created', comment);
  });

  // Handle impact events
  socket.on('impact:created', (event) => {
    io.emit('impact:created', event);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// middleware
app.use(cors());
app.use(express.json());

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// attach routers
app.use('/tickets', ticketsRouter);
app.use('/comments', commentsRouter);
app.use('/impact-events', impactEventsRouter);
app.use('/admin', adminRouter);

// health
app.get('/_health', (req, res) => res.json({ ok: true }));

// start
const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
