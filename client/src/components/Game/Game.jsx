import { useParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import king from '../../assets/king.svg';
import { useState, useEffect, useCallback, useRef } from 'react';
import { joinGame, makeMove } from '../../services/api';

function Game() {
  const { gameId } = useParams();
  const [gameState, setGameState] = useState({
    board: null,
    currentTurn: 'w',
    status: 'ongoing',
  });
  const [computerLevel, setComputerLevel] = useState('Easy 🤓'); // Poziom komputera
  const chessboardRef = useRef(null);
  const [currentTimeout, setCurrentTimeout] = useState(null);

  // Funkcja bezpiecznej mutacji gry
  const safeGameMutate = (modify) => {
    setGameState((prev) => {
      const update = { ...prev };
      modify(update);
      return update;
    });
  };

  // Losowy ruch komputera
  const makeComputerMove = useCallback(() => {
    const game = { fen: gameState.board, moves: () => ['e2e4', 'd2d4'] }; // Placeholder dla moves
    const possibleMoves = game.moves ? game.moves() : ['e2e4', 'd2d4']; // Prosta lista ruchów
    if (gameState.status === 'ongoing' && gameState.currentTurn === 'b') {
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      const move = possibleMoves[randomIndex];
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      const playerId = 'computer'; // ID komputera
      makeMove(gameId, from, to, playerId, (state) => {
        safeGameMutate((gameState) => {
          gameState.board = state.fen;
          gameState.currentTurn = state.currentTurn;
          gameState.status = state.status;
        });
      });
    }
  }, [gameId, gameState.board, gameState.currentTurn, gameState.status]);

  useEffect(() => {
    joinGame(gameId, (state) => {
      safeGameMutate((gameState) => {
        gameState.board = state.fen || 'rnbqkbnr/pppp1ppp/5n2/5p2/5P2/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 2';
        gameState.currentTurn = state.currentTurn || 'w';
        gameState.status = state.status || 'ongoing';
      });
    });

    // Uruchom ruch komputera po zmianie tury
    if (gameState.currentTurn === 'b' && gameState.status === 'ongoing') {
      const timeout = setTimeout(makeComputerMove, 1000); // Opóźnienie 1 sekunda
      setCurrentTimeout(timeout);
    }
  }, [gameId, gameState.currentTurn, gameState.status, makeComputerMove]);

  const onDrop = useCallback((sourceSquare, targetSquare, piece) => {
    if (gameState.currentTurn !== 'w') return false; // Tylko biały (gracz) może ruszać

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1].toLowerCase() ?? 'q',
    };
    const playerId = 'userId'; // Pobierz z AuthContext
    makeMove(gameId, move.from, move.to, playerId, (state) => {
      safeGameMutate((gameState) => {
        gameState.board = state.fen;
        gameState.currentTurn = state.currentTurn;
        gameState.status = state.status;
      });
    });

    // Uruchom ruch komputera po ruchu gracza
    if (gameState.status === 'ongoing') {
      const newTimeout = setTimeout(makeComputerMove, 1000);
      setCurrentTimeout(newTimeout);
    }
    return true; // Na razie zezwalaj na ruch
  }, [gameId, gameState.currentTurn, gameState.status]);

  const resetGame = () => {
    safeGameMutate((gameState) => {
      gameState.board = 'rnbqkbnr/pppp1ppp/5n2/5p2/5P2/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 2';
      gameState.currentTurn = 'w';
      gameState.status = 'ongoing';
    });
    chessboardRef.current?.clearPremoves();
    clearTimeout(currentTimeout);
    makeMove(gameId, null, null, 'userId', (state) => {
      setGameState(state);
    }); // Wyślij reset do serwera
  };

  const undoMove = () => {
    safeGameMutate((gameState) => {
      // Placeholder: Cofnij dwa ruchy (gracz + komputer)
      gameState.board = 'rnbqkbnr/pppp1ppp/5n2/5p2/5P2/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 2'; // Prosty reset
      gameState.currentTurn = 'w';
      gameState.status = 'ongoing';
    });
    chessboardRef.current?.clearPremoves();
    clearTimeout(currentTimeout);
    makeMove(gameId, null, null, 'userId', (state) => {
      setGameState(state);
    }); // Wyślij undo do serwera
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden">
      <header className="bg-opacity-50 bg-gray-900 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <img src={king} alt="ChessVerse Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 hidden sm:block">
            ChessVerse
          </h1>
        </div>
        <span className="text-gray-300 text-sm">Game ID: {gameId}</span>
      </header>
      <main className="p-6 sm:p-8 relative z-0 max-w-5xl mx-auto flex flex-col items-center">
        <div className="w-full max-w-4xl flex flex-col items-center bg-gray-800 bg-opacity-50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-cyan-500/30">
          {/* Chess Board */}
          <Chessboard
            position={gameState.board || 'start'}
            onPieceDrop={onDrop}
            boardWidth={800}
            customBoardStyle={{ borderRadius: '0.75rem' }}
            customDarkSquareStyle={{ backgroundColor: '#1a202c' }}
            customLightSquareStyle={{ backgroundColor: '#2d3748' }}
            arePremovesAllowed={true}
            isDraggablePiece={({ piece }) => piece[0] === 'w'} // Tylko białe figury są ruchome
            ref={chessboardRef}
            allowDragOutsideBoard={false}
          />
          {/* Kontrola poziomu i reset/undo */}
          <div className="flex justify-center gap-4 mt-4">
            {['Easy 🤓', 'Medium 🧐', 'Hard 😵'].map((level) => (
              <button
                key={level}
                onClick={() => setComputerLevel(level)}
                className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 ${
                  computerLevel === level ? 'bg-[#B58863]' : 'bg-[#f0d9b5]'
                }`}
              >
                {level}
              </button>
            ))}
            <button
              onClick={resetGame}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:shadow-cyan-500/50 transition-all duration-300"
            >
              New Game
            </button>
            <button
              onClick={undoMove}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:shadow-purple-500/50 transition-all duration-300"
            >
              Undo
            </button>
          </div>
          {/* Chat Placeholder */}
          <div className="w-full h-64 bg-gray-900 border-2 border-purple-500 rounded-lg p-4 mt-6 overflow-y-auto text-gray-300">
            <p className="text-center">CHAT</p>
            {/* future messages go here */}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Game;