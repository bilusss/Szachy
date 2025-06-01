import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Lobby() {
  const [games, setGames] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Placeholder: na razie pusty efekt, później pobierzemy gry z API
    setGames([{ id: 1, creator: 'Player1', status: 'Open' }, { id: 2, creator: 'Player2', status: 'Open' }]);
  }, []);

  const handleCreateGame = () => {
    // Placeholder: później wyślemy żądanie do backendu
    alert('Game created! (Placeholder)');
    navigate('/game/1'); // Przekierowanie do przykładowej gry
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <h2 className="text-3xl items-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6">
        ChessVerse Lobby
      </h2>
      <button
        onClick={handleCreateGame}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:shadow-cyan-500/50 transition-all duration-300 mb-6"
      >
        Create New Game
      </button>
      <div className="max-w-5xl mx-auto">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
          Available Games
        </h3>
        <ul className="grid gap-4">
          {games.map((game) => (
            <li
              key={game.id}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-md p-6 rounded-lg flex justify-between items-center shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
            >
              <span className="text-lg text-gray-200">
                Game #{game.id} - Creator: {game.creator} - Status: {game.status}
              </span>
              <button
                onClick={() => navigate(`/game/${game.id}`)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:shadow-purple-500/50 transition-all duration-300"
              >
                Join Game
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Lobby;