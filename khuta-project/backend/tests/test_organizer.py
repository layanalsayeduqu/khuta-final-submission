import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from routers import organizer

app = FastAPI()
app.include_router(organizer.router)
client = TestClient(app)


@patch('routers.organizer.get_db_connection')
def test_get_matches_success(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchall.return_value = [
        {
            "id": 1,
            "home_team": "Al Hilal",
            "away_team": "Al Nassr",
            "match_time": "2026-05-25 20:00",
            "stadium": "King Fahd Stadium",
            "status": "upcoming",
            "home_score": 0,
            "away_score": 0,
            "minute": 0,
            "base_price": 150
        }
    ]

    response = client.get("/organizer/matches")

    assert response.status_code == 200
    assert len(response.json()["matches"]) == 1
    assert response.json()["matches"][0]["home_team"] == "Al Hilal"


@patch('routers.organizer.get_db_connection')
def test_get_matches_empty(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchall.return_value = []

    response = client.get("/organizer/matches")

    assert response.status_code == 200
    assert response.json()["matches"] == []


@patch('routers.organizer.get_db_connection')
def test_add_match_success(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchone.return_value = {"id": 10}

    match_data = {
        "home_team": "Al Hilal",
        "away_team": "Al Nassr",
        "match_time": "2026-05-25 20:00",
        "stadium": "King Fahd Stadium",
        "status": "upcoming",
        "home_score": 0,
        "away_score": 0,
        "minute": 0,
        "base_price": 150
    }

    response = client.post("/organizer/matches", json=match_data)

    assert response.status_code == 200
    assert response.json()["success"] == True
    assert response.json()["id"] == 10
    mock_conn.commit.assert_called_once()


@patch('routers.organizer.get_db_connection')
def test_add_match_db_error(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.execute.side_effect = Exception("DB Error")

    match_data = {
        "home_team": "Al Hilal",
        "away_team": "Al Nassr",
        "match_time": "2026-05-25 20:00",
        "stadium": "King Fahd Stadium"
    }

    response = client.post("/organizer/matches", json=match_data)

    assert response.status_code == 500
    assert response.json()["detail"] == "DB Error"
    mock_conn.rollback.assert_called_once()


@patch('routers.organizer.get_db_connection')
def test_update_match_success(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchone.return_value = {"id": 1}

    match_data = {
        "home_team": "Al Ahli",
        "away_team": "Al Ittihad",
        "match_time": "2026-06-01 21:00",
        "stadium": "King Abdullah Stadium",
        "status": "upcoming",
        "home_score": 0,
        "away_score": 0,
        "minute": 0,
        "base_price": 200
    }

    response = client.put("/organizer/matches/1", json=match_data)

    assert response.status_code == 200
    assert response.json()["success"] == True
    mock_conn.commit.assert_called_once()



@patch('routers.organizer.get_db_connection')
def test_update_match_not_found(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchone.return_value = None

    match_data = {
        "home_team": "Al Ahli",
        "away_team": "Al Ittihad",
        "match_time": "2026-06-01 21:00",
        "stadium": "King Abdullah Stadium"
    }

    response = client.put("/organizer/matches/9999", json=match_data)

    assert response.status_code == 404
    assert response.json()["detail"] == "Match not found"
    mock_conn.rollback.assert_called_once()



@patch('routers.organizer.get_db_connection')
def test_get_facilities_success(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchall.return_value = [
        {
            "id": 1,
            "name_ar": "دورة مياه",
            "type": "restroom",
            "geom": "POINT(39.1 22.1)"
        }
    ]

    response = client.get("/organizer/facilities")

    assert response.status_code == 200
    assert len(response.json()["facilities"]) == 1
    assert response.json()["facilities"][0]["type"] == "restroom"



@patch('routers.organizer.get_db_connection')
def test_get_facilities_empty(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchall.return_value = []

    response = client.get("/organizer/facilities")

    assert response.status_code == 200
    assert response.json()["facilities"] == []



@patch('routers.organizer.get_db_connection')
def test_add_facility_success(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchone.return_value = {"id": 5}

    facility_data = {
        "name_ar": "بوابة 1",
        "type": "gate",
        "geom": "POINT(39.1 22.1)"
    }

    response = client.post("/organizer/facilities", json=facility_data)

    assert response.status_code == 200
    assert response.json()["success"] == True
    assert response.json()["id"] == 5
    mock_conn.commit.assert_called_once()



@patch('routers.organizer.get_db_connection')
def test_add_facility_db_error(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.execute.side_effect = Exception("DB Error")

    facility_data = {
        "name_ar": "بوابة 1",
        "type": "gate",
        "geom": "POINT(39.1 22.1)"
    }

    response = client.post("/organizer/facilities", json=facility_data)

    assert response.status_code == 500
    assert response.json()["detail"] == "DB Error"
    mock_conn.rollback.assert_called_once()


@patch('routers.organizer.get_db_connection')
def test_delete_facility_success(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchone.return_value = {"id": 1}

    response = client.delete("/organizer/facilities/1")

    assert response.status_code == 200
    assert response.json()["success"] == True
    mock_conn.commit.assert_called_once()



@patch('routers.organizer.get_db_connection')
def test_delete_facility_not_found(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchone.return_value = None

    response = client.delete("/organizer/facilities/9999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Facility not found"
    mock_conn.rollback.assert_called_once()