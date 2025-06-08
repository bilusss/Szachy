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
  if (!game) return { valid: false, message: 'Game not found' };

  // Placeholder: Prosta walidacja (pełna logika wymaga sprawdzenia reguł szachów)
  const isWhiteTurn = game.currentTurn === 'w';
  const isWhitePlayer = game.whitePlayerId === playerId;
  if ((isWhiteTurn && !isWhitePlayer) || (!isWhiteTurn && isWhitePlayer)) {
    return { valid: false, message: 'Not your turn' };
  }

  // Aktualizacja FEN (placeholder - wymaga pełnej logiki)
  game.moveHistory.push({ from, to, playerId });
  game.currentTurn = game.currentTurn === 'w' ? 'b' : 'w';
  game.fen = updateFen(game.fen, from, to); // Funkcja do zaimplementowania
  return { valid: true, updatedFen: game.fen };
};

const updateFen = (fen, from, to) => {
  // Placeholder: Prosta aktualizacja FEN (pełna logika wymaga parsowania i generowania FEN)
  return fen; // Na razie zwracamy niezmieniony FEN
};

exports.createGame = async (req, res) => {
  const { userId } = req.body; // Pobierz ID użytkownika z tokena (via middleware)
  const gameId = Date.now().toString(); // Prosty generator ID
  initializeGame(gameId, userId, null); // Na razie tylko biały gracz
  res.status(201).json({ gameId });
};

exports.joinGame = async (req, res) => {
  const { gameId } = req.params;
  const { userId } = req.body; // Pobierz ID użytkownika z tokena
  const game = activeGames.get(gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.blackPlayerId) return res.status(400).json({ error: 'Game is full' });
  game.blackPlayerId = userId;
  res.json({ message: 'Joined game', fen: game.fen });
};

exports.makeMove = async (req, res) => {
  const { gameId } = req.params;
  const { from, to, playerId } = req.body;
  const game = activeGames.get(gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const { valid, message, updatedFen } = validateMove(gameId, from, to, playerId);
  if (!valid) return res.status(400).json({ error: message });

  game.fen = updatedFen;
  res.json({ fen: updatedFen, currentTurn: game.currentTurn, status: game.status });
};