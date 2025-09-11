import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Board helper constants
 */
const EMPTY = null;
const X = 'X';
const O = 'O';

const initialBoard = () => Array(9).fill(EMPTY);

/**
 * Determine the winner of the tic-tac-toe board
 * @param {Array<string|null>} board - length 9
 * @returns {'X'|'O'|'TIE'|null} winner symbol, 'TIE' if tie, or null if ongoing
 */
function evaluateBoard(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a]; // 'X' or 'O'
    }
  }
  if (board.every(cell => cell !== EMPTY)) {
    return 'TIE';
  }
  return null;
}

/**
 * Simple AI: First try to win, then block, else pick center, corner, or first available.
 * @param {Array<string|null>} board
 * @param {'X'|'O'} aiPlayer
 * @returns {number} index 0..8 where the AI will play
 */
function pickAiMove(board, aiPlayer) {
  const human = aiPlayer === X ? O : X;
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  // Try winning move
  for (const [a,b,c] of lines) {
    const line = [board[a], board[b], board[c]];
    const countAI = line.filter(v => v === aiPlayer).length;
    const emptyIdx = [a,b,c].find(i => board[i] === EMPTY);
    if (countAI === 2 && emptyIdx !== undefined) return emptyIdx;
  }

  // Try blocking move
  for (const [a,b,c] of lines) {
    const line = [board[a], board[b], board[c]];
    const countHuman = line.filter(v => v === human).length;
    const emptyIdx = [a,b,c].find(i => board[i] === EMPTY);
    if (countHuman === 2 && emptyIdx !== undefined) return emptyIdx;
  }

  // Center
  if (board[4] === EMPTY) return 4;

  // Corners
  const corners = [0,2,6,8].filter(i => board[i] === EMPTY);
  if (corners.length) return corners[0];

  // Sides
  const sides = [1,3,5,7].filter(i => board[i] === EMPTY);
  if (sides.length) return sides[0];

  // Fallback
  return board.findIndex(c => c === EMPTY);
}

/**
 * UI Components
 */

// PUBLIC_INTERFACE
function Header({ mode, currentPlayer, scores, statusText, onModeChange, onReset, onNewGame }) {
  /** Displays title, scores, current status, mode toggles, and action buttons */
  return (
    <header className="header">
      <div className="brand">
        <h1 className="title">Tic Tac Toe</h1>
        <p className="subtitle">Classic. Simple. Fun.</p>
      </div>

      <div className="status-bar" aria-live="polite">
        <div className="score">
          <span className="score-badge x">X</span>
          <strong>{scores.X}</strong>
        </div>
        <div className="score">
          <span className="score-badge o">O</span>
          <strong>{scores.O}</strong>
        </div>
        <div className="score">
          <span className="score-badge tie">=</span>
          <strong>{scores.TIE}</strong>
        </div>
      </div>

      <div className="controls">
        <div className="mode-toggle" role="group" aria-label="Game mode">
          <button
            className={`btn ${mode === 'PVP' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onModeChange('PVP')}
          >
            2 Players
          </button>
          <button
            className={`btn ${mode === 'AI' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onModeChange('AI')}
          >
            Vs AI
          </button>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={onReset}>Reset Score</button>
          <button className="btn btn-accent" onClick={onNewGame}>New Game</button>
        </div>
      </div>

      <div className="turn-indicator">
        <span className={`pill ${currentPlayer === X ? 'x' : 'o'}`}>
          Turn: {currentPlayer}
        </span>
        <span className="status-text">{statusText}</span>
      </div>
    </header>
  );
}

// PUBLIC_INTERFACE
function Board({ board, onClickCell, disabled }) {
  /** Displays the 3x3 board grid */
  return (
    <div className={`board ${disabled ? 'disabled' : ''}`} role="grid" aria-label="Tic Tac Toe board">
      {board.map((cell, idx) => (
        <button
          key={idx}
          className={`cell ${cell === X ? 'x' : cell === O ? 'o' : ''}`}
          onClick={() => onClickCell(idx)}
          disabled={disabled || cell !== EMPTY}
          role="gridcell"
          aria-label={`Cell ${idx + 1}, ${cell ? cell : 'empty'}`}
        >
          {cell}
        </button>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function Footer() {
  /** Minimal footer for attribution */
  return (
    <footer className="footer">
      <span>Built with React</span>
    </footer>
  );
}

// PUBLIC_INTERFACE
export default function App() {
  /** Main application component with game state and logic. */
  const [board, setBoard] = useState(initialBoard);
  const [current, setCurrent] = useState(X);
  const [mode, setMode] = useState('PVP'); // 'PVP' | 'AI'
  const [scores, setScores] = useState({ X: 0, O: 0, TIE: 0 });
  const [gameOver, setGameOver] = useState(false);

  const winner = useMemo(() => evaluateBoard(board), [board]);

  useEffect(() => {
    if (winner) {
      setGameOver(true);
      setScores(prev => ({
        ...prev,
        [winner]: (prev[winner] || 0) + 1
      }));
    }
  }, [winner]);

  // AI move effect
  useEffect(() => {
    if (mode === 'AI' && !gameOver && current === O) {
      const id = setTimeout(() => {
        const idx = pickAiMove(board, O);
        if (idx >= 0) {
          handleMove(idx);
        }
      }, 400); // small delay for UX
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, current, mode, gameOver]);

  const statusText = useMemo(() => {
    if (winner === 'TIE') return 'It\'s a tie!';
    if (winner === X || winner === O) return `Winner: ${winner}`;
    if (mode === 'AI' && current === O) return 'AI is thinking...';
    return 'Game in progress';
  }, [winner, mode, current]);

  function handleMove(idx) {
    if (gameOver) return;
    if (board[idx] !== EMPTY) return;

    const next = [...board];
    next[idx] = current;
    setBoard(next);

    const result = evaluateBoard(next);
    if (!result) {
      setCurrent(prev => (prev === X ? O : X));
    }
  }

  function handleCellClick(idx) {
    if (mode === 'AI' && current === O) return; // prevent human clicking on AI turn
    handleMove(idx);
  }

  // PUBLIC_INTERFACE
  function newGame() {
    /** Start a new round without resetting scores */
    setBoard(initialBoard());
    setCurrent(X);
    setGameOver(false);
  }

  // PUBLIC_INTERFACE
  function resetScore() {
    /** Reset the cumulative scoreboard and start a fresh game */
    setScores({ X: 0, O: 0, TIE: 0 });
    newGame();
  }

  // PUBLIC_INTERFACE
  function changeMode(nextMode) {
    /** Change between PVP and AI, reset board but keep scores */
    setMode(nextMode);
    newGame();
  }

  return (
    <div className="app-shell">
      <Header
        mode={mode}
        currentPlayer={current}
        scores={scores}
        statusText={statusText}
        onModeChange={changeMode}
        onReset={resetScore}
        onNewGame={newGame}
      />

      <main className="main">
        <div className="board-wrapper">
          <Board board={board} onClickCell={handleCellClick} disabled={!!winner || (mode === 'AI' && current === O)} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
