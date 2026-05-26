import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime

import tickets

app = FastAPI()
app.include_router(tickets.router)
client = TestClient(app)


# --- Test 1: جلب المباريات بنجاح ---------------------------------------------

@patch('tickets.get_db_connection')
def test_get_matches(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchall.return_value = [
        {
            "id": 1, "home_team": "Team A", "away_team": "Team B",
            "match_time": datetime(2026, 5, 25, 20, 0),
            "stadium_name": "King Fahd Stadium", "base_price": 75.0, "status": "upcoming"
        }
    ]

    response = client.get("/api/tickets/matches")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["home_team"] == "Team A"
    assert data[0]["base_price"] == 75.0


# --- Test 2: ما في مباريات — يرجع قائمة فاضية --------------------------------

@patch('tickets.get_db_connection')
def test_get_matches_empty(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchall.return_value = []

    response = client.get("/api/tickets/matches")

    assert response.status_code == 200
    assert response.json() == []