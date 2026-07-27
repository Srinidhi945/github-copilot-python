import pytest
import app as app_module


@pytest.fixture
def client():
    app_module.CURRENT['puzzle'] = None
    app_module.CURRENT['solution'] = None
    app_module.app.config['TESTING'] = True
    with app_module.app.test_client() as test_client:
        yield test_client


def test_index_route_returns_html(client):
    response = client.get('/')

    assert response.status_code == 200
    assert 'text/html' in response.content_type


def test_new_game_returns_a_9x9_puzzle(client):
    response = client.get('/new?clues=35')

    assert response.status_code == 200
    payload = response.get_json()
    assert isinstance(payload['puzzle'], list)
    assert len(payload['puzzle']) == 9
    assert all(isinstance(row, list) and len(row) == 9 for row in payload['puzzle'])
    assert all(isinstance(value, int) for row in payload['puzzle'] for value in row)
    assert all(0 <= value <= 9 for row in payload['puzzle'] for value in row)


def test_check_route_reports_incorrect_cells(client):
    solution = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
    ]
    app_module.CURRENT['solution'] = solution
    board = [row[:] for row in solution]
    board[0][0] = 2

    response = client.post('/check', json={'board': board})

    assert response.status_code == 200
    assert response.get_json()['incorrect'] == [[0, 0]]


def test_check_route_without_active_game_returns_error(client):
    response = client.post('/check', json={'board': []})

    assert response.status_code == 400
    assert response.get_json()['error'] == 'No game in progress'


def test_new_game_accepts_named_difficulty(client):
    response = client.get('/new?difficulty=hard')

    assert response.status_code == 200
    payload = response.get_json()
    assert isinstance(payload['puzzle'], list)
    assert len(payload['puzzle']) == 9


def test_new_game_rejects_invalid_difficulty(client):
    response = client.get('/new?difficulty=insane')

    assert response.status_code == 400
    assert response.get_json()['error'] == 'Invalid difficulty. Expected one of: easy, medium, hard'
