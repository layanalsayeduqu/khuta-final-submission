import os
import requests

from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/matches",
    tags=["Matches"]
)

FOOTBALL_API_KEY = os.getenv("FOOTBALL_API_KEY")
FOOTBALL_API_HOST = os.getenv(
    "FOOTBALL_API_HOST",
    "v3.football.api-sports.io"
)
SAUDI_LEAGUE_ID = os.getenv("SAUDI_LEAGUE_ID", "307")
FOOTBALL_SEASON = os.getenv("FOOTBALL_SEASON", "2025")

BASE_URL = f"https://{FOOTBALL_API_HOST}"


def football_api_get(endpoint: str, params: dict | None = None):
    if not FOOTBALL_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="FOOTBALL_API_KEY is missing in .env"
        )

    url = f"{BASE_URL}/{endpoint}"

    headers = {
        "x-apisports-key": FOOTBALL_API_KEY
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=15
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Football API error: {str(error)}"
        )



@router.get("/upcoming")
def get_upcoming_matches():
    data = football_api_get(
        "fixtures",
        {
            "league": SAUDI_LEAGUE_ID,
            "season": FOOTBALL_SEASON,
            "from": "2024-08-01",
            "to": "2025-05-31",
            "timezone": "Asia/Riyadh"
        }
    )

    matches = []

    for item in data.get("response", []):
        matches.append({
            "id": item["fixture"]["id"],
            "date": item["fixture"]["date"],
            "status": item["fixture"]["status"]["short"],
            "elapsed": item["fixture"]["status"]["elapsed"],
            "home_team": item["teams"]["home"]["name"],
            "away_team": item["teams"]["away"]["name"],
            "home_logo": item["teams"]["home"]["logo"],
            "away_logo": item["teams"]["away"]["logo"],
            "home_goals": item["goals"]["home"],
            "away_goals": item["goals"]["away"],
            "league": item["league"]["name"]
        })

    return {
        "count": len(matches),
        "matches": matches
    }


@router.get("/live")
def get_live_matches():
    return football_api_get(
        "fixtures",
        {
            "live": SAUDI_LEAGUE_ID,
            "timezone": "Asia/Riyadh"
        }
    )


@router.get("/test")
def test_football_api():
    return football_api_get("status")