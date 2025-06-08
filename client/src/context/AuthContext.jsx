import { createContext, useState, useEffect } from 'react';
import { verifyToken as apiVerifyToken } from '../services/api'; // Dostosuj ścieżkę do swojej struktury

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Funkcja weryfikacji tokena używająca api.js
  const checkTokenValidity = async () => {
    try {
      const data = await apiVerifyToken();
      return data.username;
    } catch (error) {
      console.error('Błąd weryfikacji tokena:', error);
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUsername = localStorage.getItem('username');
      
      if (token) {
        const username = await checkTokenValidity();
        if (username) {
          // Zapisz username w localStorage jeśli jeszcze nie istnieje lub się różni
          if (!storedUsername || storedUsername !== username) {
            localStorage.setItem('username', username);
          }
          setUser({ username });
          setIsAuthenticated(true);
        } else {
          // Token nieprawidłowy - wyczyść localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        // Brak tokena - wyczyść wszystko
        localStorage.removeItem('username');
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    if (userData && userData.username) {
      localStorage.setItem('username', userData.username);
      setUser(userData);
    }
    setIsAuthenticated(true);
  };

  // LogOut
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Funkcja do odświeżenia danych użytkownika
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      const username = await checkTokenValidity();
      if (username) {
        localStorage.setItem('username', username);
        setUser({ username });
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