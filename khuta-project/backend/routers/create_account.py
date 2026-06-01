from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from database import get_db_connection
from utils.security import hash_password

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=30)
    gender: str
    age: int = Field(..., ge=13, le=100)
    phone: str = Field(..., min_length=10, max_length=15)


@router.post("/register")
def register_user(user: RegisterRequest):
    connection = None
    cursor = None

    try:
        validate_password_length(user.password)

        connection = get_db_connection()
        cursor = connection.cursor()

        if email_exists(cursor, user.email):
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        hashed_password = hash_password(user.password)

        cursor.execute("""
            INSERT INTO users (
                name,
                email,
                password_hash,
                gender,
                age,
                phone
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            user.name,
            user.email,
            hashed_password,
            user.gender,
            user.age,
            user.phone
        ))

        new_user = cursor.fetchone()
        connection.commit()

        return {
            "success": True,
            "message": "Account created successfully",
            "user_id": new_user["id"]
        }

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


def validate_password_length(password: str):
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="كلمة المرور طويلة جدًا"
        )


def email_exists(cursor, email: str):
    cursor.execute(
        "SELECT * FROM users WHERE email = %s;",
        (email,)
    )

    return cursor.fetchone() is not None