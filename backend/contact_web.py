"""
Contact Us - web backend.
Sends contact form submissions via Gmail SMTP to shathesisgroup@gmail.com.
Requires: CONTACT_EMAIL (Gmail address) and GMAIL_APP_PASSWORD in .env
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter()

# Recipient email (where contact messages go)
CONTACT_RECIPIENT = os.getenv("CONTACT_EMAIL", "shathesisgroup@gmail.com")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")


class ContactPayload(BaseModel):
    name: str
    email: EmailStr
    contact_number: str = ""
    subject: str
    message: str


def _send_email_via_gmail(payload: ContactPayload) -> None:
    """Send contact form email using Gmail SMTP."""
    if not GMAIL_APP_PASSWORD:
        raise ValueError("GMAIL_APP_PASSWORD is not set in .env")

    msg = MIMEMultipart()
    msg["From"] = CONTACT_RECIPIENT
    msg["To"] = CONTACT_RECIPIENT
    msg["Reply-To"] = payload.email
    msg["Subject"] = f"[DaingGrader Contact] {payload.subject}"

    body = f"""New contact form submission from DaingGrader:

Name: {payload.name}
Email: {payload.email}
Contact Number: {payload.contact_number or "(not provided)"}

Subject: {payload.subject}

Message:
{payload.message}
"""
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(CONTACT_RECIPIENT, GMAIL_APP_PASSWORD)
        server.sendmail(CONTACT_RECIPIENT, CONTACT_RECIPIENT, msg.as_string())


@router.post("/contact")
def send_contact_message(payload: ContactPayload):
    """Receive contact form data and send email to CONTACT_EMAIL."""
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not payload.subject.strip():
        raise HTTPException(status_code=400, detail="Subject is required")
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    try:
        _send_email_via_gmail(payload)
        return {"status": "success", "message": "Your message was sent successfully."}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(
            status_code=500,
            detail="Email configuration error. Check GMAIL_APP_PASSWORD in .env",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
