from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter(
    prefix="/home",
    tags=["Home Matches"]
)

LEAGUE_NAME = "دوري روشن السعودي"


@router.get("/matches")
def get_home_matches():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                id,
                home_team,
                away_team,
                match_time,
                stadium,
                status,
                home_score,
                away_score,
                minute
            FROM matches
            WHERE LOWER(status) IN ('now', 'live', 'ongoing')
            ORDER BY match_time ASC
            LIMIT 1;
        """)

        live_row = cursor.fetchone()
        live_match = format_live_match(live_row) if live_row else None

        cursor.execute("""
            SELECT
                id,
                home_team,
                away_team,
                match_time,
                stadium,
                status,
                base_price
            FROM matches
            WHERE LOWER(status) IN ('upcoming', 'scheduled')
            ORDER BY match_time ASC;
        """)

        upcoming_rows = cursor.fetchall()
        upcoming_matches = [
            format_upcoming_match(row)
            for row in upcoming_rows
        ]

        return {
            "liveMatch": live_match,
            "upcomingMatches": upcoming_matches
        }

    except Exception as error:
        print("Home matches error:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch home matches"
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


def format_live_match(row):
    return {
        "id": row["id"],
        "home_team": row["home_team"],
        "away_team": row["away_team"],
        "date": row["match_time"].isoformat(),
        "league": LEAGUE_NAME,
        "stadium": row["stadium"],
        "status": row["status"],
        "home_goals": row["home_score"],
        "away_goals": row["away_score"],
        "minute": row["minute"]
    }


def format_upcoming_match(row):
    return {
        "id": row["id"],
        "home_team": row["home_team"],
        "away_team": row["away_team"],
        "date": row["match_time"].isoformat(),
        "league": LEAGUE_NAME,
        "stadium": row["stadium"],
        "status": row["status"],
        "base_price": row["base_price"]
    }