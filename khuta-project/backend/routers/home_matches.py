from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter(
    prefix="/home",
    tags=["Home Matches"]
)


@router.get("/matches")
def get_home_matches():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Live match: المباراة الحالية فقط
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

        live_match = None

        if live_row:
            live_match = {
                "id": live_row["id"],
                "home_team": live_row["home_team"],
                "away_team": live_row["away_team"],
                "date": live_row["match_time"].isoformat(),
                "league": "دوري روشن السعودي",
                "stadium": live_row["stadium"],
                "status": live_row["status"],

                # أسماء الداتابيس: home_score / away_score
                # أسماء الفرونت: home_goals / away_goals
                "home_goals": live_row["home_score"],
                "away_goals": live_row["away_score"],

                "minute": live_row["minute"]
            }

        # Upcoming matches: المباريات القادمة فقط
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

        upcoming_matches = []

        for row in upcoming_rows:
            upcoming_matches.append({
                "id": row["id"],
                "home_team": row["home_team"],
                "away_team": row["away_team"],
                "date": row["match_time"].isoformat(),
                "league": "دوري روشن السعودي",
                "stadium": row["stadium"],
                "status": row["status"],
                "base_price": row["base_price"]
            })

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