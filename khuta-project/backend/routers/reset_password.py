import os
import random
import smtplib
from email.mime.text import MIMEText

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from database import get_db_connection
from utils.security import hash_password

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

otp_storage = {}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
    confirm_password: str


def get_mail_settings():
    host = os.getenv("MAILTRAP_HOST")
    port = int(os.getenv("MAILTRAP_PORT", 587))
    username = os.getenv("MAILTRAP_USERNAME")
    password = os.getenv("MAILTRAP_PASSWORD")
    mail_from = os.getenv("MAIL_FROM", "no-reply@khuta.com")

    if not host or not username or not password:
        raise HTTPException(
            status_code=500,
            detail="Mail settings are missing in .env"
        )

    return host, port, username, password, mail_from


def send_email(to_email: str, code: str):
    host, port, username, password, mail_from = get_mail_settings()

    message = MIMEText(
        f"Your Khuta password reset code is: {code}",
        "plain",
        "utf-8"
    )

    message["Subject"] = "Khuta Password Reset"
    message["From"] = mail_from
    message["To"] = to_email

    with smtplib.SMTP(host, port) as server:
        server.starttls()
        server.login(username, password)
        server.sendmail(
            mail_from,
            to_email,
            message.as_string()
        )


def generate_otp():
    return str(random.randint(100000, 999999))


def get_user_by_email(cursor, email: str):
    cursor.execute(
        "SELECT * FROM users WHERE email = %s;",
        (email,)
    )

    return cursor.fetchone()


def validate_passwords_match(new_password: str, confirm_password: str):
    if new_password != confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match"
        )


def validate_otp(email: str, otp: str):
    saved_otp = otp_storage.get(email)

    if not saved_otp:
        raise HTTPException(
            status_code=404,
            detail="OTP not found"
        )

    if saved_otp != otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
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

        otp = generate_otp()
        otp_storage[data.email] = otp

        send_email(data.email, otp)

        return {
            "success": True,
            "message": "OTP sent to your email successfully"
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


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    connection = None
    cursor = None

    try:
        validate_passwords_match(
            data.new_password,
            data.confirm_password
        )

        validate_otp(data.email, data.otp)

        hashed_password = hash_password(data.new_password)

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE users
            SET password_hash = %s
            WHERE email = %s;
        """, (
            hashed_password,
            data.email
        ))

        connection.commit()

        del otp_storage[data.email]

        return {
            "success": True,
            "message": "Password reset successfully"
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