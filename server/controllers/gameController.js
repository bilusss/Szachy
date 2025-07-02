const pool = require('../services/db');
const { isLegalMove, makeMove, getGameStatus } = require('../services/chessLogic');
const { parseFen, getLegalMoves, applyMove, boardToFen } = require('../services/chessBoard');

let chessBoard, chessLogic;

try {
  chessBoard = require('../services/chessBoard');
  chessLogic = require('../services/chessLogic');
} catch (error) {
  console.error('Import error chess services:', error);
}

const isSquareAttacked = chessBoard?.isSquareAttacked || chessBoard?.default?.isSquareAttacked;
const findKing = chessBoard?.findKing || chessBoard?.default?.findKing;
const isValidSquare = chessLogic?.isValidSquare || chessLogic?.default?.isValidSquare;
const isInCheck = chessLogic?.isInCheck || chessLogic?.default?.isInCheck;

let activeGames = new Map();

const loadActiveGamesFromDB = async () => {
  try {
    const result = await pool.query(`
      SELECT id, white_player_id, black_player_id, fen, status, created_at, updated_at 
      FROM games 
      WHERE status IN ('ongoing', 'waiting')
      ORDER BY created_at DESC
    `);
    
    console.log(`Loading ${result.rows.length} active games...`);
    
    for (const row of result.rows) {
      const moveHistory = await loadMoveHistoryFromDB(row.id);
      
      const gameState = {
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
      activeGames.set(row.id, gameState);
    }
    
    console.log('Active games loaded');
  } catch (error) {
    console.error('Error loading active games:', error);
  }
};

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
    console.error('Error loading move history:', error);
    return [];
  }
};

const saveMoveToDB = async (gameId, from, to, playerId, moveNumber, newFen, promotion = null) => {
  try {
    await pool.query(`
      INSERT INTO moves (game_id, player_id, from_square, to_square, move_number, fen, promotion, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [gameId, playerId === 'bot' ? null : playerId, from, to, moveNumber, newFen, promotion]);
    
    console.log(`Move saved: game ${gameId}, move ${moveNumber}`);
  } catch (error) {
    console.error('Error saving move:', error);
    throw error;
  }
};

const clearMovesFromDB = async (gameId) => {
  try {
    await pool.query('DELETE FROM moves WHERE game_id = $1', [gameId]);
    console.log(`Moves cleared for game ${gameId}`);
  } catch (error) {
    console.error('Error clearing moves:', error);
    throw error;
  }
};

const updateGameInDB = async (gameId, gameState) => {
  try {
    await pool.query(`
      UPDATE games 
      SET fen = $1, status = $2, updated_at = NOW()
      WHERE id = $3
    `, [gameState.fen, gameState.status, gameId]);
  } catch (error) {
    console.error('Error updating game:', error);
  }
};

const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

const generateRandomBotMove = (fen) => {
  debugLog('Bot move generation started', { fen });
  
  try {
    const currentPlayer = fen.split(' ')[1];
    debugLog('Current player', { currentPlayer });
    
    if (currentPlayer !== 'b') {
      debugLog('Not bot turn', { currentPlayer });
      return null;
    }
    
    const allPossibleMoves = [];
    const squares = [];
    
    for (let file = 'a'; file <= 'h'; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
      for (let rank = 1; rank <= 8; rank++) {
        squares.push(file + rank);
      }
    }
    
    debugLog('Checking squares for legal moves', { totalSquares: squares.length });
    
    for (const square of squares) {
      try {
        if (typeof getLegalMoves === 'function') {
          const moves = getLegalMoves(fen, square);
          if (moves && moves.length > 0) {
            for (const move of moves) {
              if (isLegalMove(fen, square, move)) {
                allPossibleMoves.push({ from: square, to: move });
              }
            }
          }
        }
      } catch (error) {
        // Silent continue for empty squares
      }
    }
    
    debugLog('Legal moves found', { count: allPossibleMoves.length, moves: allPossibleMoves.slice(0, 5) });
    
    if (allPossibleMoves.length === 0) {
      debugLog('No moves found with getLegalMoves, trying basic moves');
      return generateBasicRandomMove(fen, currentPlayer);
    }
    
    const randomIndex = Math.floor(Math.random() * allPossibleMoves.length);
    const selectedMove = allPossibleMoves[randomIndex];
    
    debugLog('Bot selected move', { move: selectedMove, totalOptions: allPossibleMoves.length });
    
    // Double check the selected move is actually legal
    if (!isLegalMove(fen, selectedMove.from, selectedMove.to)) {
      debugLog('Selected move not legal, trying basic moves');
      return generateBasicRandomMove(fen, currentPlayer);
    }
    
    return selectedMove;
    
  } catch (error) {
    debugLog('Error in bot move generation', { error: error.message });
    return generateBasicRandomMove(fen, fen.split(' ')[1]);
  }
};

const generateBasicRandomMove = (fen, currentPlayer) => {
  debugLog('Generating basic random move', { currentPlayer });
  
  const basicMoves = currentPlayer === 'b' ? [
    { from: 'e7', to: 'e5' }, { from: 'd7', to: 'd5' }, { from: 'g8', to: 'f6' },
    { from: 'b8', to: 'c6' }, { from: 'f7', to: 'f5' }, { from: 'c7', to: 'c5' },
    { from: 'a7', to: 'a6' }, { from: 'h7', to: 'h6' }, { from: 'b7', to: 'b6' }
  ] : [
    { from: 'e2', to: 'e4' }, { from: 'd2', to: 'd4' }, { from: 'g1', to: 'f3' },
    { from: 'b1', to: 'c3' }, { from: 'f2', to: 'f4' }, { from: 'c2', to: 'c4' },
    { from: 'a2', to: 'a3' }, { from: 'h2', to: 'h3' }, { from: 'b2', to: 'b3' }
  ];
  
  const legalBasicMoves = basicMoves.filter(move => {
    try {
      return isLegalMove(fen, move.from, move.to);
    } catch (error) {
      return false;
    }
  });
  
  debugLog('Legal basic moves', { count: legalBasicMoves.length, moves: legalBasicMoves });
  
  if (legalBasicMoves.length > 0) {
    const randomMove = legalBasicMoves[Math.floor(Math.random() * legalBasicMoves.length)];
    debugLog('Selected basic move', { move: randomMove });
    return randomMove;
  }
  
  debugLog('No legal moves found for bot');
  return null;
};

const executeBotMove = async (gameId, io) => {
  debugLog('Execute bot move started', { gameId });
  
  try {
    const game = activeGames.get(parseInt(gameId));
    
    if (!game) {
      debugLog('Game not found', { gameId });
      return;
    }
    
    debugLog('Game state before bot move', {
      gameId,
      status: game.status,
      currentTurn: game.currentTurn,
      blackPlayerId: game.blackPlayerId,
      fen: game.fen
    });
    
    if (game.status !== 'ongoing') {
      debugLog('Game not ongoing', { status: game.status });
      return;
    }
    
    if (game.currentTurn !== 'b') {
      debugLog('Not black turn', { currentTurn: game.currentTurn });
      return;
    }
    
    if (game.blackPlayerId !== null && game.blackPlayerId !== 'bot') {
      debugLog('Black player is not bot', { blackPlayerId: game.blackPlayerId });
      return;
    }
    
    const botMove = generateRandomBotMove(game.fen);
    
    if (!botMove) {
      debugLog('Bot cannot make move', { gameId });
      return;
    }
    
    debugLog('Executing bot move', { gameId, move: botMove });
    
    const result = await validateMove(gameId, botMove.from, botMove.to, 'bot');
    
    debugLog('Bot move validation result', { valid: result.valid, error: result.error });
    
    if (result.valid) {
      debugLog('Bot move successful', {
        gameId,
        move: botMove,
        newFen: result.fen,
        newTurn: result.currentTurn,
        status: result.status
      });
      
      const gameState = {
        fen: result.fen,
        currentTurn: result.currentTurn,
        status: result.status,
        gameId: parseInt(gameId),
        isCheck: result.isCheck,
        isCheckmate: result.isCheckmate,
        isStalemate: result.isStalemate,
        winner: result.winner,
        lastMove: { from: botMove.from, to: botMove.to },
        botMove: true
      };
      
      if (io) {
        io.to(gameId.toString()).emit('gameState', gameState);
        debugLog('Game state emitted to clients', { gameId });
        
        if (result.status === 'finished' || result.status === 'draw') {
          io.to(gameId.toString()).emit('gameEnded', {
            status: result.status,
            winner: result.winner,
            reason: result.isCheckmate ? 'checkmate' : 
                   result.isStalemate ? 'stalemate' : 'other'
          });
          debugLog('Game ended event emitted', { gameId, status: result.status });
        }
      }
      
    } else {
      debugLog('Bot move failed', {
        gameId,
        move: botMove,
        error: result.error
      });
    }
    
  } catch (error) {
    debugLog('Error in executeBotMove', {
      gameId,
      error: error.message,
      stack: error.stack
    });
  }
};

const initializeGame = async (whitePlayerId, blackPlayerId) => {
  const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const status = blackPlayerId === 'bot' ? 'ongoing' : 'waiting';
  
  try {
    debugLog('Initialize game', { whitePlayerId, blackPlayerId, status });
    
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
    debugLog('Game created', { gameId, gameState });
    
    return gameState;
  } catch (error) {
    debugLog('Error creating game', { error: error.message });
    throw error;
  }
};

const getGame = async (gameId) => {
  let game = activeGames.get(parseInt(gameId));
  
  if (!game) {
    try {
      const result = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
      
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
        debugLog('Game loaded from DB', { gameId });
      }
    } catch (error) {
      debugLog('Error getting game from DB', { gameId, error: error.message });
    }
  }
  
  return game;
};

const validateMove = async (gameId, from, to, playerId, promotion = null) => {
  debugLog('Validate move', { gameId, from, to, playerId, promotion });
  
  const game = await getGame(gameId);
  if (!game) {
    return { valid: false, error: 'Game not found' };
  }

  if (game.status !== 'ongoing') {
    return { valid: false, error: 'Game not active' };
  }

  const currentPlayerColor = game.currentTurn;
  const isWhitePlayer = playerId === game.whitePlayerId || (playerId === 'bot' && game.whitePlayerId === null);
  const isBlackPlayer = playerId === game.blackPlayerId || (playerId === 'bot' && game.blackPlayerId === null);
  
  debugLog('Player validation', {
    currentPlayerColor,
    isWhitePlayer,
    isBlackPlayer,
    playerId,
    whitePlayerId: game.whitePlayerId,
    blackPlayerId: game.blackPlayerId
  });

  if (from && to) {
    try {
      if (!isLegalMove(game.fen, from, to)) {
        debugLog('Illegal move detected', { from, to, fen: game.fen });
        return { valid: false, error: 'Illegal move' };
      }

      const moveResult = makeMove(game.fen, from, to, promotion);
      const newFen = moveResult.newFen;
      const gameStatus = getGameStatus(newFen);
      
      const moveNumber = game.moveHistory.length + 1;
      const moveData = { 
        from, to, playerId, moveNumber, promotion, fen: newFen, timestamp: new Date() 
      };
      
      game.moveHistory.push(moveData);
      game.fen = newFen;
      game.currentTurn = newFen.split(' ')[1];
      
      if (gameStatus !== 'ongoing') {
        game.status = gameStatus;
      }
      
      try {
        await saveMoveToDB(gameId, from, to, playerId, moveNumber, newFen, promotion);
        await updateGameInDB(gameId, game);
      } catch (error) {
        game.moveHistory.pop();
        game.fen = game.moveHistory.length > 0 ? 
          game.moveHistory[game.moveHistory.length - 1].fen : 
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        game.currentTurn = game.fen.split(' ')[1];
        throw error;
      }
      
      debugLog('Move validated successfully', {
        gameId, from, to, newFen: newFen.substring(0, 20) + '...', 
        currentTurn: game.currentTurn, status: game.status
      });
      
      return { 
        valid: true, fen: game.fen, currentTurn: game.currentTurn, status: game.status,
        isCheck: moveResult.isCheck, isCheckmate: moveResult.isCheckmate,
        isStalemate: moveResult.isStalemate, winner: moveResult.winner
      };
      
    } catch (error) {
      debugLog('Error validating move', { gameId, from, to, error: error.message });
      return { valid: false, error: error.message || 'Move execution error' };
    }
    
  } else if (!from && !to) {
    try {
      await clearMovesFromDB(gameId);
      
      game.moveHistory = [];
      game.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      game.currentTurn = 'w';
      game.status = 'ongoing';
      
      await updateGameInDB(gameId, game);
      
      debugLog('Game reset', { gameId });
      
      return { valid: true, fen: game.fen, currentTurn: game.currentTurn, status: game.status };
      
    } catch (error) {
      debugLog('Error resetting game', { gameId, error: error.message });
      return { valid: false, error: 'Reset error' };
    }
  }
  
  return { valid: false, error: 'Invalid move parameters' };
};

const handleSocketConnection = (io) => {
  return (socket) => {
    debugLog('New socket connection', { socketId: socket.id });
    
    socket.on('joinGame', async (gameId) => {
      try {
        socket.join(gameId.toString());
        const game = activeGames.get(parseInt(gameId));
        
        if (game) {
          debugLog('User joined game', { socketId: socket.id, gameId });
          
          let isCurrentPlayerInCheck = false;
          let gameStatus = 'ongoing';
          
          io.to(gameId.toString()).emit('gameState', {
            fen: game.fen,
            currentTurn: game.currentTurn,
            status: game.status,
            gameId: game.gameId,
            isCheck: isCurrentPlayerInCheck,
            gameStatus: gameStatus
          });
        } else {
          socket.emit('error', { message: 'Game not found' });
        }
      } catch (error) {
        debugLog('Error in joinGame socket', { error: error.message });
        socket.emit('error', { message: 'Error joining game' });
      }
    });

    socket.on('move', async ({ gameId, from, to, playerId, promotion }) => {
      try {
        debugLog('Move socket event', { gameId, from, to, playerId, promotion });
        
        const result = await validateMove(gameId, from, to, playerId, promotion);
        
        if (result.valid) {
          const gameState = {
            fen: result.fen,
            currentTurn: result.currentTurn,
            status: result.status,
            gameId: parseInt(gameId),
            isCheck: result.isCheck,
            isCheckmate: result.isCheckmate,
            isStalemate: result.isStalemate,
            winner: result.winner,
            lastMove: { from, to }
          };
          
          io.to(gameId.toString()).emit('gameState', gameState);
          socket.emit('moveConfirmed', { from, to, promotion, timestamp: new Date().toISOString() });
          
          debugLog('Game state updated and sent', { gameId, currentTurn: result.currentTurn });
          
          if (result.status === 'finished' || result.status === 'draw') {
            io.to(gameId.toString()).emit('gameEnded', {
              status: result.status,
              winner: result.winner,
              reason: result.isCheckmate ? 'checkmate' : 
                     result.isStalemate ? 'stalemate' : 'other'
            });
          } else {
            const game = activeGames.get(parseInt(gameId));
            const isBotGame = game && (game.blackPlayerId === null || game.blackPlayerId === 'bot');
            const isBotTurn = game && game.currentTurn === 'b';
            
            debugLog('Checking bot move conditions', {
              gameId, isBotGame, isBotTurn, status: game?.status,
              blackPlayerId: game?.blackPlayerId, currentTurn: game?.currentTurn
            });
            
            if (game && game.status === 'ongoing' && isBotTurn && isBotGame) {
              debugLog('Scheduling bot move', { gameId });
              setTimeout(() => {
                executeBotMove(gameId, io);
              }, 1500);
            }
          }
          
        } else {
          socket.emit('moveError', { message: result.error || 'Invalid move', from, to });
          debugLog('Move rejected', { gameId, from, to, error: result.error });
        }
      } catch (error) {
        debugLog('Error in move socket', { error: error.message });
        socket.emit('moveError', { message: 'Move execution error', from, to });
      }
    });
    
    socket.on('getLegalMoves', ({ gameId, square, playerId }) => {
      try {
        const game = activeGames.get(parseInt(gameId));
        
        if (!game) {
          socket.emit('legalMovesError', { message: 'Game not found' });
          return;
        }
        
        const validateSquareFormat = (square) => {
          if (typeof isValidSquare === 'function') {
            return isValidSquare(square);
          }
          return /^[a-h][1-8]$/.test(square);
        };
        
        if (!validateSquareFormat(square)) {
          socket.emit('legalMovesError', { message: 'Invalid square format' });
          return;
        }
        
        let legalMoves = [];
        if (typeof getLegalMoves === 'function') {
          legalMoves = getLegalMoves(game.fen, square);
        }
        
        socket.emit('legalMoves', {
          square, moves: legalMoves, gameId: parseInt(gameId),
          functionAvailable: typeof getLegalMoves === 'function'
        });
        
      } catch (error) {
        debugLog('Error getting legal moves', { error: error.message });
        socket.emit('legalMovesError', { message: 'Server error' });
      }
    });

    socket.on('disconnect', () => {
      debugLog('User disconnected', { socketId: socket.id });
    });
  };
};

exports.createGame = async (req, res) => {
  const { playerId, gameType } = req.body;
  
  if (!playerId || !gameType) {
    return res.status(400).json({ error: 'playerId and gameType required' });
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
    debugLog('Error in createGame', { error: error.message });
    res.status(500).json({ error: 'Failed to create game' });
  }
};

exports.joinGame = async (req, res) => {
  const { gameId } = req.params;
  const { userId } = req.body;
  
  try {
    const game = await getGame(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (game.blackPlayerId && game.blackPlayerId !== 'bot') {
      return res.status(400).json({ error: 'Game is full' });
    }
    
    if (game.status === 'waiting') {
      game.blackPlayerId = userId;
      game.status = 'ongoing';
      await updateGameInDB(gameId, game);
    }
    
    res.json({ 
      message: 'Joined game',
      fen: game.fen,
      currentTurn: game.currentTurn,
      status: game.status
    });
  } catch (error) {
    debugLog('Error in joinGame', { error: error.message });
    res.status(500).json({ error: 'Failed to join game' });
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
      res.status(400).json({ error: result.error || 'Invalid move' });
    }
  } catch (error) {
    debugLog('Error in makeMove', { error: error.message });
    res.status(500).json({ error: 'Failed to make move' });
  }
};

exports.getMoveHistory = async (req, res) => {
  const { gameId } = req.params;
  
  try {
    const game = await getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json({ 
      gameId: parseInt(gameId),
      moveHistory: game.moveHistory 
    });
  } catch (error) {
    debugLog('Error in getMoveHistory', { error: error.message });
    res.status(500).json({ error: 'Failed to get move history' });
  }
};

exports.loadActiveGamesFromDB = loadActiveGamesFromDB;
exports.getActiveGames = () => activeGames;
exports.validateMove = validateMove;
exports.handleSocketConnection = handleSocketConnection;
exports.executeBotMove = executeBotMove;