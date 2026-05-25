from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import random
import smtplib
import os
from email.mime.text import MIMEText

from database import get_db_connection

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

verification_storage = {}


class SendVerificationRequest(BaseModel):
    email: EmailStr


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


def send_email(to_email: str, code: str):
    host = os.getenv("MAILTRAP_HOST")
    port = int(os.getenv("MAILTRAP_PORT", 2525))
    username = os.getenv("MAILTRAP_USERNAME")
    password = os.getenv("MAILTRAP_PASSWORD")
    mail_from = os.getenv("MAIL_FROM", "no-reply@khuta.com")

    if not host or not username or not password:
        raise HTTPException(
            status_code=500,
            detail="Mailtrap settings are missing in .env"
        )

    message = MIMEText(
        f"Your Khuta verification code is: {code}",
        "plain",
        "utf-8"
    )

    message["Subject"] = "Khuta Email Verification"
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


@router.post("/send-verification")
def send_verification(data: SendVerificationRequest):
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

        verification_code = str(
            random.randint(100000, 999999)
        )

        verification_storage[data.email] = verification_code

        send_email(data.email, verification_code)

        return {
            "success": True,
            "message": "Verification code sent successfully"
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


@router.post("/verify-email")
def verify_email(data: VerifyEmailRequest):
    connection = None
    cursor = None

    try:
        saved_code = verification_storage.get(data.email)

        if not saved_code:
            raise HTTPException(
                status_code=404,
                detail="Verification code not found"
            )

        if saved_code != data.code:
            raise HTTPException(
                status_code=400,
                detail="Invalid verification code"
            )

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE users
            SET is_verified = TRUE
            WHERE email = %s;
            """,
            (data.email,)
        )

        connection.commit()

        del verification_storage[data.email]

        return {
            "success": True,
            "message": "Email verified successfully"
        }

    except HTTPException:
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