const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./services/db');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const { loadActiveGamesFromDB, getActiveGames, handleSocketConnection } = require('./controllers/gameController');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Konfiguracja CORS
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
};

// Konfiguracja Socket.io
const io = new Server(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.use(express.json());

// Routing
app.use('/auth', authRoutes);
app.use('/game', gameRoutes);

// Funkcja inicjalizacji serwera
const initializeServer = async () => {
  try {
    // Test połączenia z PostgreSQL
    const result = await pool.query('SELECT NOW()');
    console.log('Połączono z PostgreSQL:', result.rows[0]);
    
    // Załaduj aktywne gry z bazy danych
    await loadActiveGamesFromDB();
    
    console.log('Serwer zainicjalizowany pomyślnie');
  } catch (error) {
    console.error('Błąd inicjalizacji serwera:', error);
    process.exit(1); // Zakończ proces jeśli nie można połączyć z bazą
  }
};

// Prosty endpoint testowy
app.get('/', (req, res) => {
  const activeGames = getActiveGames();
  res.json({
    message: 'Chess Server is running!',
    activeGamesCount: activeGames.size,
    timestamp: new Date().toISOString()
  });
});

// Konfiguracja Socket.io - używamy handlera z gameController
io.on('connection', handleSocketConnection(io));

// Obsługa błędów serwera
app.use((err, req, res, next) => {
  console.error('Błąd serwera:', err.stack);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Zamykanie serwera...');
  
  try {
    // Zapisz aktywne gry do bazy przed zamknięciem
    const activeGames = getActiveGames();
    console.log(`Zapisywanie ${activeGames.size} aktywnych gier...`);
    
    for (const [gameId, game] of activeGames) {
      try {
        await pool.query(
          `UPDATE games 
           SET fen = $1, current_turn = $2, status = $3, updated_at = NOW()
           WHERE id = $4`,
          [game.fen, game.currentTurn, game.status, gameId]
        );
      } catch (error) {
        console.error(`Błąd zapisywania gry ${gameId}:`, error);
      }
    }
    
    await pool.end();
    console.log('Połączenie z bazą danych zamknięte');
  } catch (error) {
    console.error('Błąd podczas zamykania:', error);
  }
  
  process.exit(0);
});

// Uruchomienie serwera
const PORT = process.env.PORT || 3000;

initializeServer().then(() => {
  server.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
    console.log(`Aktywnych gier: ${getActiveGames().size}`);
  });
}).catch(error => {
  console.error('Nie udało się uruchomić serwera:', error);
  process.exit(1);
});

module.exports = { app, server, io };