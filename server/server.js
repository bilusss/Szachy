const express = require('express');
const http = require('http');

const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:5173', // Allow requests from the client's origin
    methods: ['GET', 'POST'], // Allow these HTTP methods
  },
});

// Hashing library for passwords
const bcrypt = require('bcrypt');
const saltRounds = 10;

// JWT library for authentication
const jwt = require('jsonwebtoken');


// Configure PostgreSQL connection
const pool = new Pool({
  user: 'admin', // Replace with your PostgreSQL username
  host: 'localhost',
  database: 'szachy', // Replace with your database name
  password: 'password', // Replace with your PostgreSQL password
  port: 5432,
});

// Test PostgreSQL connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Connected to PostgreSQL:', res.rows[0]);
  }
});

// Serve a simple endpoint for testing
app.get('/', (req, res) => {
  res.send('Chess Server is running!');
});

// Socket.io connection for real-time communication
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('move', (move) => {
    console.log('Move received:', move);
    socket.broadcast.emit('move', move); // Broadcast move to other players
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));