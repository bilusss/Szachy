const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// POST /game/create - Tworzenie nowej gry
router.post('/create', gameController.createGame);

// POST /game/:gameId/join - Dołączanie do gry
router.post('/:gameId/join', gameController.joinGame);

// POST /game/:gameId/move - Wykonanie ruchu
router.post('/:gameId/move', gameController.makeMove);

// GET /game/:gameId - Pobranie stanu gry (opcjonalnie)
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { getActiveGames } = require('../controllers/gameController');
    const activeGames = getActiveGames();
    const game = activeGames.get(parseInt(gameId));
    
    if (!game) {
      return res.status(404).json({ error: 'Gra nie znaleziona' });
    }
    
    res.json({
      gameId: game.gameId,
      fen: game.fen,
      currentTurn: game.currentTurn,
      status: game.status,
      whitePlayer: game.whitePlayerId,
      blackPlayer: game.blackPlayerId
    });
  } catch (error) {
    console.error('Błąd pobierania gry:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;