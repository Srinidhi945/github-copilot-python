// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let playerBoard = [];
let lockedPositions = new Set();
let initialCluePositions = new Set();
let hintedPositions = new Set();
let hintsUsed = 0;

function getCellKey(row, col) {
  return `${row},${col}`;
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function updateCellClasses() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const inp = inputs[idx];
      const key = getCellKey(i, j);
      const isLocked = lockedPositions.has(key);
      const isInitial = initialCluePositions.has(key);
      const isHinted = hintedPositions.has(key);
      inp.className = 'sudoku-cell';
      if (isLocked) {
        inp.disabled = true;
      } else {
        inp.disabled = false;
      }
      if (isInitial) {
        inp.classList.add('prefilled');
      }
      if (isHinted) {
        inp.classList.add('hinted');
      }
    }
  }
  applyInvalidFeedback();
}

function applyInvalidFeedback() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const idx = row * SIZE + col;
      const inp = inputs[idx];
      const key = getCellKey(row, col);
      const isLocked = lockedPositions.has(key);
      const value = playerBoard[row][col];
      if (value === 0 || isLocked) {
        inp.classList.remove('invalid');
        continue;
      }
      const conflicts = hasConflict(row, col, value);
      inp.classList.toggle('invalid', conflicts);
    }
  }
}

function hasConflict(row, col, value) {
  for (let c = 0; c < SIZE; c++) {
    if (c !== col && playerBoard[row][c] === value) {
      return true;
    }
  }
  for (let r = 0; r < SIZE; r++) {
    if (r !== row && playerBoard[r][col] === value) {
      return true;
    }
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && playerBoard[r][c] === value) {
        return true;
      }
    }
  }
  return false;
}

function renderPuzzle(data) {
  puzzle = data.puzzle.map((row) => row.slice());
  playerBoard = data.puzzle.map((row) => row.slice());
  lockedPositions = new Set((data.locked_positions || []).map(([row, col]) => getCellKey(row, col)));
  initialCluePositions = new Set((data.initial_clue_positions || []).map(([row, col]) => getCellKey(row, col)));
  hintedPositions = new Set();
  hintsUsed = data.hints_used || 0;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const inp = inputs[idx];
      const value = playerBoard[i][j];
      if (value !== 0) {
        inp.value = value;
      } else {
        inp.value = '';
      }
    }
  }
  updateCellClasses();
}

function handleBoardInput(event) {
  const target = event.target;
  if (!target.classList.contains('sudoku-cell')) {
    return;
  }
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  const key = getCellKey(row, col);
  if (lockedPositions.has(key)) {
    target.value = playerBoard[row][col] !== 0 ? playerBoard[row][col] : '';
    return;
  }
  const val = target.value.replace(/[^1-9]/g, '');
  target.value = val;
  playerBoard[row][col] = val ? parseInt(val, 10) : 0;
  updateCellClasses();
}

async function newGame() {
  const difficulty = document.getElementById('difficulty-select').value;
  const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
  const data = await res.json();
  renderPuzzle(data);
  document.getElementById('message').innerText = '';
}

async function requestHint() {
  const board = playerBoard.map((row) => row.slice());
  const res = await fetch('/hint', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  playerBoard[data.row][data.col] = data.value;
  lockedPositions.add(getCellKey(data.row, data.col));
  hintedPositions.add(getCellKey(data.row, data.col));
  hintsUsed = data.hints_used;
  renderPuzzle({
    puzzle: playerBoard,
    locked_positions: Array.from(lockedPositions).map((key) => key.split(',').map(Number)),
    initial_clue_positions: Array.from(initialCluePositions).map((key) => key.split(',').map(Number)),
    hints_used: hintsUsed,
  });
  msg.style.color = '#8a6d3b';
  msg.innerText = `Hint used. Total hints: ${hintsUsed}`;
}

async function checkSolution() {
  const board = playerBoard.map((row) => row.slice());
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(([row, col]) => getCellKey(row, col)));
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    const key = `${Math.floor(idx / SIZE)},${idx % SIZE}`;
    const isLocked = lockedPositions.has(key);
    if (isLocked) {
      continue;
    }
    inp.classList.toggle('incorrect', incorrect.has(key));
  }
  if (data.is_complete) {
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
  } else if (incorrect.size === 0) {
    msg.style.color = '#388e3c';
    msg.innerText = 'No incorrect entries found.';
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  }
}

// Wire buttons
window.addEventListener('load', () => {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.addEventListener('input', handleBoardInput);
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('hint-solution').addEventListener('click', requestHint);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  newGame();
});