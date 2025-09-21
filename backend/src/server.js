require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const ticketsRouter = require('./routes/tickets');
const adminRouter = require('./routes/admin');
const db = require('./db');

const app = express();
const server = http.createServer(app);

// attach socket.io
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: '*' }
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

// middleware
app.use(cors());
app.use(express.json());

// attach routers
app.use('/tickets', ticketsRouter);
app.use('/admin', adminRouter);

// health
app.get('/_health', (req, res) => res.json({ ok: true }));

// start
const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
