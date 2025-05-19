const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./services/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Dopasuj do portu klienta Vite
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());
app.use(cors());
app.use('/auth', authRoutes);

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
  console.log('Nowy użytkownik:', socket.id);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));