import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Sprawdzenie, czy token istnieje w localStorage przy inicjalizacji
    const token = localStorage.getItem('token');
    if (token) {
      // Opcjonalnie: Możesz zweryfikować token z backendem
      // Tutaj zakładamy, że token jest ważny
      setIsAuthenticated(true);
      // TODO: Jeśli backend zwraca dane użytkownika przy logowaniu, możesz je zapisać w localStorage
      // Na razie ustawiamy user na null, jeśli nie masz zapisanego usera
      setUser(null);
    }
  }, []);

  // Login
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };
  // LogOut
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}