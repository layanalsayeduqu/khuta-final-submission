import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from jose import jwt
from pydantic import BaseModel, EmailStr

from database import get_db_connection
from utils.security import verify_password

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
TOKEN_EXPIRATION_HOURS = 2


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def get_user_by_email(cursor, email: str):
    cursor.execute(
        "SELECT * FROM users WHERE email = %s;",
        (email,)
    )

    return cursor.fetchone()


def get_user_role(user):
    return user.get("role", "user")


def create_access_token(user, role: str):
    payload = {
        "user_id": user["id"],
        "email": user["email"],
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRATION_HOURS)
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def format_login_response(user, role: str, token: str):
    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": role
        }
    }


@router.post("/login")
def login_user(data: LoginRequest):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        user = get_user_by_email(cursor, data.email)

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        valid_password = verify_password(
            data.password,
            user["password_hash"]
        )

        if not valid_password:
            raise HTTPException(
                status_code=401,
                detail="Invalid password"
            )

        user_role = get_user_role(user)
        token = create_access_token(user, user_role)

        return format_login_response(user, user_role, token)

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