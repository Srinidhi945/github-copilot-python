import copy
import random

SIZE = 9
EMPTY = 0

DIFFICULTY_CLUES = {
    'easy': 40,
    'medium': 32,
    'hard': 28,
}

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True


def find_empty_cell(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col
    return None


def get_candidates(board, row, col):
    possible = []
    for num in range(1, SIZE + 1):
        if is_safe(board, row, col, num):
            possible.append(num)
    return possible


def count_solutions(board, limit=2):
    empty_cell = find_empty_cell(board)
    if empty_cell is None:
        return 1

    row, col = empty_cell
    solutions = 0
    for candidate in get_candidates(board, row, col):
        board[row][col] = candidate
        solutions += count_solutions(board, limit)
        board[row][col] = EMPTY
        if solutions >= limit:
            return solutions
    return solutions


def has_unique_solution(board):
    return count_solutions(board, limit=2) == 1


def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def remove_cells(board, clues):
    attempts = SIZE * SIZE - clues
    while attempts > 0:
        row = random.randrange(SIZE)
        col = random.randrange(SIZE)
        if board[row][col] != EMPTY:
            original_value = board[row][col]
            board[row][col] = EMPTY
            if has_unique_solution(board):
                attempts -= 1
            else:
                board[row][col] = original_value

def resolve_clues(clues=None, difficulty=None):
    if difficulty is not None:
        normalized_difficulty = difficulty.lower()
        if normalized_difficulty in DIFFICULTY_CLUES:
            return DIFFICULTY_CLUES[normalized_difficulty]
        raise ValueError('Invalid difficulty. Expected one of: easy, medium, hard')

    if clues is None:
        return 35
    return clues


def generate_puzzle(clues=35, difficulty=None):
    resolved_clues = resolve_clues(clues=clues, difficulty=difficulty)
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    remove_cells(board, resolved_clues)
    puzzle = deep_copy(board)
    return puzzle, solution
