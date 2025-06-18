const { pool } = require('../services/db');

let activeGames = new Map(); // Mapa przechowująca stany gier (gameId -> gameState)

const initializeGame = (gameId, whitePlayerId, blackPlayerId) => {
  const initialFen = 'rnbqkbnr/pppp1ppp/5n2/5p2/5P2/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 2';
  activeGames.set(gameId, {
    fen: initialFen,
    currentTurn: 'w',
    whitePlayerId,
    blackPlayerId,
    moveHistory: [],
    status: 'ongoing',
  });
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
  const { userId } = req.body;
  const gameId = Date.now().toString();
  initializeGame(gameId, userId, null);
  res.status(201).json({ gameId });
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