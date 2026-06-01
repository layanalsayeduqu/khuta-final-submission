import os
import uuid
from datetime import datetime
from typing import Optional

import psycopg2.extras
from fastapi import APIRouter, Header, HTTPException
from jose import JWTError, jwt
from pydantic import BaseModel

from database import get_db_connection

router = APIRouter(
    prefix="/api/payment",
    tags=["Payment"]
)

SECRET_KEY = os.getenv("SECRET_KEY", "secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


class PurchaseRequest(BaseModel):
    match_id: int
    seat_id: int = 0
    seat_label: str
    amount: float
    payment_method: str = "card"
    card_last4: Optional[str] = None


def get_current_user(authorization: str):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )

    token = authorization.replace("Bearer ", "", 1)

    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


def get_user_id(payload):
    user_id = payload.get("user_id") or payload.get("id") or payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User ID not found in token"
        )

    return int(user_id)


def get_user_name(payload):
    user_id = payload.get("user_id") or payload.get("id") or payload.get("sub")

    if not user_id:
        return "Guest"

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        cursor.execute(
            "SELECT name FROM users WHERE id = %s;",
            (user_id,)
        )

        user = cursor.fetchone()

        return user["name"] if user else "Guest"

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


def generate_transaction_code(seat_id: int) -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"TXN-{timestamp}-{seat_id:05d}"


def generate_qr_token() -> str:
    return uuid.uuid4().hex.upper()


def generate_ticket_code(match_id: int, seat_label: str) -> str:
    timestamp = datetime.now().strftime("%H%M%S")
    return f"KHT-{match_id}-{seat_label}-{timestamp}"


def reserve_seat(cursor, seat_label: str):
    cursor.execute("""
        UPDATE seats
        SET status = 'reserved'
        WHERE seat_id = %s
          AND status = 'available'
        RETURNING id, seat_id;
    """, (seat_label,))

    seat = cursor.fetchone()

    if not seat:
        raise HTTPException(
            status_code=400,
            detail="Seat not available or already reserved"
        )

    return seat


def create_payment(cursor, seat_id: int, data: PurchaseRequest, transaction_code: str):
    cursor.execute("""
        INSERT INTO payment (
            booking_id,
            amount,
            payment_method,
            card_last4,
            status,
            transaction_code
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id;
    """, (
        seat_id,
        data.amount,
        data.payment_method,
        data.card_last4,
        "success",
        transaction_code
    ))

    return cursor.fetchone()["id"]


def get_match_info(cursor, match_id: int):
    cursor.execute("""
        SELECT stadium AS stadium_name, match_time
        FROM matches
        WHERE id = %s;
    """, (match_id,))

    return cursor.fetchone()


def create_ticket(
    cursor,
    data: PurchaseRequest,
    payment_id: int,
    seat_id: int,
    user_id: int,
    user_name: str,
    qr_token: str,
    match_info
):
    stadium = match_info["stadium_name"] if match_info else ""
    match_datetime = match_info["match_time"] if match_info else datetime.now()

    cursor.execute("""
        INSERT INTO tickets (
            qr_token,
            payment_id,
            match_id,
            seat_id,
            seat_number,
            user_id,
            user_name,
            price,
            status,
            stadium_name,
            match_date,
            match_time
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id;
    """, (
        qr_token,
        payment_id,
        data.match_id,
        seat_id,
        data.seat_label,
        user_id,
        user_name,
        data.amount,
        "active",
        stadium,
        match_datetime.date(),
        match_datetime.time()
    ))

    return cursor.fetchone()["id"]


@router.post("/purchase")
def purchase_ticket(
    data: PurchaseRequest,
    authorization: str = Header(None)
):
    connection = None
    cursor = None

    try:
        payload = get_current_user(authorization)
        user_id = get_user_id(payload)
        user_name = get_user_name(payload)

        connection = get_db_connection()
        cursor = connection.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        seat = reserve_seat(cursor, data.seat_label)
        real_seat_id = seat["id"]

        transaction_code = generate_transaction_code(real_seat_id)
        payment_id = create_payment(
            cursor,
            real_seat_id,
            data,
            transaction_code
        )

        match_info = get_match_info(cursor, data.match_id)
        qr_token = generate_qr_token()

        ticket_id = create_ticket(
            cursor,
            data,
            payment_id,
            real_seat_id,
            user_id,
            user_name,
            qr_token,
            match_info
        )

        connection.commit()

        return {
            "message": "Purchase successful",
            "ticket_code": generate_ticket_code(data.match_id, data.seat_label),
            "transaction_code": transaction_code,
            "payment_id": payment_id,
            "status": "success",
            "qr_token": qr_token,
            "ticket_id": ticket_id
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as error:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()