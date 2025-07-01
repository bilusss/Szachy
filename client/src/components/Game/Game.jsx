import { useParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import king from '../../assets/king.svg';
import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { joinGame, makeMove } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

function Game() {
  const { gameId } = useParams();
  const { user } = useContext(AuthContext);

  const [gameState, setGameState] = useState({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    currentTurn: 'w',
    status: 'ongoing',
  });
  const [computerLevel, setComputerLevel] = useState('Easy 🤓');
  const chessboardRef = useRef(null);
  const containerRef = useRef(null);
  const [currentTimeout, setCurrentTimeout] = useState(null);
  const [boardWidth, setBoardWidth] = useState(calculateBoardWidth());
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionMove, setPromotionMove] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    if (user?.userId) {
      setPlayerId(user.userId);
    }
  }, [user]);

  // Calculate chessboard width
  function calculateBoardWidth() {
    if (!containerRef.current) return 300;
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const padding = 64;
    const maxWidth = 600;
    const minWidth = 280;
    return Math.min(Math.max(containerWidth - padding, minWidth), maxWidth);
  }

  // Update width on window resize
  useEffect(() => {
    const handleResize = () => {
      setBoardWidth(calculateBoardWidth());
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Safe state mutation
  const safeGameMutate = useCallback((modify) => {
    setGameState((prev) => {
      const update = { ...prev };
      modify(update);
      return update;
    });
  }, []);
  
  // Computer move - przeniesiono wyżej, aby było dostępne dla executeMoveWithPromotion
  const makeComputerMove = useCallback(() => {
    // Tutaj możesz użyć bardziej złożonej logiki dla ruchów komputera
    // Obecnie uses gameState.fen, ale nie ma prawdziwej logiki gry
    const game = { fen: gameState.fen, moves: () => ['e2e4', 'd2d4'] }; // To jest placeholder
    const possibleMoves = game.moves ? game.moves() : ['e2e4', 'd2d4'];
    if (gameState.status === 'ongoing' && gameState.currentTurn === 'b') {
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      const move = possibleMoves[randomIndex];
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      const promotion = move.length > 4 ? move.substring(4) : null;
      makeMove(gameId, from, to, null, (state) => { // Dla bota playerId jest null
        safeGameMutate((gameState) => {
          gameState.fen = state.fen;
          gameState.currentTurn = state.currentTurn;
          gameState.status = state.status;
        });
      }, promotion);
    }
  }, [gameId, gameState.fen, gameState.currentTurn, gameState.status, safeGameMutate]); // Dodano safeGameMutate do zależności

  // Execute move with promotion - teraz przyjmuje playerId jako argument
  const executeMoveWithPromotion = useCallback(
    (from, to, promotion = 'q', currentPlayerId) => { // Dodano currentPlayerId
      if (!currentPlayerId) {
        console.warn('executeMoveWithPromotion: currentPlayerId jest null. Nie można wykonać ruchu.');
        return;
      }

      makeMove(gameId, from, to, currentPlayerId, (state) => { // Używamy przekazanego currentPlayerId
        safeGameMutate((gameState) => {
          gameState.fen = state.fen;
          gameState.currentTurn = state.currentTurn;
          gameState.status = state.status;
        });
      }, promotion);

      if (gameState.status === 'ongoing') {
        const newTimeout = setTimeout(makeComputerMove, 1000);
        setCurrentTimeout(newTimeout);
      }
    },
    [gameId, gameState.status, makeComputerMove, safeGameMutate] // Dodano safeGameMutate do zależności
  );

  // Handle promotion selection
  const handlePromotionSelect = (pieceType) => {
    if (promotionMove && playerId) { // Sprawdź, czy playerId jest dostępne
      executeMoveWithPromotion(promotionMove.from, promotionMove.to, pieceType, playerId); // Przekazujemy playerId
      setShowPromotionDialog(false);
      setPromotionMove(null);
    }
  };


  // Join game
  useEffect(() => {
    if (gameId) {
      joinGame(gameId, (state) => {
        safeGameMutate((gameState) => {
          gameState.fen = state.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
          gameState.currentTurn = state.currentTurn || 'w';
          gameState.status = state.currentTurn ? state.status : 'waiting';
        });
      });
    }
  }, [gameId, safeGameMutate]); // Dodano safeGameMutate do zależności

  // Handle bot moves
  useEffect(() => {
    if (gameState.currentTurn === 'b' && gameState.status === 'ongoing') {
      const timeout = setTimeout(makeComputerMove, 1000);
      setCurrentTimeout(timeout);
    }
  }, [gameId, gameState.currentTurn, gameState.status, makeComputerMove]); // Dodano currentTimeout do zależności, aby hook prawidłowo reagował na jego zmiany

  // Handle piece drop
  const onDrop = useCallback(
    (sourceSquare, targetSquare, piece) => {
      const isPawnPromotion = (sq1, sq2, p) => {
      const pawn = p.toLowerCase().includes('p');
      const whitePawn = p === 'wP';
      const blackPawn = p === 'bP';
      const targetRank = sq2[1];
      return pawn && (
        (whitePawn && targetRank === '8') ||
        (blackPawn && targetRank === '1')
      );
    };
      // Jeśli playerId nie jest dostępne, blokujemy ruch
      if (!playerId) {
        console.warn('onDrop: Player ID jest niedostępne. Nie można wykonać ruchu.');
        return false;
      }
      if (gameState.currentTurn !== 'w') return false;

      // Sprawdź czy to promocja pionka
      if (isPawnPromotion(sourceSquare, targetSquare, piece)) {
        setPromotionMove({ from: sourceSquare, to: targetSquare });
        setShowPromotionDialog(true);
        return true; // Pozwól na ruch, ale pokaż dialog promocji
      }

      // Normalny ruch bez promocji
      executeMoveWithPromotion(sourceSquare, targetSquare, 'q', playerId); // !!! Przekazujemy aktualne playerId
      return true;
    },
    [gameState.currentTurn, executeMoveWithPromotion, playerId] // Dodano playerId do zależności
  );

  // Reset game
  const resetGame = useCallback(() => { // Dodano useCallback
    safeGameMutate((gameState) => {
      gameState.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      gameState.currentTurn = 'w';
      gameState.status = 'ongoing';
    });
    chessboardRef.current?.clearPremoves();
    clearTimeout(currentTimeout);
    setShowPromotionDialog(false);
    setPromotionMove(null);
    // Upewnij się, że playerId jest dostępne przed wywołaniem makeMove
    if (playerId) {
      makeMove(gameId, null, null, playerId, (state) => {
        setGameState(state);
      });
    } else {
      console.warn('resetGame: Player ID jest null. Nie można wysłać ruchu resetującego.');
    }
  }, [gameId, playerId, currentTimeout, safeGameMutate]); // Dodano zależności

  // Undo move
  const undoMove = useCallback(() => { // Dodano useCallback
    safeGameMutate((gameState) => {
      gameState.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      gameState.currentTurn = 'w';
      gameState.status = 'ongoing';
    });
    chessboardRef.current?.clearPremoves();
    clearTimeout(currentTimeout);
    setShowPromotionDialog(false);
    setPromotionMove(null);
    // Upewnij się, że playerId jest dostępne przed wywołaniem makeMove
    if (playerId) {
      makeMove(gameId, null, null, playerId, (state) => {
        setGameState(state);
      });
    } else {
      console.warn('undoMove: Player ID jest null. Nie można wysłać ruchu cofającego.');
    }
  }, [gameId, playerId, currentTimeout, safeGameMutate]); // Dodano zależności

  // Promotion pieces for selection
  const promotionPieces = [
    { type: 'q', name: 'Queen', symbol: '♕' },
    { type: 'r', name: 'Rook', symbol: '♖' },
    { type: 'b', name: 'Bishop', symbol: '♗' },
    { type: 'n', name: 'Knight', symbol: '♘' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
      <header className="w-full bg-gray-800 bg-opacity-90 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <div className="flex items-center space-x-3">
          <img src={king} alt="ChessVerse Logo" className="w-8 h-8" />
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            ChessVerse
          </h1>
        </div>
        <span className="text-gray-300 text-sm">Game ID: {gameId}</span>
      </header>

      <main className="p-4 w-full flex flex-col items-center gap-6">
        <div ref={containerRef} className="max-w-[calc(100vw-2rem)] bg-gray-800 bg-opacity-70 rounded-lg shadow-lg p-4 border border-cyan-500/20">
          <Chessboard
            position={gameState.fen || 'start'}
            onPieceDrop={onDrop}
            boardWidth={boardWidth}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            }}
            customDarkSquareStyle={{ backgroundColor: '#4b7399' }}
            customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
            arePremovesAllowed={true}
            isDraggablePiece={({ piece }) => piece[0] === 'w'}
            ref={chessboardRef}
            customDropSquareStyle={{ boxShadow: 'inset 0 0 1px 3px rgba(0, 255, 255, 0.5)' }}
            customDragOverSquareStyle={{ backgroundColor: 'rgba(0, 255, 255, 0.2)' }}
          />

          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {['Easy 🤓', 'Medium 🧐', 'Hard 😵'].map((level) => (
              <button
                key={level}
                onClick={() => setComputerLevel(level)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  computerLevel === level
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                {level}
              </button>
            ))}
            <button
              onClick={resetGame}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:shadow-lg transition-all duration-200"
            >
              New Game
            </button>
            <button
              onClick={undoMove}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all duration-200"
            >
              Undo
            </button>
          </div>
        </div>
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-4 shadow-lg border border-purple-500/20">
          <h2 className="text-center text-gray-300 font-semibold mb-2">Chat</h2>
          <div className="h-48 bg-gray-900 rounded-md p-3 text-gray-400 text-sm overflow-y-auto">
            <p className="text-center">No messages yet</p>
          </div>
        </div>
      </main>

      {/* Promotion Dialog */}
      {showPromotionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-cyan-500/30">
            <h3 className="text-xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Choose Promotion Piece
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {promotionPieces.map((piece) => (
                <button
                  key={piece.type}
                  onClick={() => handlePromotionSelect(piece.type)}
                  className="flex flex-col items-center p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  <span className="text-4xl mb-2">{piece.symbol}</span>
                  <span className="text-sm text-gray-300">{piece.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;