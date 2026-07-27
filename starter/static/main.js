// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const LEADERBOARD_STORAGE_KEY = 'sudoku-top10';
const THEME_STORAGE_KEY = 'sudoku-theme';
let puzzle = [];
let playerBoard = [];
let lockedPositions = new Set();
let initialCluePositions = new Set();
let hintedPositions = new Set();
let hintsUsed = 0;
let elapsedSeconds = 0;
let timerStartTime = null;
let timerIntervalId = null;
let isGameCompleted = false;
let completionHandled = false;
let currentDifficulty = 'medium';
let leaderboard = [];

function getCellKey(row, col) {
  return `${row},${col}`;
}

function getBoxClass(row, col) {
  return (Math.floor(row / 3) + Math.floor(col / 3)) % 2 === 0 ? 'box-even' : 'box-odd';
}

function applyTheme(theme) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', normalizedTheme);
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', normalizedTheme === 'dark' ? 'true' : 'false');
    themeToggle.textContent = normalizedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  } catch (error) {
    // Ignore storage failures and keep the UI responsive.
  }
}

function initializeTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
  } catch (error) {
    applyTheme('light');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function formatElapsedTime(seconds) {
  const value = Number(seconds) || 0;
  const minutes = Math.floor(value / 60);
  const remainingSeconds = value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function compareLeaderboardEntries(left, right) {
  if (left.elapsedTime !== right.elapsedTime) {
    return left.elapsedTime - right.elapsedTime;
  }
  return left.name.localeCompare(right.name);
}

function insertLeaderboardEntry(entries, newEntry) {
  const normalizedEntries = entries.map((entry) => ({ ...entry }));
  if (normalizedEntries.length < 10) {
    return [...normalizedEntries, { ...newEntry }].sort(compareLeaderboardEntries);
  }

  const sortedEntries = [...normalizedEntries].sort(compareLeaderboardEntries);
  if (newEntry.elapsedTime >= sortedEntries[sortedEntries.length - 1].elapsedTime) {
    return sortedEntries;
  }

  return [...sortedEntries.slice(0, 9), { ...newEntry }].sort(compareLeaderboardEntries);
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
      inp.classList.add(getBoxClass(i, j));
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

function updateTimerDisplay(value) {
  const timerDisplay = document.getElementById('timer-display');
  if (!timerDisplay) {
    return;
  }
  timerDisplay.textContent = `Time: ${formatElapsedTime(value)}`;
}

function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  timerStartTime = Date.now();
  updateTimerDisplay(elapsedSeconds);
  timerIntervalId = window.setInterval(() => {
    elapsedSeconds = Math.floor((Date.now() - timerStartTime) / 1000);
    updateTimerDisplay(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  if (timerIntervalId !== null) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function resetCompletionState() {
  isGameCompleted = false;
  completionHandled = false;
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay(elapsedSeconds);
}

function getElapsedSeconds() {
  if (timerStartTime === null) {
    return elapsedSeconds;
  }
  return Math.floor((Date.now() - timerStartTime) / 1000);
}

function loadLeaderboard() {
  try {
    const savedEntries = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!savedEntries) {
      leaderboard = [];
      return leaderboard;
    }

    const parsedEntries = JSON.parse(savedEntries);
    if (!Array.isArray(parsedEntries)) {
      leaderboard = [];
      return leaderboard;
    }

    leaderboard = parsedEntries
      .map((entry) => ({
        name: entry.name,
        elapsedTime: Number(entry.elapsedTime) || 0,
        difficulty: entry.difficulty || 'unknown',
        hintsUsed: Number(entry.hintsUsed) || 0,
      }))
      .sort(compareLeaderboardEntries)
      .slice(0, 10);
  } catch (error) {
    leaderboard = [];
  }

  renderLeaderboard();
  return leaderboard;
}

function saveLeaderboard() {
  try {
    window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboard));
  } catch (error) {
    // Ignore storage failures and keep the UI responsive.
  }
}

function renderLeaderboard() {
  const leaderboardList = document.getElementById('leaderboard-list');
  if (!leaderboardList) {
    return;
  }

  if (leaderboard.length === 0) {
    leaderboardList.innerHTML = '<li>No completed games yet.</li>';
    return;
  }

  leaderboardList.innerHTML = '';
  leaderboard.forEach((entry, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${index + 1}. ${entry.name} — ${formatElapsedTime(entry.elapsedTime)} — ${entry.difficulty} — hints: ${entry.hintsUsed}`;
    leaderboardList.appendChild(listItem);
  });
}

function promptForName() {
  while (true) {
    const enteredName = window.prompt('Enter your name for the Top 10 leaderboard:');
    if (enteredName === null) {
      return null;
    }

    const trimmedName = enteredName.trim();
    if (trimmedName) {
      return trimmedName;
    }
  }
}

function handleCompletedGame() {
  if (completionHandled) {
    return;
  }

  completionHandled = true;
  isGameCompleted = true;
  stopTimer();

  const elapsedTime = getElapsedSeconds();
  const message = document.getElementById('message');
  message.style.color = 'var(--message-success-color)';
  message.innerText = `Congratulations! You solved it in ${formatElapsedTime(elapsedTime)} with ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'}.`;

  if (leaderboard.length < 10) {
    const name = promptForName();
    if (name === null) {
      return;
    }

    leaderboard = insertLeaderboardEntry(leaderboard, {
      name,
      elapsedTime,
      difficulty: currentDifficulty,
      hintsUsed,
    });
    saveLeaderboard();
    renderLeaderboard();
    return;
  }

  const slowestEntry = [...leaderboard].sort(compareLeaderboardEntries)[leaderboard.length - 1];
  if (elapsedTime < slowestEntry.elapsedTime) {
    const name = promptForName();
    if (name === null) {
      return;
    }

    leaderboard = insertLeaderboardEntry(leaderboard, {
      name,
      elapsedTime,
      difficulty: currentDifficulty,
      hintsUsed,
    });
    saveLeaderboard();
    renderLeaderboard();
  }
}

function renderPuzzle(data) {
  puzzle = data.puzzle.map((row) => row.slice());
  playerBoard = data.puzzle.map((row) => row.slice());
  lockedPositions = new Set((data.locked_positions || []).map(([row, col]) => getCellKey(row, col)));
  initialCluePositions = new Set((data.initial_clue_positions || []).map(([row, col]) => getCellKey(row, col)));
  const hintedPositionsFromPayload = (data.hinted_positions || []).map(([row, col]) => getCellKey(row, col));
  hintedPositions = new Set(hintedPositionsFromPayload);
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
  currentDifficulty = difficulty;
  resetCompletionState();
  const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
  const data = await res.json();
  renderPuzzle(data);
  document.getElementById('message').innerText = '';
  startTimer();
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
    msg.style.color = 'var(--message-color)';
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
    hinted_positions: Array.from(hintedPositions).map((key) => key.split(',').map(Number)),
    hints_used: hintsUsed,
  });
  msg.style.color = 'var(--cell-hinted-text)';
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
    msg.style.color = 'var(--message-color)';
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
    if (!completionHandled) {
      handleCompletedGame();
    }
    return;
  }

  if (incorrect.size === 0) {
    msg.style.color = 'var(--message-success-color)';
    msg.innerText = 'No incorrect entries found.';
  } else {
    msg.style.color = 'var(--message-color)';
    msg.innerText = 'Some cells are incorrect.';
  }
}

function initializeApp() {
  const boardDiv = document.getElementById('sudoku-board');
  initializeTheme();
  boardDiv.addEventListener('input', handleBoardInput);
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('hint-solution').addEventListener('click', requestHint);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  loadLeaderboard();
  newGame();
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', initializeApp);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatElapsedTime,
    insertLeaderboardEntry,
  };
}