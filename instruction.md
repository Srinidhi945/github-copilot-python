# GitHub Copilot Instructions

## Project Overview

This project refactors a legacy Python Flask Sudoku application into a
modern, maintainable, responsive Sudoku game.

GitHub Copilot should assist with development while preserving existing
working behavior unless a change is explicitly required.

## Code Quality

- Write clear, readable, maintainable code.
- Follow PEP 8 conventions for Python.
- Prefer small, reusable functions and logical components.
- Avoid unnecessary duplication.
- Use descriptive variable and function names.
- Add comments where logic is not immediately obvious.
- Use consistent error handling.
- Do not introduce unnecessary dependencies.
- Explain significant architectural changes before implementing them.

## Testing

- Use pytest as the testing framework.
- Preserve existing working behavior while refactoring.
- Tests should be deterministic whenever possible.
- Run the test suite after refactoring or implementing a feature.
- Do not modify tests merely to make failing code pass unless the test
  itself is incorrect.

## Sudoku Requirements

The application must:

- Generate valid 9x9 Sudoku puzzles.
- Ensure generated puzzles have exactly one solution.
- Support Easy, Medium, and Hard difficulty levels by varying the
  number of prefilled cells.
- Lock prefilled cells.
- Provide immediate visual feedback for invalid moves.
- Detect successful puzzle completion.
- Provide a Hint feature that fills one correct empty cell and locks it.
- Provide a Check feature that highlights incorrect entries.
- Track game completion time.
- Maintain a Top 10 leaderboard containing player name, completion
  time, difficulty, and hints used.
- Persist leaderboard data using browser local storage.
- Provide a dark mode toggle.

## Frontend and Accessibility

- Keep HTML, CSS, and JavaScript organized and maintainable.
- Support both light and dark modes.
- Make the layout responsive for desktop and mobile devices.
- Keep text and controls readable at different screen sizes.
- Visually distinguish alternating 3x3 Sudoku squares.
- Prefer semantic HTML and accessible controls.
- Preserve visible keyboard focus states.
- Avoid relying only on color to communicate important game states.

## Working With Copilot

- Analyze existing code before suggesting large changes.
- Prefer incremental changes over rewriting the entire application.
- Explain unfamiliar or complex approaches.
- Do not remove working functionality unless explicitly required.
- When multiple approaches exist, prefer the simplest maintainable solution.