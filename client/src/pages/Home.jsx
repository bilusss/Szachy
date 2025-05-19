import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Home() {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <h2>Strona główna</h2>
      {isAuthenticated ? (
        <>
          <p>Zalogowano! Token: {user.token}</p>
          <button onClick={handleLogout}>Wyloguj</button>
        </>
      ) : (
        <p>Nie jesteś zalogowany. <a href="/login">Zaloguj się</a></p>
      )}
    </div>
  );
}

export default Home;