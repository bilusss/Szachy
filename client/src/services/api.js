import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Dodany interceptor do automatycznego dodawania tokena do headerów
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
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