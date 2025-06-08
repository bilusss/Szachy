import { useParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import king from '../../assets/king.svg';
import { useState, useEffect, useCallback } from 'react';
import { joinGame, makeMove } from '../../services/api';

function Game() {
  const { gameId } = useParams();
  const [gameState, setGameState] = useState({
    board: null,
    currentTurn: 'w',
    status: 'ongoing',
  });

  useEffect(() => {
    joinGame(gameId, (state) => {
      setGameState(state);
    });
  }, [gameId]);

  const onDrop = useCallback((sourceSquare, targetSquare) => {
    const playerId = 'userId'; // Pobierz z AuthContext
    makeMove(gameId, sourceSquare, targetSquare, playerId, (state) => {
      setGameState(state);
    });
    return true; // Na razie zezwalaj na ruch
  }, [gameId]);

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
          />
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