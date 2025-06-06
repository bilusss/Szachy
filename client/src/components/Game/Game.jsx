import { useParams } from 'react-router-dom';
import king from '../../assets/king.svg';

function Game() {
  const { gameId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-opacity-50 bg-gray-900 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <img src={king} alt="ChessVerse Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 hidden sm:block">
            ChessVerse
          </h1>
        </div>
        <span className="text-gray-300 text-sm">Game ID: {gameId}</span>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-4xl flex flex-col items-center bg-gray-800 bg-opacity-50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-cyan-500/30">
          
          {/* Chess Board Placeholder */}
          <div className="w-full aspect-square bg-gray-900 border-4 border-cyan-500 rounded-xl flex items-center justify-center text-3xl font-bold text-gray-500 mb-6">
            CHESSBOARD
          </div>

          {/* Chat Placeholder */}
          <div className="w-full h-64 bg-gray-900 border-2 border-purple-500 rounded-lg p-4 overflow-y-auto text-gray-300">
            <p className="text-center">CHAT</p>
            {/* future messages go here */}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Game;
