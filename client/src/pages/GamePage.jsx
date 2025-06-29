import { useParams } from 'react-router-dom';
import Game from '../components/Game/Game';
import GameCreate from '../components/Game/GameCreate';

function GamePage() {
  const { gameId } = useParams();
  return (
    <div>
      {gameId ? <Game /> : <GameCreate />}
    </div>
  );
}

export default GamePage;