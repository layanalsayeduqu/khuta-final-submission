from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import random

from database import get_db_connection

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class ForgotPasswordRequest(BaseModel):

    email: EmailStr


class ResetPasswordRequest(BaseModel):

    email: EmailStr
    otp: str
    new_password: str
    confirm_password: str


# تخزين مؤقت للـ OTP
otp_storage = {}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT * FROM users WHERE email = %s;",
            (data.email,)
        )

        user = cursor.fetchone()

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # إنشاء OTP عشوائي
        otp = str(random.randint(100000, 999999))

        otp_storage[data.email] = otp

        # مؤقتًا نرجعه بالـ Response
        # لاحقًا بنرسله بالإيميل
        return {
            "success": True,
            "message": "OTP generated successfully",
            "otp": otp
        }

    except HTTPException as error:
        raise error

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


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):

    connection = None
    cursor = None

    try:

        if data.new_password != data.confirm_password:

            raise HTTPException(
                status_code=400,
                detail="Passwords do not match"
            )

        saved_otp = otp_storage.get(data.email)

        if not saved_otp:

            raise HTTPException(
                status_code=404,
                detail="OTP not found"
            )

        if saved_otp != data.otp:

            raise HTTPException(
                status_code=400,
                detail="Invalid OTP"
            )

        from utils.security import hash_password

        hashed_password = hash_password(
            data.new_password
        )

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE users
            SET password_hash = %s
            WHERE email = %s;
        """,
        (
            hashed_password,
            data.email
        ))

        connection.commit()

        # حذف الـ OTP بعد الاستخدام
        del otp_storage[data.email]

        return {
            "success": True,
            "message": "Password reset successfully"
        }

    except HTTPException as error:
        raise error

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