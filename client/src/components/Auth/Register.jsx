import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { register, login } from '../../services/api';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: loginContext } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(username, password);
      const response = await login(username, password); // Automatyczne logowanie
      loginContext(response.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd rejestracji');
    }
  };

  return (
    <div>
      <h2>Rejestracja</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nazwa użytkownika"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Hasło"
        />
        <button type="submit">Zarejestruj</button>
      </form>
    </div>
  );
}

export default Register;