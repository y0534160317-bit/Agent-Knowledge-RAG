import React from 'react';
import { GRID_SIZE, type Point } from '../hooks/useSnake';
import './GameBoard.css'; // We will create this for simple CSS grid styling

interface GameBoardProps {
  snake: Point[];
  food: Point;
  gameOver: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ snake, food, gameOver }) => {
  // Create an empty grid
  const grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 0)
  );

  return (
    <div className={`game-board ${gameOver ? 'game-over' : ''}`}>
      {grid.map((row, y) => (
        <div key={`row-${y}`} className="row">
          {row.map((_, x) => {
            const isSnake = snake.some((segment) => segment.x === x && segment.y === y);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isFood = food.x === x && food.y === y;

            let cellClass = 'cell';
            if (isHead) {
              cellClass += ' snake-head';
            } else if (isSnake) {
              cellClass += ' snake-body';
            } else if (isFood) {
              cellClass += ' food';
            }

            return <div key={`cell-${x}-${y}`} className={cellClass} />;
          })}
        </div>
      ))}
    </div>
  );
};
