import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5001');

function App() {
  const [message, setMessage] = useState('Waiting for server...');
  const [board] = useState(Array(64).fill(null));

  useEffect(() => {
    socket.on('connect', () => {
      setMessage('Connected to server!');
    });

    socket.on('move', (move) => {
      setMessage(`Received move: ${JSON.stringify(move)}`);
    });

    return () => {
      socket.off('connect');
      socket.off('move');
    };
  }, []);

  const sendTestMove = () => {
    socket.emit('move', { from: 'e2', to: 'e4' });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Chess Client ♟️</h1>
      <p className="mb-4">{message}</p>
      <button
        onClick={sendTestMove}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        Send Test Move (e2 to e4)
      </button>
      <div className="grid grid-cols-8 gap-0 w-96 h-96 border-2 border-gray-800">
        {board.map((square, index) => (
          <div
            key={index}
            className={`w-12 h-12 flex items-center justify-center ${
              (Math.floor(index / 8) + index) % 2 === 0 ? 'bg-white' : 'bg-gray-700'
            }`}
          >
            {square || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;