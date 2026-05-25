from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from jose import jwt, JWTError
import os

from database import get_db_connection

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")


class UpdateProfileRequest(BaseModel):

    name: str
    gender: str
    age: int
    phone: str
    favorite_club: str


def get_current_user(token: str):

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


@router.get("/me")
def get_my_profile(authorization: str = Header(None)):

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )

    token = authorization.replace("Bearer ", "")

    payload = get_current_user(token)

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT * FROM users WHERE id = %s;",
            (payload["user_id"],)
        )

        user = cursor.fetchone()

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return {
            "success": True,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "gender": user["gender"],
                "age": user["age"],
                "phone": user["phone"],
                "favorite_club": user["favorite_club"]
            }
        }

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


@router.put("/update")
def update_profile(
    data: UpdateProfileRequest,
    authorization: str = Header(None)
):

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )

    token = authorization.replace("Bearer ", "")

    payload = get_current_user(token)

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE users
            SET
                name = %s,
                gender = %s,
                age = %s,
                phone = %s,
                favorite_club = %s
            WHERE id = %s;
        """,
        (
            data.name,
            data.gender,
            data.age,
            data.phone,
            data.favorite_club,
            payload["user_id"]
        ))

        connection.commit()

        return {
            "success": True,
            "message": "Profile updated successfully"
        }

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