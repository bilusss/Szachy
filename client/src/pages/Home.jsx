import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import king from '../assets/king.svg';
import lottie from 'lottie-web';
import menuAnimation from '../assets/animations/menuV3.json';

function Home() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [welcomeText, setWelcomeText] = useState('Welcome!');
  const animRef = useRef(null); // Ref do przechowywania instancji animacji

  // Mock live games data (replace with real socket.io data later)
  const liveGames = [
    { id: 1, players: 'Player1 vs Player2', status: 'In Progress' },
    { id: 2, players: 'Player3 vs Player4', status: 'In Progress' },
  ];

  useEffect(() => {
    // Inicjalizacja animacji Lottie
    animRef.current = lottie.loadAnimation({
      container: document.getElementById('burger-animation'),
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: menuAnimation,
    });

    return () => {
      // Cleanup przy odmontowaniu komponentu
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, []);

  // Sprawdzenie długości napisu "Welcome, {user.username}!"
  useEffect(() => {
    if (isAuthenticated && user?.username) {
      const fullText = `Welcome, ${user.username}!`;
      // Tworzenie tymczasowego elementu do pomiaru szerokości tekstu
      const tempElement = document.createElement('span');
      tempElement.style.fontSize = '1.5rem'; // 2xl w Tailwind
      tempElement.style.fontWeight = '700'; // bold
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.innerText = fullText;
      document.body.appendChild(tempElement);
      const textWidth = tempElement.offsetWidth;
      document.body.removeChild(tempElement);

      // Jeśli tekst jest szerszy niż 200px (próg dla małych ekranów), skracamy do "Welcome!"
      if (textWidth > 200) {
        setWelcomeText('Welcome!');
      } else {
        setWelcomeText(fullText);
      }
    } else {
      setWelcomeText('ChessVerse');
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStartGame = () => {
    navigate('/game');
  };

  const handleLogin = () => navigate('/login');
  const handleRegister = () => navigate('/register');

  const toggleMenu = () => {
    if (animRef.current) {
      animRef.current.setDirection(isMenuOpen ? -1 : 1); // Odwrotna animacja przy zamykaniu
      animRef.current.play();
    }
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden">
      {/* Header */}
      <header className="bg-opacity-50 bg-gray-900 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <div onClick={() => navigate('/')} className="cursor-pointer">
            <img src={king} alt="ChessVerse Logo" className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 hidden sm:block">
            {isAuthenticated ? welcomeText : 'ChessVerse'}
          </h1>
        </div>
        <nav className="flex items-center">
          {/* Menu mobilne */}
          <div className="sm:hidden">
            <div id="burger-animation" className="w-8 h-8 cursor-pointer" onClick={toggleMenu} aria-expanded={isMenuOpen}></div>
            {isMenuOpen && (
              <div className="absolute top-16 right-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-lg flex flex-col space-y-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={handleStartGame}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:shadow-cyan-500/50 transition-all duration-300"
                    >
                      Play Now
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-300"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleLogin}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:shadow-cyan-500/50 transition-all duration-300"
                    >
                      Login
                    </button>
                    <button
                      onClick={handleRegister}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:shadow-purple-500/50 transition-all duration-300"
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Menu desktopowe */}
          <div className="hidden sm:flex space-x-4">
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
                <button
                  onClick={handleLogin}
                  className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                >
                  Login
                </button>
                <button
                  onClick={handleRegister}
                  className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-8 relative z-0">
        {/* Welcome Section */}
        <section className="text-center mb-12">
          <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
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
              <button
                onClick={handleLogin}
                className="relative px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-lg font-bold shadow-lg hover:shadow-2xl transition-all duration-500 animate-pulse"
              >
                Login to Play
                <span className="absolute inset-0 border-4 border-transparent rounded-full animate-pulse-glow"></span>
              </button>
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
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center">No live matches. Start your own battle!</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;