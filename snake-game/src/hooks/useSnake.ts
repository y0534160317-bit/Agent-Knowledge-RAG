import { useState, useEffect, useCallback, useRef } from 'react';

// --- Constants & Types ---
export const GRID_SIZE = 20;
export const INITIAL_SPEED = 150; // ms per tick
export const MIN_SPEED = 50;
export const SPEED_DECREMENT = 2; // decrease ms per tick when eating food

export type Point = { x: number; y: number };
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';

// --- Helper Functions ---
const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  let isOccupied = true;
  while (isOccupied) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // eslint-disable-next-line no-loop-func
    isOccupied = snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
  }
  return newFood!;
};

// --- Custom Hook ---
export function useSnake() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 }); // Initial generic position, will be reset on start
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  // Use a ref to keep track of the latest direction to prevent quick double-turn self-collisions
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);

  // Load high score on mount
  useEffect(() => {
    const storedHighScore = localStorage.getItem('snakeHighScore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
    // Initialize food
    setFood(generateFood(INITIAL_SNAKE));
  }, []);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setIsStarted(true);
    setSpeed(INITIAL_SPEED);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const togglePause = () => {
    if (isStarted && !gameOver) {
      setIsPaused((prev) => !prev);
    }
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !isStarted) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      const currentDir = directionRef.current;

      if (currentDir === 'UP') newHead.y -= 1;
      if (currentDir === 'DOWN') newHead.y += 1;
      if (currentDir === 'LEFT') newHead.x -= 1;
      if (currentDir === 'RIGHT') newHead.x += 1;

      // 1. Check Collision (Walls)
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prevSnake;
      }

      // 2. Check Collision (Self)
      // We don't check the last tail segment because it will move out of the way,
      // UNLESS the new head is exactly the tail (can happen when turning in a tight space)
      // Actually, standard snake logic: check if new head hits any part of current snake
      // except the last tail segment if we don't eat food. Let's just check all except last,
      // or easier: pop tail first, then check.
      const newSnake = [newHead, ...prevSnake];

      // 3. Check Food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => {
            const newScore = s + 10;
            if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('snakeHighScore', newScore.toString());
            }
            return newScore;
        });
        setFood(generateFood(newSnake));
        setSpeed((prev) => Math.max(MIN_SPEED, prev - SPEED_DECREMENT));
      } else {
        // Didn't eat, remove tail
        newSnake.pop();
      }

      // Re-check self collision after tail logic
      // newSnake[0] is head, we check index 1 to end
      for (let i = 1; i < newSnake.length; i++) {
        if (newHead.x === newSnake[i].x && newHead.y === newSnake[i].y) {
           setGameOver(true);
           return prevSnake;
        }
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, isStarted, highScore]);

  // Game Loop
  useEffect(() => {
    if (!isStarted || isPaused || gameOver) return;

    const intervalId = setInterval(moveSnake, speed);
    return () => clearInterval(intervalId);
  }, [moveSnake, isStarted, isPaused, gameOver, speed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
         e.preventDefault();
      }

      if (e.key === ' ' || e.key === 'Escape') {
          togglePause();
          return;
      }

      const currentDir = directionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir !== 'DOWN') {
              setDirection('UP');
              directionRef.current = 'UP';
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir !== 'UP') {
             setDirection('DOWN');
             directionRef.current = 'DOWN';
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir !== 'RIGHT') {
             setDirection('LEFT');
             directionRef.current = 'LEFT';
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir !== 'LEFT') {
             setDirection('RIGHT');
             directionRef.current = 'RIGHT';
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isPaused, gameOver]);


  return {
    snake,
    food,
    score,
    highScore,
    gameOver,
    isPaused,
    isStarted,
    startGame,
    togglePause,
  };
}
