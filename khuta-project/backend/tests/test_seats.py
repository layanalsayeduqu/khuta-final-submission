import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

import seats

app = FastAPI()
app.include_router(seats.router)
client = TestClient(app)


# --- Test 1: جلب المقاعد بنجاح -----------------------------------------------

@patch('seats.get_db_connection')
def test_get_seats(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchall.return_value = [
        {
            "id": 1, "seat_id": "A1", "stand": "North", "section": "1",
            "row": "A", "seat": "1", "status": "available",
            "category": "North", "is_available": True
        }
    ]

    response = client.get("/api/seats/matches/1")

    assert response.status_code == 200
    assert response.json()[0]["seat_id"] == "A1"
    assert response.json()[0]["is_available"] == True


# --- Test 2: كل المقاعد محجوزة -----------------------------------------------

@patch('seats.get_db_connection')
def test_get_seats_all_booked(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchall.return_value = [
        {
            "id": 1, "seat_id": "A1", "stand": "North", "section": "1",
            "row": "A", "seat": "1", "status": "booked",
            "category": "North", "is_available": False
        }
    ]

    response = client.get("/api/seats/matches/1")

    assert response.status_code == 200
    assert response.json()[0]["is_available"] == False


# --- Test 3: مباراة غير موجودة — يرجع قائمة فاضية ----------------------------

@patch('seats.get_db_connection')
def test_get_seats_match_not_found(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchall.return_value = []

    response = client.get("/api/seats/matches/9999")

    assert response.status_code == 200
    assert response.json() == []