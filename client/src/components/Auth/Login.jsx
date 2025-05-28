import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { login } from '../../services/api';
import king from '../../assets/king.svg';
import lottie from 'lottie-web';
import menuAnimation from '../../assets/animations/menuV3.json';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: loginContext } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const animRef = useRef(null); // Ref do przechowywania instancji animacji

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(username, password);
      loginContext(response.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login Failed');
    }
  };

  const toggleMenu = () => {
    if (animRef.current) {
      // Użycie istniejącej instancji animacji
      animRef.current.setDirection(isMenuOpen ? -1 : 1); // Odwrotna animacja przy zamykaniu
      animRef.current.play();
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const handleRegister = () => navigate('/register');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden">
      {/* Header */}
      <header className="bg-opacity-50 bg-gray-900 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <img src={king} alt="ChessVerse Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 hidden sm:block">
            ChessVerse
          </h1>
        </div>
        <nav className="flex items-center">
          {/* Menu mobilne */}
          <div className="sm:hidden">
            <div id="burger-animation" className="w-8 h-8 cursor-pointer" onClick={toggleMenu} aria-expanded={isMenuOpen}></div>
            {isMenuOpen && (
              <div className="absolute top-16 right-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-lg flex flex-col space-y-2">
                <button
                  onClick={handleRegister}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:shadow-purple-500/50 transition-all duration-300"
                >
                  Register
                </button>
              </div>
            )}
          </div>
          {/* Menu desktopowe */}
          <div className="hidden sm:flex space-x-4">
            <button
              onClick={handleRegister}
              className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
            >
              Register
              <span className="absolute inset-0 border-2 border-transparent rounded-lg animate-pulse-glow"></span>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] p-8 relative z-0">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md p-8 rounded-xl max-w-md w-full shadow-lg border border-cyan-500/30">
          <div className="flex justify-center mb-4">
            <img src={king} alt="Chess King" className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6">
            Enter the ChessVerse
          </h2>
          {error && <p className="text-red-500 text-center mb-4 animate-pulse">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full p-3 bg-gray-900 bg-opacity-70 border border-cyan-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3 bg-gray-900 bg-opacity-70 border border-cyan-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
              />
            </div>
            <button
              type="submit"
              className="relative w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold shadow-lg hover:shadow-cyan-500/50 transition-all duration-500 animate-pulse"
            >
              Login
              <span className="absolute inset-0 border-2 border-transparent rounded-lg animate-pulse-glow"></span>
            </button>
          </form>
          <p className="text-center mt-4 text-gray-400">
            Don’t have an account?{' '}
            <button onClick={handleRegister} className="text-cyan-400 hover:text-cyan-300">
              Register
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;