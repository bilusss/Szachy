const { pool } = require('../services/db');

let activeGames = new Map(); // Mapa przechowująca stany gier (gameId -> gameState)

const initializeGame = async (gameId, whitePlayerId, blackPlayerId) => {
  const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const gameState = {
    fen: initialFen,
    currentTurn: 'w',
    whitePlayerId,
    blackPlayerId,
    moveHistory: [],
    status: blackPlayerId === 'bot' ? 'ongoing' : 'waiting',
  };
  activeGames.set(gameId, gameState);

  try {
    await pool.query(
      `INSERT INTO games (id, white_player_id, black_player_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [gameId, whitePlayerId, blackPlayerId === 'bot' ? null : blackPlayerId, gameState.status]
    );
  } catch (error) {
    console.error('Error saving game to database:', error);
    throw error;
  }

  return gameState;
};

const validateMove = (gameId, from, to, playerId) => {
  const game = activeGames.get(gameId);
  if (!game) return { valid: true, fen: game?.fen || 'start', currentTurn: 'w', status: 'ongoing' }; // Brak gry

  // Zapis ruchu bez walidacji
  if (from && to) {
    game.moveHistory.push({ from, to, playerId, timestamp: new Date() });
    game.currentTurn = game.currentTurn === 'w' ? 'b' : 'w';
  } else if (!from && !to) {
    // Reset/undo - prosty reset
    game.moveHistory = [];
    game.fen = 'rnbqkbnr/pppp1ppp/5n2/5p2/5P2/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 2';
    game.currentTurn = 'w';
  }
  return { valid: true, fen: game.fen, currentTurn: game.currentTurn, status: game.status };
};

exports.createGame = async (req, res) => {
  const { playerId, gameType } = req.body;
  if (!playerId || !gameType) {
    return res.status(400).json({ error: 'playerId and gameType are required' });
  }
  const gameId = Date.now().toString();
  try {
    const blackPlayerId = gameType === 'bot' ? 'bot' : null;
    const gameState = await initializeGame(gameId, playerId, blackPlayerId);
    res.status(201).json({
      gameId,
      fen: gameState.fen,
      currentTurn: gameState.currentTurn,
      status: gameState.status,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create game' });
  }
};

exports.joinGame = async (req, res) => {
  const { gameId } = req.params;
  const { userId } = req.body;
  const game = activeGames.get(gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.blackPlayerId) return res.status(400).json({ error: 'Game is full' });
  game.blackPlayerId = userId;
  res.json({ message: 'Joined game', fen: game.fen });
};

exports.makeMove = async (req, res) => {
  const { gameId } = req.params;
  const { from, to, playerId } = req.body;
  const game = activeGames.get(gameId) || initializeGame(gameId, playerId, 'computer');
  const { valid, fen, currentTurn, status } = validateMove(gameId, from, to, playerId);
  if (valid) {
    res.json({ fen, currentTurn, status });
  } else {
    res.status(400).json({ error: 'Invalid move' });
  }
};