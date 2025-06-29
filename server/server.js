const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./services/db');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const { loadActiveGamesFromDB, getActiveGames, validateMove } = require('./controllers/gameController');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Konfiguracja CORS
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
};

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

// Endpoint do sprawdzania aktywnych gier (pomocny do debugowania)
app.get('/debug/active-games', (req, res) => {
  const activeGames = getActiveGames();
  const gamesArray = Array.from(activeGames.entries()).map(([id, game]) => ({
    gameId: id,
    status: game.status,
    currentTurn: game.currentTurn,
    whitePlayer: game.whitePlayerId,
    blackPlayer: game.blackPlayerId,
    createdAt: game.createdAt
  }));
  
  res.json({
    count: activeGames.size,
    games: gamesArray
  });
});

// Konfiguracja Socket.io
const io = new Server(server, {
  cors: corsOptions,
});

io.on('connection', (socket) => {
  console.log('Nowy użytkownik podłączony:', socket.id);

  socket.on('joinGame', async (gameId) => {
    try {
      socket.join(gameId.toString());
      const activeGames = getActiveGames();
      const game = activeGames.get(parseInt(gameId));
      
      if (game) {
        console.log(`Użytkownik ${socket.id} dołączył do gry ${gameId}`);
        io.to(gameId.toString()).emit('gameState', {
          fen: game.fen,
          currentTurn: game.currentTurn,
          status: game.status,
          gameId: game.gameId
        });
      } else {
        socket.emit('error', { message: 'Gra nie znaleziona' });
      }
    } catch (error) {
      console.error('Błąd w joinGame socket:', error);
      socket.emit('error', { message: 'Błąd dołączania do gry' });
    }
  });

  socket.on('move', async ({ gameId, from, to, playerId }) => {
    try {
      console.log(`Ruch w grze ${gameId}: ${from} -> ${to} przez ${playerId}`);
      
      const { valid, fen, currentTurn, status, error } = await validateMove(gameId, from, to, playerId);
      
      if (valid) {
        const gameState = {
          fen,
          currentTurn,
          status,
          gameId: parseInt(gameId)
        };
        
        // Wyślij aktualizowany stan do wszystkich graczy w pokoju
        io.to(gameId.toString()).emit('gameState', gameState);
        console.log(`Stan gry ${gameId} zaktualizowany i wysłany do graczy`);
      } else {
        socket.emit('moveError', { message: error || 'Nieprawidłowy ruch' });
      }
    } catch (error) {
      console.error('Błąd w move socket:', error);
      socket.emit('moveError', { message: 'Błąd wykonania ruchu' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Użytkownik rozłączony:', socket.id);
  });
});

// Obsługa błędów serwera
app.use((err, req, res, next) => {
  console.error('Błąd serwera:', err.stack);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Zamykanie serwera...');
  
  try {
    // Możesz tutaj dodać logikę zapisywania stanu gier
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