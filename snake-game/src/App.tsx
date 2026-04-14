import { useSnake } from './hooks/useSnake';
import { GameBoard } from './components/GameBoard';
import './App.css';

function App() {
  const {
    snake,
    food,
    score,
    highScore,
    gameOver,
    isPaused,
    isStarted,
    startGame,
    togglePause,
  } = useSnake();

  return (
    <div className="app-container">
      <header className="header">
        <h1>React Snake</h1>
        <div className="scoreboard">
          <div className="score-box">
            <span className="score-label">SCORE</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-box">
            <span className="score-label">HIGH SCORE</span>
            <span className="score-value">{highScore}</span>
          </div>
        </div>
      </header>

      <main className="game-area">
        <GameBoard snake={snake} food={food} gameOver={gameOver} />

        {(!isStarted || gameOver) && (
          <div className="overlay">
            {gameOver && <h2 className="game-over-text">GAME OVER</h2>}
            <button className="btn-primary" onClick={startGame}>
              {gameOver ? 'Try Again' : 'Start Game'}
            </button>
          </div>
        )}

        {isStarted && !gameOver && isPaused && (
          <div className="overlay">
            <h2>PAUSED</h2>
            <button className="btn-primary" onClick={togglePause}>
              Resume
            </button>
          </div>
        )}
      </main>

      <footer className="controls">
        <p>Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to move.</p>
        <p>Press <strong>Space</strong> to pause.</p>
      </footer>
    </div>
  );
}

export default App;
