import os
from decimal import Decimal

import psycopg2.extras
from fastapi import APIRouter, Header, HTTPException
from jose import JWTError, jwt

from database import get_db_connection

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"]
)


def get_user_id_from_token(authorization: str):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format"
        )

    token = authorization.replace("Bearer ", "", 1)

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: user_id not found"
            )

        return user_id

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


def format_match(match):
    base_price = match["base_price"]

    if isinstance(base_price, Decimal):
        base_price = float(base_price)

    return {
        "id": match["id"],
        "home_team": match["home_team"],
        "away_team": match["away_team"],
        "date": match["match_time"].strftime("%Y-%m-%d"),
        "time": match["match_time"].strftime("%H:%M"),
        "stadium_name": match["stadium_name"],
        "base_price": base_price,
        "status": match["status"]
    }


def format_user_seat(row):
    return {
        "ticket_id": row["ticket_id"],
        "user_id": row["user_id"],
        "user_name": row["user_name"],
        "ticket_status": row["ticket_status"],

        "match_id": row["match_id_in_matches"],
        "seat_id": row["seat_id_in_seats"],
        "seat_code": row["seat_code"],

        "stand": row["stand"],
        "section": row["section"],
        "row": row["row"],
        "seat": row["seat"],
        "seat_status": row["seat_status"],
        "poi_id": row["poi_id"],
        "lon": row["lon"],
        "lat": row["lat"],

        "match": {
            "home_team": row["home_team"],
            "away_team": row["away_team"],
            "stadium": row["stadium"]
        }
    }


@router.get("/matches")
def get_matches():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        cursor.execute("""
            SELECT
                id,
                home_team,
                away_team,
                match_time,
                stadium AS stadium_name,
                75 AS base_price,
                status
            FROM matches;
        """)

        matches = cursor.fetchall()

        return [
            format_match(match)
            for match in matches
        ]

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@router.get("/my-seat")
def get_my_seat(authorization: str = Header(None)):
    connection = None
    cursor = None

    try:
        user_id = get_user_id_from_token(authorization)

        connection = get_db_connection()
        cursor = connection.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        cursor.execute("""
            SELECT 
                t.id AS ticket_id,
                t.user_id,
                t.user_name,
                t.status AS ticket_status,
                t.seat_id AS ticket_seat_id,
                t.match_id AS ticket_match_id,

                s.id AS seat_id_in_seats,
                s.seat_id AS seat_code,
                s.stand,
                s.section,
                s.row,
                s.seat,
                s.status AS seat_status,
                s.poi_id,
                s.lon,
                s.lat,

                m.id AS match_id_in_matches,
                m.home_team,
                m.away_team,
                m.stadium
            FROM public.tickets t
            LEFT JOIN public.seats s
                ON t.seat_id = s.id
            LEFT JOIN public.matches m
                ON t.match_id = m.id
            WHERE t.user_id = %s
              AND LOWER(TRIM(t.status)) = 'active'
            ORDER BY t.id DESC
            LIMIT 1;
        """, (user_id,))

        row = cursor.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="No active ticket found for this user"
            )

        if row["seat_id_in_seats"] is None:
            raise HTTPException(
                status_code=404,
                detail="Ticket found, but linked seat was not found"
            )

        if row["match_id_in_matches"] is None:
            raise HTTPException(
                status_code=404,
                detail="Ticket found, but linked match was not found"
            )

        return format_user_seat(row)

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()