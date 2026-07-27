import random

from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Keep a simple in-memory store for the authoritative game state
CURRENT = {
    'puzzle': None,
    'solution': None,
    'locked_positions': set(),
    'hints_used': 0,
}


def get_locked_positions():
    puzzle = CURRENT.get('puzzle')
    if not puzzle:
        return set()

    locked_positions = CURRENT.get('locked_positions', set())
    if locked_positions:
        return locked_positions

    return {
        (row, col)
        for row, values in enumerate(puzzle)
        for col, value in enumerate(values)
        if value != sudoku_logic.EMPTY
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new')
def new_game():
    difficulty = request.args.get('difficulty')
    clues_param = request.args.get('clues')

    if difficulty is not None:
        try:
            puzzle, solution = sudoku_logic.generate_puzzle(difficulty=difficulty)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400
    else:
        clues = int(clues_param) if clues_param is not None else 35
        puzzle, solution = sudoku_logic.generate_puzzle(clues=clues)

    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    CURRENT['locked_positions'] = {
        (row, col)
        for row, values in enumerate(puzzle)
        for col, value in enumerate(values)
        if value != sudoku_logic.EMPTY
    }
    CURRENT['hints_used'] = 0
    return jsonify({
        'puzzle': puzzle,
        'locked_positions': [[row, col] for row, col in CURRENT['locked_positions']],
        'initial_clue_positions': [[row, col] for row, col in CURRENT['locked_positions']],
        'hints_used': CURRENT['hints_used'],
    })


@app.route('/hint', methods=['POST'])
def give_hint():
    data = request.json or {}
    board = data.get('board')
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    if not sudoku_logic.validate_board(board):
        return jsonify({'error': 'Board must be a 9x9 array of integers between 0 and 9'}), 400

    locked_positions = get_locked_positions()
    for row, col in locked_positions:
        if board[row][col] != solution[row][col]:
            return jsonify({'error': 'Locked cells cannot be overwritten'}), 400

    empty_cells = [
        (row, col)
        for row in range(sudoku_logic.SIZE)
        for col in range(sudoku_logic.SIZE)
        if board[row][col] == sudoku_logic.EMPTY and (row, col) not in locked_positions
    ]
    if not empty_cells:
        return jsonify({'error': 'No empty cells remain'}), 400

    row, col = empty_cells[0]
    value = solution[row][col]
    CURRENT['locked_positions'].add((row, col))
    CURRENT['hints_used'] += 1
    return jsonify({'row': row, 'col': col, 'value': value, 'hints_used': CURRENT['hints_used']})


@app.route('/check', methods=['POST'])
def check_solution():
    data = request.json or {}
    board = data.get('board')
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400
    if not sudoku_logic.validate_board(board):
        return jsonify({'error': 'Board must be a 9x9 array of integers between 0 and 9'}), 400

    locked_positions = get_locked_positions()
    for row, col in locked_positions:
        if board[row][col] != solution[row][col]:
            return jsonify({'error': 'Locked cells cannot be overwritten'}), 400

    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            if board[i][j] == sudoku_logic.EMPTY:
                continue
            if board[i][j] != solution[i][j]:
                incorrect.append([i, j])

    is_complete = sudoku_logic.is_complete_board(board) and len(incorrect) == 0
    return jsonify({'incorrect': incorrect, 'is_complete': is_complete})

if __name__ == '__main__':
    app.run(debug=True)