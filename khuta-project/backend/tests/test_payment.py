import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime

import payment

app = FastAPI()
app.include_router(payment.router)
client = TestClient(app)


# --- Test 1: شراء تذكرة بنجاح ------------------------------------------------

@patch('payment.get_db_connection')
@patch('payment.get_current_user')
@patch('payment.get_user_name')
def test_purchase_ticket_success(mock_get_user_name, mock_get_user, mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_get_user.return_value = {"user_id": 1}
    mock_get_user_name.return_value = "Sara"

    mock_cursor.fetchone.side_effect = [
        {"id": 99, "seat_id": "VIP-1", "status": "available", "is_available": True},
        {"id": 500},
        {"stadium_name": "King Abdullah", "match_time": datetime.now()},
        {"id": 1000}
    ]

    purchase_data = {
        "match_id": 1,
        "seat_id": 99,
        "seat_label": "VIP-1",
        "amount": 150.0,
        "payment_method": "card",
        "card_last4": "1234"
    }

    response = client.post(
        "/api/payment/purchase",
        json=purchase_data,
        headers={"Authorization": "Bearer fake_token"}
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Purchase successful"
    assert response.json()["status"] == "success"
    assert "ticket_code" in response.json()


# --- Test 2: المقعد محجوز مسبقاً ---------------------------------------------

@patch('payment.get_db_connection')
@patch('payment.get_current_user')
@patch('payment.get_user_name')
def test_purchase_ticket_seat_already_booked(mock_get_user_name, mock_get_user, mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_get_user.return_value = {"user_id": 1}
    mock_get_user_name.return_value = "Sara"

    mock_cursor.fetchone.return_value = {
        "id": 99, "seat_id": "VIP-1", "status": "booked", "is_available": False
    }

    purchase_data = {
        "match_id": 1,
        "seat_id": 99,
        "seat_label": "VIP-1",
        "amount": 150.0,
        "payment_method": "card",
        "card_last4": "1234"
    }

    response = client.post(
        "/api/payment/purchase",
        json=purchase_data,
        headers={"Authorization": "Bearer fake_token"}
    )

    assert response.status_code in [400, 409]


# --- Test 3: بدون token -------------------------------------------------------

@patch('payment.get_current_user')
def test_purchase_ticket_no_token(mock_get_user):
    mock_get_user.side_effect = Exception("Invalid token")

    local_client = TestClient(app, raise_server_exceptions=False)

    purchase_data = {
        "match_id": 1,
        "seat_id": 99,
        "seat_label": "VIP-1",
        "amount": 150.0,
        "payment_method": "card",
        "card_last4": "1234"
    }

    response = local_client.post("/api/payment/purchase", json=purchase_data)

    assert response.status_code in [401, 422, 500]


# --- Test 4: المقعد غير موجود ------------------------------------------------

@patch('payment.get_db_connection')
@patch('payment.get_current_user')
@patch('payment.get_user_name')
def test_purchase_ticket_seat_not_found(mock_get_user_name, mock_get_user, mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_get_user.return_value = {"user_id": 1}
    mock_get_user_name.return_value = "Sara"

    mock_cursor.fetchone.return_value = None

    purchase_data = {
        "match_id": 1,
        "seat_id": 9999,
        "seat_label": "INVALID",
        "amount": 150.0,
        "payment_method": "card",
        "card_last4": "1234"
    }

    response = client.post("/api/payment/purchase",
        json=purchase_data,
        headers={"Authorization": "Bearer fake_token"}
    )

    assert response.status_code in [400, 404]