const pool = require('../services/db');
const { isLegalMove, makeMove, getGameStatus } = require('../services/chessLogic');

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
      // Załaduj historię ruchów dla każdej gry
      const moveHistory = await loadMoveHistoryFromDB(row.id);
      
      const gameState = {
        gameId: row.id,
        fen: row.fen,
        currentTurn: row.fen.split(' ')[1], // Wyciągnij aktualną turę z FEN
        whitePlayerId: row.white_player_id,
        blackPlayerId: row.black_player_id,
        moveHistory: moveHistory, // Załadowana historia ruchów
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

// Funkcja do ładowania historii ruchów z bazy danych
const loadMoveHistoryFromDB = async (gameId) => {
  try {
    const result = await pool.query(`
      SELECT from_square, to_square, player_id, move_number, fen, promotion, created_at
      FROM moves 
      WHERE game_id = $1 
      ORDER BY move_number ASC
    `, [gameId]);
    
    return result.rows.map(row => ({
      from: row.from_square,
      to: row.to_square,
      playerId: row.player_id,
      moveNumber: row.move_number,
      fen: row.fen,
      promotion: row.promotion,
      timestamp: row.created_at
    }));
  } catch (error) {
    console.error('Błąd ładowania historii ruchów:', error);
    return [];
  }
};

// Funkcja do zapisania ruchu w bazie danych
const saveMoveToDB = async (gameId, from, to, playerId, moveNumber, newFen, promotion = null) => {
  try {
    await pool.query(`
      INSERT INTO moves (game_id, player_id, from_square, to_square, move_number, fen, promotion, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [gameId, playerId === 'bot' ? null : playerId, from, to, moveNumber, newFen, promotion]);
    
    console.log(`Ruch zapisany w DB: gra ${gameId}, ruch ${moveNumber}`);
  } catch (error) {
    console.error('Błąd zapisywania ruchu w bazie:', error);
    throw error;
  }
};

// Funkcja do usuwania ruchów z bazy (przy resecie)
const clearMovesFromDB = async (gameId) => {
  try {
    await pool.query('DELETE FROM moves WHERE game_id = $1', [gameId]);
    console.log(`Ruchy usunięte z DB dla gry ${gameId}`);
  } catch (error) {
    console.error('Błąd usuwania ruchów z bazy:', error);
    throw error;
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
        const moveHistory = await loadMoveHistoryFromDB(gameId);
        
        game = {
          gameId: row.id,
          fen: row.fen,
          currentTurn: row.fen.split(' ')[1],
          whitePlayerId: row.white_player_id,
          blackPlayerId: row.black_player_id,
          moveHistory: moveHistory,
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

const validateMove = async (gameId, from, to, playerId, promotion = null) => {
  const game = await getGame(gameId);
  if (!game) {
    return { valid: false, error: 'Gra nie znaleziona' };
  }

  // Sprawdź czy gra jest w odpowiednim statusie
  if (game.status !== 'ongoing') {
    return { valid: false, error: 'Gra nie jest aktywna' };
  }

  // Sprawdź czy to kolejka gracza
  const currentPlayerColor = game.currentTurn;
  const isWhitePlayer = playerId === game.whitePlayerId || (playerId === 'bot' && game.whitePlayerId === null);
  const isBlackPlayer = playerId === game.blackPlayerId || (playerId === 'bot' && game.blackPlayerId === null);
  
  if (currentPlayerColor === 'w' && !isWhitePlayer) {
    return { valid: false, error: 'To nie Twoja kolejka' };
  }
  if (currentPlayerColor === 'b' && !isBlackPlayer) {
    return { valid: false, error: 'To nie Twoja kolejka' };
  }

  // Wykonanie ruchu lub reset
  if (from && to) {
    try {
      // Walidacja ruchu za pomocą chessLogic
      console.log("test1:", game.fen, from, to);
      if (!isLegalMove(game.fen, from, to)) {
        return { valid: false, error: 'Nieprawidłowy ruch' };
      }
      console.log("test2:");
      // Wykonaj ruch i otrzymaj nowy stan gry
      const moveResult = makeMove(game.fen, from, to, promotion);
      const newFen = moveResult.newFen;
      
      // Sprawdź status gry
      const gameStatus = getGameStatus(newFen);
      
      const moveNumber = game.moveHistory.length + 1;
      const moveData = { 
        from, 
        to, 
        playerId, 
        moveNumber,
        promotion,
        fen: newFen,
        timestamp: new Date() 
      };
      
      // Dodaj ruch do pamięci
      game.moveHistory.push(moveData);
      game.fen = newFen;
      game.currentTurn = newFen.split(' ')[1]; // Aktualizuj turę z FEN
      
      // Aktualizuj status gry jeśli się zmienił
      if (gameStatus !== 'ongoing') {
        game.status = gameStatus;
      }
      
      try {
        // Zapisz ruch w bazie danych
        await saveMoveToDB(gameId, from, to, playerId, moveNumber, newFen, promotion);
        
        // Aktualizuj grę w bazie danych
        await updateGameInDB(gameId, game);
        
      } catch (error) {
        // Jeśli nie udało się zapisać w DB, cofnij zmiany w pamięci
        game.moveHistory.pop();
        game.fen = game.moveHistory.length > 0 ? 
          game.moveHistory[game.moveHistory.length - 1].fen : 
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        game.currentTurn = game.fen.split(' ')[1];
        throw error;
      }
      
      return { 
        valid: true, 
        fen: game.fen, 
        currentTurn: game.currentTurn, 
        status: game.status,
        isCheck: moveResult.isCheck,
        isCheckmate: moveResult.isCheckmate,
        isStalemate: moveResult.isStalemate
      };
      
    } catch (error) {
      console.error('Błąd podczas wykonywania ruchu:', error);
      return { valid: false, error: error.message || 'Błąd wykonania ruchu' };
    }
    
  } else if (!from && !to) {
    // Reset/undo - prosty reset
    try {
      // Usuń ruchy z bazy danych
      await clearMovesFromDB(gameId);
      
      // Reset w pamięci
      game.moveHistory = [];
      game.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      game.currentTurn = 'w';
      game.status = 'ongoing';
      
      // Aktualizuj grę w bazie danych
      await updateGameInDB(gameId, game);
      
      return { 
        valid: true, 
        fen: game.fen, 
        currentTurn: game.currentTurn, 
        status: game.status 
      };
      
    } catch (error) {
      console.error('Błąd podczas resetowania gry:', error);
      return { valid: false, error: 'Błąd resetowania gry' };
    }
  }
  
  return { valid: false, error: 'Nieprawidłowe parametry ruchu' };
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
  const { from, to, playerId, promotion } = req.body;
  
  try {
    const result = await validateMove(gameId, from, to, playerId, promotion);
    
    if (result.valid) {
      res.json({ 
        fen: result.fen, 
        currentTurn: result.currentTurn, 
        status: result.status,
        isCheck: result.isCheck,
        isCheckmate: result.isCheckmate,
        isStalemate: result.isStalemate
      });
    } else {
      res.status(400).json({ error: result.error || 'Nieprawidłowy ruch' });
    }
  } catch (error) {
    console.error('Błąd w makeMove:', error);
    res.status(500).json({ error: 'Nie udało się wykonać ruchu' });
  }
};

// Funkcja do pobierania historii ruchów (dodatkowy endpoint)
exports.getMoveHistory = async (req, res) => {
  const { gameId } = req.params;
  
  try {
    const game = await getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Gra nie znaleziona' });
    }
    
    res.json({ 
      gameId: parseInt(gameId),
      moveHistory: game.moveHistory 
    });
  } catch (error) {
    console.error('Błąd w getMoveHistory:', error);
    res.status(500).json({ error: 'Nie udało się pobrać historii ruchów' });
  }
};

// Eksport funkcji pomocniczych
exports.loadActiveGamesFromDB = loadActiveGamesFromDB;
exports.getActiveGames = () => activeGames;
exports.validateMove = validateMove;