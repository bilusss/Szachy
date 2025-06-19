import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../../services/api';
import king from '../../assets/king.svg';

function GameCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateGame = async (gameType) => {
    setIsLoading(true);
    setError(null);
    try {
      const playerId = 'userId'; // TODO: Replace with AuthContext userId
      const response = await createGame({ gameType, playerId });
      navigate(`/game/${response.gameId}`);
    } catch (err) {
      setError('Failed to create game. Please try again.');
      console.error('Error creating game:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <header className="mb-8 flex items-center space-x-3">
        <img src={king} alt="ChessVerse Logo" className="w-10 h-10" />
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          ChessVerse
        </h1>
      </header>
      <main className="w-full max-w-md bg-gray-800 bg-opacity-70 rounded-lg shadow-lg p-6 border border-cyan-500/20">
        <h2 className="text-2xl font-semibold text-center mb-6">Select Game Mode</h2>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleCreateGame('bot')}
            disabled={isLoading}
            className={`px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:shadow-lg transition-all duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Play vs Bot
          </button>
          <button
            onClick={() => handleCreateGame('1v1')}
            disabled={isLoading}
            className={`px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Play 1v1
          </button>
        </div>
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </main>
    </div>
  );
}

export default GameCreate;