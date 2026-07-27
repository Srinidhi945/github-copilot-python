import sudoku_logic


def count_clues(board):
    return sum(1 for row in board for value in row if value != sudoku_logic.EMPTY)


def test_create_empty_board_returns_9x9_grid():
    board = sudoku_logic.create_empty_board()

    assert len(board) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in board)
    assert all(value == sudoku_logic.EMPTY for row in board for value in row)


def test_is_safe_rejects_conflicting_values():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 1
    board[0][1] = 2
    board[1][0] = 2

    assert sudoku_logic.is_safe(board, 1, 1, 1) is False


def test_is_safe_allows_valid_value_in_empty_cell():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 1
    board[0][1] = 2
    board[1][0] = 2

    assert sudoku_logic.is_safe(board, 1, 1, 3) is True


def test_generate_puzzle_returns_puzzle_and_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(clues=35)

    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in puzzle)
    assert all(len(row) == sudoku_logic.SIZE for row in solution)
    assert puzzle != solution


def test_solved_board_has_exactly_one_solution():
    board = sudoku_logic.create_empty_board()
    sudoku_logic.fill_board(board)

    assert sudoku_logic.count_solutions(board, limit=2) == 1


def test_non_unique_board_reaches_solution_limit():
    board = sudoku_logic.create_empty_board()

    assert sudoku_logic.count_solutions(board, limit=2) == 2


def test_generate_puzzle_produces_uniquely_solvable_puzzle():
    puzzle, _ = sudoku_logic.generate_puzzle(clues=35)

    assert sudoku_logic.count_solutions(puzzle, limit=2) == 1


def test_difficulty_mapping_uses_expected_target_clues():
    assert sudoku_logic.resolve_clues(difficulty='easy') == 40
    assert sudoku_logic.resolve_clues(difficulty='medium') == 32
    assert sudoku_logic.resolve_clues(difficulty='hard') == 28


def test_generate_puzzle_respects_difficulty_by_leaving_fewer_clues_for_harder_levels():
    easy_puzzle, _ = sudoku_logic.generate_puzzle(difficulty='easy')
    medium_puzzle, _ = sudoku_logic.generate_puzzle(difficulty='medium')
    hard_puzzle, _ = sudoku_logic.generate_puzzle(difficulty='hard')

    easy_clues = count_clues(easy_puzzle)
    medium_clues = count_clues(medium_puzzle)
    hard_clues = count_clues(hard_puzzle)

    assert easy_clues > medium_clues > hard_clues
