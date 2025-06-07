import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import king from '../../assets/king.svg';

function Lobby() {
  const [games, setGames] = useState([]);
  const navigate = useNavigate();
  const { isAuthenticated, loading, logout } = useContext(AuthContext);

  useEffect(() => {
    // Sprawdzenie czy użytkownik jest zalogowany
    if (!loading && !isAuthenticated) {
      navigate('/login'); // Przekieruj do strony logowania jeśli nie zalogowany
      return;
    }

    // Jeśli użytkownik jest zalogowany, pobierz gry
    if (isAuthenticated) {
      // Placeholder: na razie pusty efekt, później pobierzemy gry z API
      setGames([
        { id: 1, creator: 'Player1', status: 'Open' }, 
        { id: 2, creator: 'Player2', status: 'Open' }
      ]);
    }
  }, [isAuthenticated, loading, navigate]);

  const handleCreateGame = () => {
    // Placeholder: później wyślemy żądanie do backendu
    alert('Game created! (Placeholder)');
    navigate('/game/1'); // Przekierowanie do przykładowej gry
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Pokaż loading podczas weryfikacji tokena
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Jeśli nie zalogowany, nie renderuj lobby (useEffect przekieruje)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden">
      <header className="bg-opacity-50 bg-gray-900 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <div onClick={() => navigate('/')} className="cursor-pointer">
            <img src={king} alt="ChessVerse Logo" className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 hidden sm:block">
            ChessVerse Lobby
          </h1>
        </div>
        <nav className="flex items-center">
          <div className="sm:hidden">
            {/* Placeholder dla animacji menu - dostosuj zgodnie z Home.jsx */}
            <div className="w-8 h-8 cursor-pointer" onClick={() => {}}></div>
          </div>
          <div className="hidden sm:flex space-x-4">
            <button
              onClick={handleCreateGame}
              className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
            >
              Create Game
              <span className="absolute inset-0 border-2 border-transparent rounded-lg animate-pulse-glow"></span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
            >
              Home
              <span className="absolute inset-0 border-2 border-transparent rounded-lg animate-pulse-glow"></span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>
      <main className="p-6 sm:p-8 relative z-0 max-w-5xl mx-auto">
        <section className="text-center mb-8">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Join the ChessVerse Lobby!
          </h2>
          <p className="text-lg mt-4 text-gray-300">
            Find and join your next chess game!
          </p>
        </section>
        <section>
          <h3 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6">
            Available Games
          </h3>
          {games.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="bg-gray-800 bg-opacity-50 backdrop-blur-md p-4 rounded-lg flex justify-between items-center shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                >
                  <span className="text-lg text-gray-200">
                    Game #{game.id} - {game.creator} - {game.status}
                  </span>
                  <button
                    onClick={() => navigate(`/game/${game.id}`)}
                    className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                  >
                    Join Game
                    <span className="absolute inset-0 border-2 border-transparent rounded-lg animate-pulse-glow"></span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center">No games available. Create one!</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Lobby;