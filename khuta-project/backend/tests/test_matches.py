import os
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# تعيين المفتاح قبل import الـ module لأن matches.py يقرأ المتغير عند التحميل
os.environ["FOOTBALL_API_KEY"] = "test_key"
os.environ["FOOTBALL_API_HOST"] = "v3.football.api-sports.io"

import matches

# تغليف الـ router داخل FastAPI app
app = FastAPI()
app.include_router(matches.router)
client = TestClient(app)


# --- Test 1: Get Upcoming Matches -------------------------------------------

@patch('matches.requests.get')
def test_get_upcoming_matches(mock_requests_get):
    # 1. Arrange
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = {
        "response": [
            {
                "fixture": {"id": 1, "date": "2026-05-25", "status": {"short": "NS", "elapsed": None}},
                "teams": {"home": {"name": "Team A", "logo": ""}, "away": {"name": "Team B", "logo": ""}},
                "goals": {"home": None, "away": None},
                "league": {"name": "SPL"}
            }
        ]
    }
    mock_requests_get.return_value = mock_response

    # 2. Act
    response = client.get("/matches/upcoming")

    # 3. Assert
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["matches"][0]["home_team"] == "Team A"