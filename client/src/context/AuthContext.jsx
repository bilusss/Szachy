import { createContext, useState, useEffect } from 'react';
import { verifyToken as apiVerifyToken } from '../services/api'; // Dostosuj ścieżkę do swojej struktury

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({username: null, userId: null});
  const [loading, setLoading] = useState(true);

  // Funkcja weryfikacji tokena używająca api.js
  const checkTokenValidity = async () => {
    try {
      const data = await apiVerifyToken();
      return data;
    } catch (error) {
      console.error('Błąd weryfikacji tokena:', error);
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUsername = localStorage.getItem('username');
      const storedUserId = localStorage.getItem('userId');
      
      if (token) {
        const data = await checkTokenValidity();
        const username = data.username;
        const userId = data.userId;
        if (username) {
          // Zapisz username w localStorage jeśli jeszcze nie istnieje lub się różni
          if (!storedUsername || storedUsername !== username) {
            localStorage.setItem('username', username);
          }
          if (!storedUserId || storedUserId !== userId) {
            localStorage.setItem('userId', userId);
          }
          setUser({ username: username, userId:userId });
          setIsAuthenticated(true);
        } else {
          // Token nieprawidłowy - wyczyść localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('userId');
          setIsAuthenticated(false);
          setUser({username: null, userId: null});
        }
      } else {
        // Brak tokena - wyczyść wszystko
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        setIsAuthenticated(false);
        setUser({username: null, userId: null});
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login
  const login = (token, userData) => {
    const username = userData.username;
    const userId = userData.userId;
    localStorage.setItem('token', token);
    if (userData && userData.username) {
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);
      setUser({username: username, userId: userId});
    }
    setIsAuthenticated(true);
  };

  // LogOut
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setUser({username: null, userId: null});
    setIsAuthenticated(false);
  };

  // Funkcja do odświeżenia danych użytkownika
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      const data = await checkTokenValidity();
      const username = data.username;
      const userId = data.userId;
      if (username && userId) {
        localStorage.setItem('username', username);
        localStorage.setItem('userId', userId);
        setUser({ username: username, userId: userId });
        setIsAuthenticated(true);
        return true;
      } else {
        logout();
        return false;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      loading, 
      login, 
      logout, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}