# Flask Sudoku Game

This project is a Flask-based Sudoku app with a responsive web UI. The game generates unique-solution puzzles, supports Easy, Medium, and Hard difficulties, and includes immediate invalid-move feedback, Hint and Check Puzzle actions, a timer, a Top 10 leaderboard stored in localStorage, dark mode, and a responsive layout.

## Setup

### Dependencies

- Python 3
- A modern web browser
- Node.js is only required to run the JavaScript leaderboard tests

### Create and activate a virtual environment

Windows PowerShell:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run the application

```bash
python app.py
```

Open http://127.0.0.1:5000 in your browser.

## Testing

Run the current test suites with:

```bash
python -m pytest -q
```

```bash
node --test tests/leaderboard_helpers.test.js
```
