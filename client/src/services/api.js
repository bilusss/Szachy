import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', { withCredentials: true });

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

// Nowa funkcja do pobierania aktywnych gier
export const getActiveGames = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    console.error('Error fetching active games:', error);
    throw error;
  }
};

// Funkcja do pobierania szczegółów konkretnej gry
export const getGameDetails = async (gameId) => {
  try {
    const response = await api.get(`/game/${gameId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching game details:', error);
    throw error;
  }
};

// Funkcja do pobierania listy wszystkich gier (jeśli będzie potrzebna)
export const getAllGames = async () => {
  try {
    const response = await api.get('/games');
    return response.data;
  } catch (error) {
    console.error('Error fetching all games:', error);
    throw error;
  }
};

export const joinGame = (gameId, callback) => {
  socket.emit('joinGame', gameId);
  socket.once('gameState', callback);
};

export const makeMove = (gameId, from, to, playerId, callback, promotion) => {
  console.log(gameId, from, to, playerId, callback);
  socket.emit('move', { gameId, from, to, playerId, promotion });
  socket.on('gameState', callback);
};

// Funkcje do nasłuchiwania wydarzeń socket.io związanych z grami
export const subscribeToGameUpdates = (callback) => {
  socket.on('gameListUpdate', callback);
};

export const unsubscribeFromGameUpdates = () => {
  socket.off('gameListUpdate');
};

// Funkcja do żądania odświeżenia listy gier
export const requestGameListUpdate = () => {
  socket.emit('requestGameList');
};

export default socket;