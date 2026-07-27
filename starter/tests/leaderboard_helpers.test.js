const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { formatElapsedTime, insertLeaderboardEntry, requestJson } = require('../static/main.js');

test('formatElapsedTime formats seconds as MM:SS', () => {
  assert.equal(formatElapsedTime(65), '01:05');
  assert.equal(formatElapsedTime(7), '00:07');
});

test('insertLeaderboardEntry adds a new entry when there is room', () => {
  const entries = [];
  const result = insertLeaderboardEntry(entries, {
    name: 'Ada',
    elapsedTime: 30,
    difficulty: 'easy',
    hintsUsed: 0,
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Ada');
});

test('insertLeaderboardEntry replaces the slowest entry when a faster score qualifies', () => {
  const entries = [
    { name: 'Alice', elapsedTime: 90, difficulty: 'easy', hintsUsed: 0 },
    { name: 'Bob', elapsedTime: 100, difficulty: 'medium', hintsUsed: 1 },
    { name: 'Cara', elapsedTime: 110, difficulty: 'hard', hintsUsed: 2 },
    { name: 'Drew', elapsedTime: 120, difficulty: 'easy', hintsUsed: 0 },
    { name: 'Eli', elapsedTime: 130, difficulty: 'medium', hintsUsed: 1 },
    { name: 'Faye', elapsedTime: 140, difficulty: 'hard', hintsUsed: 2 },
    { name: 'Gus', elapsedTime: 150, difficulty: 'easy', hintsUsed: 0 },
    { name: 'Hana', elapsedTime: 160, difficulty: 'medium', hintsUsed: 1 },
    { name: 'Ian', elapsedTime: 170, difficulty: 'hard', hintsUsed: 2 },
    { name: 'June', elapsedTime: 180, difficulty: 'easy', hintsUsed: 0 },
  ];

  const result = insertLeaderboardEntry(entries, {
    name: 'Kai',
    elapsedTime: 80,
    difficulty: 'hard',
    hintsUsed: 1,
  });

  assert.equal(result.length, 10);
  assert.equal(result[9].name, 'Ian');
  assert.equal(result[0].name, 'Kai');
});

test('insertLeaderboardEntry ignores slower or equal scores when the board is full', () => {
  const entries = [
    { name: 'Alice', elapsedTime: 90, difficulty: 'easy', hintsUsed: 0 },
    { name: 'Bob', elapsedTime: 100, difficulty: 'medium', hintsUsed: 1 },
    { name: 'Cara', elapsedTime: 110, difficulty: 'hard', hintsUsed: 2 },
    { name: 'Drew', elapsedTime: 120, difficulty: 'easy', hintsUsed: 0 },
    { name: 'Eli', elapsedTime: 130, difficulty: 'medium', hintsUsed: 1 },
    { name: 'Faye', elapsedTime: 140, difficulty: 'hard', hintsUsed: 2 },
    { name: 'Gus', elapsedTime: 150, difficulty: 'easy', hintsUsed: 0 },
    { name: 'Hana', elapsedTime: 160, difficulty: 'medium', hintsUsed: 1 },
    { name: 'Ian', elapsedTime: 170, difficulty: 'hard', hintsUsed: 2 },
    { name: 'June', elapsedTime: 180, difficulty: 'easy', hintsUsed: 0 },
  ];

  const slower = insertLeaderboardEntry(entries, {
    name: 'Kai',
    elapsedTime: 181,
    difficulty: 'hard',
    hintsUsed: 1,
  });
  const equal = insertLeaderboardEntry(entries, {
    name: 'Lia',
    elapsedTime: 180,
    difficulty: 'hard',
    hintsUsed: 1,
  });

  assert.equal(slower.length, 10);
  assert.equal(equal.length, 10);
  assert.deepEqual(slower.map((entry) => entry.name), entries.map((entry) => entry.name));
  assert.deepEqual(equal.map((entry) => entry.name), entries.map((entry) => entry.name));
});

test('requestJson returns a readable error for failed responses', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 400,
    statusText: 'Bad Request',
    text: async () => JSON.stringify({ error: 'Unable to start a new game.' }),
  });

  try {
    const result = await requestJson('/new');
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Unable to start a new game.');
  } finally {
    global.fetch = originalFetch;
  }
});

test('leaderboard template includes the required table headers', () => {
  const templatePath = path.join(__dirname, '..', 'templates', 'index.html');
  const template = fs.readFileSync(templatePath, 'utf8');

  const requiredHeaders = ['Rank', 'Name', 'Time', 'Difficulty', 'Hints'];
  for (const header of requiredHeaders) {
    assert.match(template, new RegExp(`<th[^>]*>${header}</th>`));
  }
});
