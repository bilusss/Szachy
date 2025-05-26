import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import pawn from '../assets/pawn_login.png';

function Home() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Mock live games data (replace with real socket.io data later)
  const liveGames = [
    { id: 1, players: 'Player1 vs Player2', status: 'In Progress' },
    { id: 2, players: 'Player3 vs Player4', status: 'In Progress' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStartGame = () => {
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden">
      {/* Background particle effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-pulse opacity-20 bg-gradient-to-r from-cyan-500 to-purple-500 h-1 w-1 rounded-full absolute top-1/4 left-1/4"></div>
        <div className="animate-pulse opacity-20 bg-gradient-to-r from-cyan-500 to-purple-500 h-1 w-1 rounded-full absolute bottom-1/4 right-1/4"></div>
      </div>

      {/* Header */}
      <header className="bg-opacity-50 bg-gray-900 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <img src={pawn} alt="Chess Pawn" className="w-10 h-10 animate-pulse" />
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            {isAuthenticated ? `Welcome, ${user?.username}!` : 'ChessVerse'}
          </h1>
        </div>
        <div className="space-x-4">
          {isAuthenticated ? (
            <>
              <button
                onClick={handleStartGame}
                className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
              >
                Play Now
                <span className="absolute inset-0 border-2 border-transparent rounded-lg animate-pulse-glow"></span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg transition-all duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
              >
                Login
                <span className="absolute inset-0 border-2 border-transparent rounded-lg animate-pulse-glow"></span>
              </a>
              <a
                href="/register"
                className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                Register
                <span className="absolute inset-0 border-2 border-transparent rounded-lg animate-pulse-glow"></span>
              </a>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 relative z-0">
        {/* Welcome Section */}
        <section className="text-center mb-12">
          <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse">
            {isAuthenticated ? 'Enter the ChessVerse Arena!' : 'Join the Future of Chess!'}
          </h2>
          <p className="text-lg mt-4 text-gray-300">
            {isAuthenticated
              ? 'Challenge players in a futuristic chess battleground.'
              : 'Login to experience chess like never before!'}
          </p>
          <div className="mt-6">
            {isAuthenticated ? (
              <button
                onClick={handleStartGame}
                className="relative px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-lg font-bold shadow-lg hover:shadow-2xl transition-all duration-500 animate-pulse"
              >
                Start New Game
                <span className="absolute inset-0 border-4 border-transparent rounded-full animate-pulse-glow"></span>
              </button>
            ) : (
              <a
                href="/login"
                className="relative px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-lg font-bold shadow-lg hover:shadow-2xl transition-all duration-500 animate-pulse"
              >
                Login to Play
                <span className="absolute inset-0 border-4 border-transparent rounded-full animate-pulse-glow"></span>
              </a>
            )}
          </div>
        </section>

        {/* Live Games Section */}
        <section className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6">
            Live Matches in the ChessVerse
          </h3>
          {liveGames.length > 0 ? (
            <div className="grid gap-6">
              {liveGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-gray-800 bg-opacity-50 backdrop-blur-md p-6 rounded-lg flex justify-between items-center shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                >
                  <span className="text-lg text-gray-200">
                    {game.players} - {game.status}
                  </span>
                  <button className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300">
                    Watch
                    <span className="absolute inset-0 border-2 border-transparent rounded-lg animate-pulse-glow"></span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center">No live matches. Start your own battle!</p>
          )}
        </section>
      </main>

      {/* Custom CSS for animations */}
      <style>
        {`
          @keyframes pulse-glow {
            0% { border-color: rgba(34, 211, 238, 0.5); box-shadow: 0 0 10px rgba(34, 211, 238, 0.5); }
            50% { border-color: rgba(168, 85, 247, 0.5); box-shadow: 0 0 20px rgba(168, 85, 247, 0.5); }
            100% { border-color: rgba(34, 211, 238, 0.5); box-shadow: 0 0 10px rgba(34, 211, 238, 0.5); }
          }
          .animate-pulse-glow {
            animation: pulse-glow 2s infinite;
          }
        `}
      </style>
    </div>
  );
}

export default Home;