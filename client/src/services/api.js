import axios from 'axios';
import { io } from 'socket.io-client';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

export const verifyToken = async () => {
  const response = await api.get('/auth/verify');
  return response.data;
};

export const createGame = async (data) => {
  const response = await api.post('/game/create', data);
  return response.data;
};

export const joinGame = (gameId, callback) => {
  socket.emit('joinGame', gameId);
  socket.on('gameState', callback);
};

export const makeMove = (gameId, from, to, playerId, callback) => {
  socket.emit('move', { gameId, from, to, playerId });
  socket.on('gameState', callback);
};

const socket = io('http://localhost:3000', { withCredentials: true });

export default socket;