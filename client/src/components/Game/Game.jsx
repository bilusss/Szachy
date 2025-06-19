import { useParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import king from '../../assets/king.svg';
import { useState, useEffect, useCallback, useRef } from 'react';
import { joinGame, makeMove } from '../../services/api';

function Game() {
  const { gameId } = useParams();
  const [gameState, setGameState] = useState({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Clean initial board
    currentTurn: 'w',
    status: 'ongoing',
  });
  const [computerLevel, setComputerLevel] = useState('Easy 🤓');
  const chessboardRef = useRef(null);
  const containerRef = useRef(null);
  const [currentTimeout, setCurrentTimeout] = useState(null);
  const [boardWidth, setBoardWidth] = useState(calculateBoardWidth());

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
  const safeGameMutate = (modify) => {
    setGameState((prev) => {
      const update = { ...prev };
      modify(update);
      return update;
    });
  };

  // Computer move
  const makeComputerMove = useCallback(() => {
    const game = { fen: gameState.fen, moves: () => ['e2e4', 'd2d4'] };
    const possibleMoves = game.moves ? game.moves() : ['e2e4', 'd2d4'];
    if (gameState.status === 'ongoing' && gameState.currentTurn === 'b') {
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      const move = possibleMoves[randomIndex];
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      const playerId = 'computer';
      makeMove(gameId, from, to, playerId, (state) => {
        safeGameMutate((gameState) => {
          gameState.fen = state.fen;
          gameState.currentTurn = state.currentTurn;
          gameState.status = state.status;
        });
      });
    }
  }, [gameId, gameState.fen, gameState.currentTurn, gameState.status]);

  // Join game and handle bot moves
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

    if (gameState.currentTurn === 'b' && gameState.status === 'ongoing') {
      const timeout = setTimeout(makeComputerMove, 1000);
      setCurrentTimeout(timeout);
    }

    return () => clearTimeout(currentTimeout);
  }, [gameId, gameState.currentTurn, gameState.status, makeComputerMove, currentTimeout]);

  // Handle piece drop
  const onDrop = useCallback(
    (sourceSquare, targetSquare, piece) => {
      if (gameState.currentTurn !== 'w') return false;

      const move = {
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1]?.toLowerCase() ?? 'q',
      };
      const playerId = 'userId'; // TODO: Replace with AuthContext
      makeMove(gameId, move.from, move.to, playerId, (state) => {
        safeGameMutate((gameState) => {
          gameState.fen = state.fen;
          gameState.currentTurn = state.currentTurn;
          gameState.status = state.status;
        });
      });

      if (gameState.status === 'ongoing') {
        const newTimeout = setTimeout(makeComputerMove, 1000);
        setCurrentTimeout(newTimeout);
      }
      return true;
    },
    [gameId, gameState.currentTurn, gameState.status, makeComputerMove]
  );

  // Reset game
  const resetGame = () => {
    safeGameMutate((gameState) => {
      gameState.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      gameState.currentTurn = 'w';
      gameState.status = 'ongoing';
    });
    chessboardRef.current?.clearPremoves();
    clearTimeout(currentTimeout);
    makeMove(gameId, null, null, 'userId', (state) => {
      setGameState(state);
    });
  };

  // Undo move
  const undoMove = () => {
    safeGameMutate((gameState) => {
      gameState.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      gameState.currentTurn = 'w';
      gameState.status = 'ongoing';
    });
    chessboardRef.current?.clearPremoves();
    clearTimeout(currentTimeout);
    makeMove(gameId, null, null, 'userId', (state) => {
      setGameState(state);
    });
  };

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
    </div>
  );
}

export default Game;