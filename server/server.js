const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./services/db');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
require('dotenv').config(); // Ładowanie zmiennych środowiskowych z .env

const app = express();
const server = http.createServer(app);

// Konfiguracja CORS
const corsOptions = {
  origin: 'http://localhost:5173', // Dopasuj do portu klienta Vite
  methods: ['GET', 'POST'],
  credentials: true, // Umożliwienie przesyłania ciasteczek/uwierzytelniania
};

app.use(cors(corsOptions));
// Middleware
app.use(express.json());

// Routing
app.use('/auth', authRoutes);
app.use('/games', gameRoutes);

// Test połączenia z PostgreSQL
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Błąd połączenia z PostgreSQL:', err.stack);
  } else {
    console.log('Połączono z PostgreSQL:', res.rows[0]);
  }
});

// Prosty endpoint testowy
app.get('/', (req, res) => {
  res.send('Chess Server is running!');
});

// Konfiguracja Socket.io
const io = new Server(server, {
  cors: corsOptions, // Użycie tej samej konfiguracji CORS co dla Express
});

io.on('connection', (socket) => {
  console.log('Nowy użytkownik podłączony:', socket.id);

  socket.on('joinGame', (gameId) => {
    socket.join(gameId);
    const game = activeGames.get(gameId);
    if (game) {
      io.to(gameId).emit('gameState', { fen: game.fen, currentTurn: game.currentTurn, status: game.status });
    }
  });

  socket.on('move', ({ gameId, from, to, playerId }) => {
    const { valid, updatedFen } = validateMove(gameId, from, to, playerId);
    if (valid) {
      io.to(gameId).emit('gameState', { fen: updatedFen, currentTurn: activeGames.get(gameId).currentTurn, status: activeGames.get(gameId).status });
    }
  });

  socket.on('disconnect', () => console.log('Użytkownik rozłączony:', socket.id));
});

// Obsługa błędów serwera
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
});

// Uruchomienie serwera
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});