import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import king from '../../assets/king.svg';
import { useState, useEffect, useCallback, useRef, useContext } from 'react';
// import { joinGame, makeMove } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import socket from '../../services/api';

function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  const [gameState, setGameState] = useState({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    currentTurn: 'w',
    status: 'ongoing',
  });
  const [computerLevel, setComputerLevel] = useState('Easy 🤓');
  const chessboardRef = useRef(null);
  const containerRef = useRef(null);
  const [boardWidth, setBoardWidth] = useState(300);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionMove, setPromotionMove] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const hasJoinedRef = useRef(false);
  const [gameMessage, setGameMessage] = useState('');
  const [isGameEnded, setIsGameEnded] = useState(false);
  
  // Nowy stan do wymuszania re-renderowania szachownicy
  const [boardKey, setBoardKey] = useState(0);
  const [pendingMove, setPendingMove] = useState(null);

  // Authentication check
  useEffect(() => {
    // Sprawdzenie czy użytkownik jest zalogowany
    if (!loading && !isAuthenticated) {
      navigate('/login'); // Przekieruj do strony logowania jeśli nie zalogowany
      return;
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (user?.userId) {
      setPlayerId(user.userId);
    }
  }, [user]);

  // Calculate chessboard width
function calculateBoardWidthWithHeight() {
  if (!containerRef.current) {
    return 400;
  }
  
  const containerWidth = containerRef.current.getBoundingClientRect().width;
  const viewportHeight = window.innerHeight;
  const padding = 32;
  const maxWidth = 600;
  const minWidth = 280;
  
  // Oblicz dostępną szerokość kontenera
  const availableWidth = containerWidth - padding;
  
  // Oblicz maksymalną szerokość na podstawie wysokości (z większym marginesem)
  const maxHeightBasedWidth = viewportHeight * 1; // zwiększone z 0.5 na 0.7
  
  // Zwróć szerokość ograniczoną przez wszystkie czynniki
  return Math.min(
    Math.max(availableWidth, minWidth),
    maxWidth,
    maxHeightBasedWidth
  );
}

  // Update width on window resize and mount
  useEffect(() => {
    const handleResize = () => {
      setBoardWidth(calculateBoardWidthWithHeight());
    };
    
    // Ustaw szerokość natychmiast
    handleResize();
    
    // Dodaj listener na resize
    window.addEventListener('resize', handleResize);
    
    // Również reaguj na zmiany orientacji na urządzeniach mobilnych
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Dodatkowo, aktualizuj szerokość gdy kontener się zmieni
  useEffect(() => {
    if (containerRef.current) {
      setBoardWidth(calculateBoardWidthWithHeight());
    }
  }, [containerRef.current]);

  // Funkcja do resetowania stanu szachownicy
  const resetBoardState = useCallback(() => {
    setBoardKey(prev => prev + 1);
    setPendingMove(null);
  }, []);

  // Socket event listeners setup
  useEffect(() => {
    if (!gameId) return;

    // Handle game state updates from server
    const handleGameState = (state) => {
      console.log('Otrzymano stan gry z serwera:', state);
      setGameState({
        fen: state.fen,
        currentTurn: state.currentTurn,
        status: state.status,
        isCheck: state.isCheck,
        isCheckmate: state.isCheckmate,
        isStalemate: state.isStalemate,
        winner: state.winner,
        lastMove: state.lastMove
      });

      // Wyczyść pending move jeśli ruch został zaakceptowany
      if (pendingMove) {
        setPendingMove(null);
      }

      // Pokaż komunikat jeśli gra się skończyła
      if (state.status === 'finished' || state.status === 'draw') {
        setIsGameEnded(true);
        if (state.isCheckmate) {
          setGameMessage(`Checkmate! ${state.winner === 'white' ? 'White' : 'Black'} wins!`);
        } else if (state.isStalemate) {
          setGameMessage('Stalemate! It\'s a draw.');
        }
      } else if (state.isCheck) {
        setGameMessage(`${state.currentTurn === 'w' ? 'White' : 'Black'} is in check!`);
        setTimeout(() => setGameMessage(''), 3000);
      } else {
        setGameMessage('');
      }
    };

    // Handle move confirmations
    const handleMoveConfirmed = (moveData) => {
      console.log('Ruch potwierdzony:', moveData);
      setPendingMove(null);
    };

    // Handle move errors
    const handleMoveError = (error) => {
      console.error('Błąd ruchu:', error);
      setGameMessage(`Move error: ${error.message}`);
      setTimeout(() => setGameMessage(''), 3000);
      
      // Resetuj stan szachownicy po błędzie ruchu
      resetBoardState();
    };

    // Handle game ended
    const handleGameEnded = (endData) => {
      console.log('Gra zakończona:', endData);
      setIsGameEnded(true);
      if (endData.reason === 'checkmate') {
        setGameMessage(`Checkmate! ${endData.winner === 'white' ? 'White' : 'Black'} wins!`);
      } else if (endData.reason === 'stalemate') {
        setGameMessage('Stalemate! It\'s a draw.');
      } else {
        setGameMessage('Game ended.');
      }
    };

    // Handle general errors
    const handleError = (error) => {
      console.error('Socket error:', error);
      setGameMessage(`Error: ${error.message}`);
      setTimeout(() => setGameMessage(''), 5000);
      
      // Resetuj stan szachownicy po błędzie
      resetBoardState();
    };

    // Register socket listeners
    socket.on('gameState', handleGameState);
    socket.on('moveConfirmed', handleMoveConfirmed);
    socket.on('moveError', handleMoveError);
    socket.on('gameEnded', handleGameEnded);
    socket.on('error', handleError);

    // Cleanup function
    return () => {
      socket.off('gameState', handleGameState);
      socket.off('moveConfirmed', handleMoveConfirmed);
      socket.off('moveError', handleMoveError);
      socket.off('gameEnded', handleGameEnded);
      socket.off('error', handleError);
    };
  }, [gameId, pendingMove, resetBoardState]);

  // Execute move with promotion
  const executeMoveWithPromotion = useCallback(
    (from, to, promotion = null, currentPlayerId) => {
      if (!currentPlayerId) {
        console.warn('executeMoveWithPromotion: currentPlayerId jest null. Nie można wykonać ruchu.');
        setGameMessage('Player ID not available. Cannot make move.');
        setTimeout(() => setGameMessage(''), 3000);
        return;
      }

      console.log(`Wysyłanie ruchu: ${from} -> ${to}`, { gameId, from, to, currentPlayerId, promotion });
      
      // Zapisz pending move
      setPendingMove({ from, to, promotion });
      
      // Wyślij ruch do serwera przez socket
      socket.emit('move', { 
        gameId: parseInt(gameId), 
        from, 
        to, 
        playerId: currentPlayerId, 
        promotion 
      });
    },
    [gameId]
  );

  // Handle promotion selection
  const handlePromotionSelect = (pieceType) => {
    if (promotionMove && playerId) {
      executeMoveWithPromotion(promotionMove.from, promotionMove.to, pieceType, playerId);
      setShowPromotionDialog(false);
      setPromotionMove(null);
    }
  };

  // Join game
  useEffect(() => {
    if (gameId && !hasJoinedRef.current && isAuthenticated) {
      hasJoinedRef.current = true;
      
      console.log(`Dołączanie do gry ${gameId}`);
      socket.emit('joinGame', parseInt(gameId));
    }
    
    return () => {
      hasJoinedRef.current = false;
    };
  }, [gameId, isAuthenticated]);

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

      if (!playerId) {
        console.warn('onDrop: Player ID jest niedostępne. Nie można wykonać ruchu.');
        setGameMessage('Player not authenticated. Cannot make move.');
        setTimeout(() => setGameMessage(''), 3000);
        return false;
      }

      // Sprawdź czy to kolejka gracza
      if (gameState.currentTurn !== 'w') {
        setGameMessage('Not your turn!');
        setTimeout(() => setGameMessage(''), 2000);
        return false;
      }

      // Sprawdź czy gra jest aktywna
      if (gameState.status !== 'ongoing') {
        setGameMessage('Game is not active.');
        setTimeout(() => setGameMessage(''), 2000);
        return false;
      }

      // Jeśli mamy pending move, nie pozwól na kolejny ruch
      if (pendingMove) {
        setGameMessage('Please wait for the current move to be processed.');
        setTimeout(() => setGameMessage(''), 2000);
        return false;
      }

      if (isPawnPromotion(sourceSquare, targetSquare, piece)) {
        setPromotionMove({ from: sourceSquare, to: targetSquare });
        setShowPromotionDialog(true);
        return true;
      }

      executeMoveWithPromotion(sourceSquare, targetSquare, null, playerId);
      return true;
    },
    [gameState.currentTurn, gameState.status, executeMoveWithPromotion, playerId, pendingMove]
  );

  // Promotion pieces for selection
  const promotionPieces = [
    { type: 'q', name: 'Queen', symbol: '♕' },
    { type: 'r', name: 'Rook', symbol: '♖' },
    { type: 'b', name: 'Bishop', symbol: '♗' },
    { type: 'n', name: 'Knight', symbol: '♘' }
  ];

  // Don't render anything if not authenticated or still loading
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center relative">
      {/* Floating Game Message - Fixed position at top */}
      {gameMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-pulse">
          <div className={`px-6 py-3 rounded-lg shadow-lg border-2 font-semibold text-center max-w-sm ${
            isGameEnded 
              ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-purple-400' 
              : gameMessage.includes('check') 
                ? 'bg-red-600 text-white border-red-400'
                : gameMessage.includes('error') || gameMessage.includes('Error')
                  ? 'bg-red-700 text-white border-red-500'
                  : 'bg-yellow-600 text-black border-yellow-400'
          }`}>
            {gameMessage}
          </div>
        </div>
      )}

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
        {/* Game Status */}
        <div className="w-full max-w-md bg-gray-800 bg-opacity-70 rounded-lg p-3 text-center border border-purple-500/20">
          <p className="text-sm text-gray-300">
            Current Turn: <span className="font-semibold text-white">
              {gameState.currentTurn === 'w' ? 'White (You)' : 'Black (Bot)'}
            </span>
          </p>
          <p className="text-sm text-gray-300">
            Status: <span className="font-semibold text-white">{gameState.status}</span>
          </p>
          {pendingMove && (
            <p className="text-sm text-yellow-400">
              Processing move: {pendingMove.from} → {pendingMove.to}
            </p>
          )}
        </div>

        {/* Chessboard Container - teraz w pełni responsywny */}
        <div 
          ref={containerRef} 
          className="w-full max-w-2xl px-4 bg-gray-800 bg-opacity-70 rounded-lg shadow-lg py-4 border border-cyan-500/20"
        >
          <div className="flex justify-center items-center">
            <Chessboard
              key={boardKey} // Kluczowy dodatek - wymusza re-render
              position={gameState.fen || 'start'}
              onPieceDrop={onDrop}
              boardWidth={boardWidth}
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              }}
              customDarkSquareStyle={{ backgroundColor: '#4b7399' }}
              customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
              arePremovesAllowed={false} // Wyłącz premoves
              isDraggablePiece={({ piece }) => piece[0] === 'w' && !pendingMove} // Zablokuj przeciąganie podczas pending move
              ref={chessboardRef}
              customDropSquareStyle={{ boxShadow: 'inset 0 0 1px 3px rgba(0, 255, 255, 0.5)' }}
              customDragOverSquareStyle={{ backgroundColor: 'rgba(0, 255, 255, 0.2)' }}
            />
          </div>
            
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
          </div>
        </div>
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-4 shadow-lg border border-purple-500/20">
          <h2 className="text-center text-gray-300 font-semibold mb-2">Game Info</h2>
          <div className="bg-gray-900 rounded-md p-3 text-gray-400 text-sm space-y-1">
            <p>Game ID: {gameId}</p>
            <p>Player: {user?.username || 'Guest'}</p>
            <p>You are playing as: White</p>
            <p>Bot difficulty: {computerLevel}</p>
            {gameState.lastMove && (
              <p>Last move: {gameState.lastMove.from} → {gameState.lastMove.to}</p>
            )}
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