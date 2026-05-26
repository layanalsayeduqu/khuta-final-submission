import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

import bookings

app = FastAPI()
app.include_router(bookings.router)
client = TestClient(app)


# --- Test 1: مسح QR بنجاح ---------------------------------------------------

@patch('bookings.get_db_connection')
def test_validate_qr_success(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchone.return_value = {
        "id": 1, "qr_token": "VALID_TOKEN", "seat_number": "A1",
        "user_name": "Sara", "price": 100, "status": "active",
        "stadium_name": "Stadium", "match_date": None, "match_time": None,
        "home_team": "A", "away_team": "B"
    }

    response = client.post("/api/bookings/validate-qr", json={"qr_value": "TICKET:VALID_TOKEN"})

    assert response.status_code == 200
    assert response.json()["valid"] == True
    assert response.json()["ticket"]["status"] == "used"


# --- Test 2: تذكرة مستخدمة مسبقاً -------------------------------------------

@patch('bookings.get_db_connection')
def test_validate_qr_already_used(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchone.return_value = {
        "id": 1, "status": "used"
    }

    response = client.post("/api/bookings/validate-qr", json={"qr_value": "VALID_TOKEN"})

    assert response.status_code == 409
    assert response.json()["detail"] == "Ticket has already been used"


# --- Test 3: QR token غير موجود في قاعدة البيانات ----------------------------

@patch('bookings.get_db_connection')
def test_validate_qr_not_found(mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchone.return_value = None

    response = client.post("/api/bookings/validate-qr", json={"qr_value": "INVALID_TOKEN"})

    assert response.status_code == 404


# --- Test 4: QR بصيغة فاضية --------------------------------------------------

def test_validate_qr_empty_value():
    response = client.post("/api/bookings/validate-qr", json={"qr_value": ""})

    assert response.status_code in [400, 404, 422]