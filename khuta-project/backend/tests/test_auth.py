import os
os.environ.setdefault("SECRET_KEY", "test_secret_key_for_testing")
os.environ.setdefault("ALGORITHM", "HS256")

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

import create_account
import login
import email_verified
import reset_password

app_create = FastAPI()
app_create.include_router(create_account.router)
client_create = TestClient(app_create)

app_login = FastAPI()
app_login.include_router(login.router)
client_login = TestClient(app_login)

app_verify = FastAPI()
app_verify.include_router(email_verified.router)
client_verify = TestClient(app_verify)

app_reset = FastAPI()
app_reset.include_router(reset_password.router)
client_reset = TestClient(app_reset)


# --- Test 1: Register Account -----------------------------------------------

@patch('create_account.get_db_connection')
@patch('create_account.hash_password')
def test_register_success(mock_hash, mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.side_effect = [None, {"id": 1}]
    mock_hash.return_value = "hashed_pw"

    user_data = {
        "name": "Sarah", "email": "s@test.com", "password": "Password123",
        "gender": "Female", "age": 20, "phone": "0500000000"
    }

    response = client_create.post("/auth/register", json=user_data)

    assert response.status_code == 200
    assert response.json()["user_id"] == 1
    mock_conn.commit.assert_called_once()


# --- Test 2: Send and Verify Email ------------------------------------------

@patch('email_verified.get_db_connection')
@patch('email_verified.send_email')
def test_send_and_verify_email(mock_send_email, mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = {"id": 1, "email": "s@test.com"}
    mock_send_email.return_value = None

    res_send = client_verify.post("/auth/send-verification", json={"email": "s@test.com"})
    assert res_send.status_code == 200
    assert res_send.json()["success"] == True

    from email_verified import verification_storage
    code = verification_storage.get("s@test.com")
    assert code is not None

    res_verify = client_verify.post("/auth/verify-email", json={"email": "s@test.com", "code": code})
    assert res_verify.status_code == 200
    assert res_verify.json()["message"] == "Email verified successfully"


# --- Test 3: Login ----------------------------------------------------------

@patch('login.get_db_connection')
@patch('login.verify_password')
def test_login_success(mock_verify, mock_db):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = {
        "id": 1, "name": "Sarah", "email": "s@test.com", "password_hash": "hash"
    }
    mock_verify.return_value = True

    response = client_login.post("/auth/login", json={"email": "s@test.com", "password": "Password123"})

    assert response.status_code == 200
    assert "token" in response.json()
