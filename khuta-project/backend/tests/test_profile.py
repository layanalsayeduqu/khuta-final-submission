import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault("SECRET_KEY", "test_secret_key_for_testing")
os.environ.setdefault("ALGORITHM", "HS256")

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import update_profile

# تغليف الـ router داخل FastAPI app
app = FastAPI()
app.include_router(update_profile.router)
client = TestClient(app)


# --- Test 1: Update Profile -------------------------------------------------

@patch('update_profile.get_db_connection')
@patch('update_profile.get_current_user')
def test_update_profile(mock_get_user, mock_db):
    # @patch('get_db_connection') -> outer -> آخر argument = mock_db
    # @patch('get_current_user')  -> inner -> أول argument = mock_get_user
    # 1. Arrange
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_get_user.return_value = {"user_id": 1}

    update_data = {
        "name": "Sarah New", "gender": "Female", "age": 22,
        "phone": "0511111111", "favorite_club": "Al Nassr"
    }

    # 2. Act
    response = client.put(
        "/profile/update",
        json=update_data,
        headers={"Authorization": "Bearer fake_token"}
    )

    # 3. Assert
    assert response.status_code == 200
    assert response.json()["success"] is True
    mock_conn.commit.assert_called_once()
