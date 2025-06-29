const pool = require('../services/db');

let activeGames = new Map(); // Mapa przechowująca stany gier (gameId -> gameState)

// Funkcja do ładowania aktywnych gier z bazy danych
const loadActiveGamesFromDB = async () => {
  try {
    const result = await pool.query(`
      SELECT id, white_player_id, black_player_id, fen, status, created_at, updated_at 
      FROM games 
      WHERE status IN ('ongoing', 'waiting')
      ORDER BY created_at DESC
    `);
    
    console.log(`Ładowanie ${result.rows.length} aktywnych gier z bazy danych...`);
    
    for (const row of result.rows) {
      const gameState = {
        gameId: row.id,
        fen: row.fen,
        currentTurn: row.fen.split(' ')[1], // Wyciągnij aktualną turę z FEN
        whitePlayerId: row.white_player_id,
        blackPlayerId: row.black_player_id,
        moveHistory: [], // Możesz później dodać tabele dla ruchów
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      activeGames.set(row.id, gameState);
    }
    
    console.log('Aktywne gry załadowane do pamięci');
  } catch (error) {
    console.error('Błąd ładowania aktywnych gier:', error);
  }
};

// Funkcja do aktualizacji gry w bazie danych
const updateGameInDB = async (gameId, gameState) => {
  try {
    await pool.query(`
      UPDATE games 
      SET fen = $1, status = $2, updated_at = NOW()
      WHERE id = $3
    `, [gameState.fen, gameState.status, gameId]);
  } catch (error) {
    console.error('Błąd aktualizacji gry w bazie:', error);
  }
};

const initializeGame = async (whitePlayerId, blackPlayerId) => {
  const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const status = blackPlayerId === 'bot' ? 'ongoing' : 'waiting';
  
  try {
    console.log('Inicjalizacja gry:', { whitePlayerId, blackPlayerId, status });
    
    const result = await pool.query(
      `INSERT INTO games (white_player_id, black_player_id, fen, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [whitePlayerId, blackPlayerId === 'bot' ? null : blackPlayerId, initialFen, status]
    );
    
    const gameId = result.rows[0].id;
    const gameState = {
      gameId,
      fen: initialFen,
      currentTurn: 'w',
      whitePlayerId,
      blackPlayerId,
      moveHistory: [],
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    activeGames.set(gameId, gameState);
    console.log(`Gra ${gameId} utworzona i dodana do aktywnych gier`);
    
    return gameState;
  } catch (error) {
    console.error('Błąd tworzenia gry:', error.stack);
    throw error;
  }
};

// Funkcja do pobierania gry z pamięci lub bazy danych
const getGame = async (gameId) => {
  // Najpierw sprawdź w pamięci
  let game = activeGames.get(parseInt(gameId));
  
  if (!game) {
    // Jeśli nie ma w pamięci, sprawdź w bazie
    try {
      const result = await pool.query(
        'SELECT * FROM games WHERE id = $1',
        [gameId]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        game = {
          gameId: row.id,
          fen: row.fen,
          currentTurn: row.fen.split(' ')[1],
          whitePlayerId: row.white_player_id,
          blackPlayerId: row.black_player_id,
          moveHistory: [],
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        activeGames.set(parseInt(gameId), game);
        console.log(`Gra ${gameId} załadowana z bazy do pamięci`);
      }
    } catch (error) {
      console.error('Błąd pobierania gry z bazy:', error);
    }
  }
  
  return game;
};
    
const validateMove = async (gameId, from, to, playerId) => {
  const game = await getGame(gameId);
  
  if (!game) {
    return { valid: false, error: 'Gra nie znaleziona' };
  }

  // Zapis ruchu bez walidacji (możesz dodać walidację później)
  if (from && to) {
    game.moveHistory.push({ from, to, playerId, timestamp: new Date() });
    game.currentTurn = game.currentTurn === 'w' ? 'b' : 'w';
    
    // Możesz tutaj dodać logikę aktualizacji FEN na podstawie ruchu
    // Na razie pozostawiam oryginalny FEN
    
    // Aktualizuj w bazie danych
    await updateGameInDB(gameId, game);
    
  } else if (!from && !to) {
    // Reset/undo - prosty reset
    game.moveHistory = [];
    game.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    game.currentTurn = 'w';
    
    // Aktualizuj w bazie danych
    await updateGameInDB(gameId, game);
  }
  
  return { 
    valid: true, 
    fen: game.fen, 
    currentTurn: game.currentTurn, 
    status: game.status 
  };
};

// Kontrolery API
exports.createGame = async (req, res) => {
  const { playerId, gameType } = req.body;
  
  if (!playerId || !gameType) {
    return res.status(400).json({ error: 'playerId i gameType są wymagane' });
  }

  try {
    const gameState = await initializeGame(playerId, gameType === 'bot' ? 'bot' : null);
    res.status(201).json({
      gameId: gameState.gameId,
      fen: gameState.fen,
      currentTurn: gameState.currentTurn,
      status: gameState.status,
    });
  } catch (error) {
    console.error('Błąd w createGame:', error);
    res.status(500).json({ error: 'Nie udało się utworzyć gry' });
  }
};

exports.joinGame = async (req, res) => {
  const { gameId } = req.params;
  const { userId } = req.body;
  
  try {
    const game = await getGame(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Gra nie znaleziona' });
    }
    
    if (game.blackPlayerId && game.blackPlayerId !== 'bot') {
      return res.status(400).json({ error: 'Gra jest pełna' });
    }
    
    if (game.status === 'waiting') {
      game.blackPlayerId = userId;
      game.status = 'ongoing';
      await updateGameInDB(gameId, game);
    }
    
    res.json({ 
      message: 'Dołączono do gry',
      fen: game.fen,
      currentTurn: game.currentTurn,
      status: game.status
    });
  } catch (error) {
    console.error('Błąd w joinGame:', error);
    res.status(500).json({ error: 'Nie udało się dołączyć do gry' });
  }
};

exports.makeMove = async (req, res) => {
  const { gameId } = req.params;
  const { from, to, playerId } = req.body;
  
  try {
    const { valid, fen, currentTurn, status, error } = await validateMove(gameId, from, to, playerId);
    
    if (valid) {
      res.json({ fen, currentTurn, status });
    } else {
      res.status(400).json({ error: error || 'Nieprawidłowy ruch' });
    }
  } catch (error) {
    console.error('Błąd w makeMove:', error);
    res.status(500).json({ error: 'Nie udało się wykonać ruchu' });
  }
};

// Eksport funkcji pomocniczych
exports.loadActiveGamesFromDB = loadActiveGamesFromDB;
exports.getActiveGames = () => activeGames;
exports.validateMove = validateMove;