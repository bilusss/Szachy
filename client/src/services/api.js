import axios from 'axios';
import { io } from 'socket.io-client';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Dodany interceptor do automatycznego dodawania tokena do headerów
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Dodano 'Bearer' dla zgodności z WebSocket
  }
  return config;
});

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const register = async (username, password) => {
  const response = await api.post('/auth/register', { username, password });
  return response.data;
};

// Dodaj funkcję weryfikacji tokena
export const verifyToken = async () => {
  const response = await api.get('/auth/verify');
  return response.data;
};

// Inicjalizacja WebSocket
const socket = io('http://localhost:3000', { withCredentials: true });

// Funkcje WebSocket dla gry
export const joinGame = (gameId, callback) => {
  socket.emit('joinGame', gameId);
  socket.on('gameState', callback);
};

export const makeMove = (gameId, from, to, playerId, callback) => {
  socket.emit('move', { gameId, from, to, playerId });
  socket.on('gameState', callback);
};

export default socket;