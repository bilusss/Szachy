import { createContext, useState, useEffect } from 'react';

// Tworzenie kontekstu
export const AuthContext = createContext();

// Provider kontekstu
export function AuthProvider({ children }) {
  // Stan przechowujący dane użytkownika (np. token)
  const [user, setUser] = useState(null);

  // Przy starcie aplikacji sprawdzamy, czy token istnieje w localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Jeśli token istnieje, ustawiamy użytkownika jako zalogowanego
      setUser({ token });
    }
  }, []);

  // Funkcja logowania
  const login = (token) => {
    localStorage.setItem('token', token);
    setUser({ token });
  };

  // Funkcja wylogowania
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Wartości udostępniane przez kontekst
  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user, // Czy użytkownik jest zalogowany
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}