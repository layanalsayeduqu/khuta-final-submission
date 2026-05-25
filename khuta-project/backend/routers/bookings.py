from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import psycopg2.extras

from jose import jwt, JWTError
import os

from database import get_db_connection

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")


class ValidateQRRequest(BaseModel):
    qr_value: str


def get_current_user(authorization: str):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


def get_user_name(user_id: int):
    connection = get_db_connection()
    cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cursor.execute(
            "SELECT name FROM users WHERE id = %s;",
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return user["name"]

    finally:
        cursor.close()
        connection.close()


@router.get("/")
def get_bookings(authorization: str = Header(None)):
    payload = get_current_user(authorization)

    user_name = get_user_name(payload["user_id"])

    connection = get_db_connection()
    cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cursor.execute("""
        SELECT
            t.id,
            t.qr_token,
            t.seat_number,
            t.user_name,
            t.price,
            t.status,
            t.stadium_name,
            t.match_date,
            t.match_time,
            t.created_at,
            m.home_team,
            m.away_team
        FROM tickets t
        LEFT JOIN matches m
        ON m.id = t.match_id
        WHERE LOWER(t.user_name) = LOWER(%s)
        ORDER BY t.created_at DESC;
    """, (user_name,))

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    result = []

    for ticket in rows:
        result.append({
            "id": ticket["id"],
            "qr_token": ticket["qr_token"],
            "seat_number": ticket["seat_number"],
            "user_name": ticket["user_name"],
            "price": float(ticket["price"]) if ticket["price"] else 0,
            "status": ticket["status"],
            "stadium_name": ticket["stadium_name"],
            "match_date": ticket["match_date"].isoformat() if ticket["match_date"] else None,
            "match_time": str(ticket["match_time"])[:5] if ticket["match_time"] else None,
            "home_team": ticket["home_team"],
            "away_team": ticket["away_team"]
        })

    return result


@router.post("/validate-qr")
def validate_qr(data: ValidateQRRequest):
    token = data.qr_value.strip()

    if token.upper().startswith("TICKET:"):
        token = token[len("TICKET:"):]

    connection = get_db_connection()
    cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cursor.execute("""
            SELECT
                t.id,
                t.qr_token,
                t.seat_number,
                t.user_name,
                t.price,
                t.status,
                t.stadium_name,
                t.match_date,
                t.match_time,
                m.home_team,
                m.away_team
            FROM tickets t
            LEFT JOIN matches m
            ON m.id = t.match_id
            WHERE t.qr_token = %s;
        """, (token,))

        ticket = cursor.fetchone()

        if not ticket:
            raise HTTPException(status_code=404, detail="QR code is not valid")

        if ticket["status"] == "used":
            raise HTTPException(status_code=409, detail="Ticket has already been used")

        if ticket["status"] == "cancelled":
            raise HTTPException(status_code=410, detail="Ticket has been cancelled")

        cursor.execute("""
            UPDATE tickets
            SET status = 'used'
            WHERE qr_token = %s;
        """, (token,))

        connection.commit()

        return {
            "valid": True,
            "message": "Ticket validated successfully",
            "ticket": {
                "id": ticket["id"],
                "seat_number": ticket["seat_number"],
                "user_name": ticket["user_name"],
                "price": float(ticket["price"]) if ticket["price"] else 0,
                "status": "used",
                "stadium_name": ticket["stadium_name"],
                "match_date": ticket["match_date"].isoformat() if ticket["match_date"] else None,
                "match_time": str(ticket["match_time"])[:5] if ticket["match_time"] else None,
                "home_team": ticket["home_team"],
                "away_team": ticket["away_team"]
            }
        }

    except HTTPException:
        connection.rollback()
        raise

    except Exception as error:
        connection.rollback()
        raise HTTPException(status_code=500, detail=str(error))

    finally:
        cursor.close()
        connection.close()