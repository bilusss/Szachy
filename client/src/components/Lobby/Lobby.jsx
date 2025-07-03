import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getActiveGames, subscribeToGameUpdates, unsubscribeFromGameUpdates, requestGameListUpdate } from '../../services/api';
import king from '../../assets/king.svg';

function Lobby() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGamesCount, setActiveGamesCount] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, logout } = useContext(AuthContext);

  useEffect(() => {
    // Sprawdzenie czy użytkownik jest zalogowany
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    // Jeśli użytkownik jest zalogowany, pobierz gry
    if (isAuthenticated) {
      fetchActiveGames();
      setupSocketListeners();
    }

    // Cleanup przy unmount
    return () => {
      unsubscribeFromGameUpdates();
    };
  }, [isAuthenticated, authLoading, navigate]);

  const setupSocketListeners = () => {
    // Nasłuchuj aktualizacji listy gier przez WebSocket
    subscribeToGameUpdates((updatedGames) => {
      console.log('Received game list update:', updatedGames);
      setGames(updatedGames);
      setActiveGamesCount(updatedGames.length);
    });
  };

  const fetchActiveGames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getActiveGames();
      console.log('Active games data:', data);
      
      setActiveGamesCount(data.activeGamesCount || 0);
      
      // Jeśli są aktywne gry, tworzymy mock data
      // W przyszłości to powinno być zastąpione prawdziwymi danymi z API
      if (data.activeGamesCount > 0) {
        const mockGames = [];
        for (let i = 1; i <= data.activeGamesCount; i++) {
          mockGames.push({
            id: i,
            creator: `Player${i}`,
            status: 'ongoing',
            players: Math.floor(Math.random() * 2) + 1, // 1 lub 2 graczy
            createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Losowy czas w ciągu ostatniej godziny
            timeControl: '10+0', // Przykładowa kontrola czasu
            rating: Math.floor(Math.random() * 1000) + 1200 // Losowy rating
          });
        }
        setGames(mockGames);
      } else {
        setGames([]);
      }
    } catch (err) {
      console.error('Error fetching active games:', err);
      setError('Failed to load active games');
      setGames([]);
      setActiveGamesCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = () => {
    navigate('/game');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleJoinGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const handleRefreshGames = () => {
    fetchActiveGames();
    // Również poproś o aktualizację przez WebSocket
    requestGameListUpdate();
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const gameTime = new Date(dateString);
    const diffInMinutes = Math.floor((now - gameTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Pokaż loading podczas weryfikacji tokena
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Jeśli nie zalogowany, nie renderuj lobby
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
      
      <main className="p-6 sm:p-8 relative z-0 max-w-6xl mx-auto">
        <section className="text-center mb-8">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Join the ChessVerse Lobby!
          </h2>
          <p className="text-lg mt-4 text-gray-300">
            Find and join your next chess game!
          </p>
          <div className="mt-4 flex justify-center items-center space-x-4 text-sm text-gray-400">
            <span>🎮 Active Games: {activeGamesCount}</span>
            <span>•</span>
            <span>👥 Players Online: {activeGamesCount * 2}</span>
          </div>
        </section>
        
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Active Games
            </h3>
            <button
              onClick={handleRefreshGames}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold shadow-lg transition-all duration-300 flex items-center space-x-2"
            >
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-300">{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md p-8 rounded-lg shadow-lg">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-300">Loading active games...</p>
              </div>
            </div>
          ) : games.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="bg-gray-800 bg-opacity-50 backdrop-blur-md p-6 rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 border border-gray-700 hover:border-cyan-500/50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-2">
                        Game #{game.id}
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-300">
                          <span className="text-gray-400">Creator:</span> {game.creator}
                        </p>
                        <p className="text-gray-300">
                          <span className="text-gray-400">Status:</span> 
                          <span className="text-green-400 font-medium ml-1">{game.status}</span>
                        </p>
                        <p className="text-gray-300">
                          <span className="text-gray-400">Players:</span> {game.players}/2
                        </p>
                        <p className="text-gray-300">
                          <span className="text-gray-400">Time:</span> {game.timeControl}
                        </p>
                        <p className="text-gray-300">
                          <span className="text-gray-400">Rating:</span> {game.rating}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {formatTimeAgo(game.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400">Live</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleJoinGame(game.id)}
                      className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 text-sm"
                    >
                      {game.players === 1 ? 'Join Game' : 'Full Game'}
                    </button>
                    <button
                      onClick={() => navigate(`/game/${game.id}/spectate`)}
                      className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold shadow-lg transition-all duration-300 text-sm"
                    >
                      Watch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md p-8 rounded-lg shadow-lg">
                <div className="text-6xl mb-4">♟️</div>
                <p className="text-gray-400 text-xl mb-4">No active games found</p>
                <p className="text-gray-500 text-sm mb-6">Be the first to create a game and start playing!</p>
                <button
                  onClick={handleCreateGame}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                >
                  Create New Game
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Lobby;