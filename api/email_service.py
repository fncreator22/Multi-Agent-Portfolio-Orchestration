import html
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, List, Optional


def _get_log_filepath() -> str:
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    os.makedirs(log_dir, exist_ok=True)
    return os.path.join(log_dir, "email.log")


def _log_event(message: str) -> None:
    log_file = _get_log_filepath()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {message}\n")


def _send_email(
    to_addresses: List[str],
    subject: str,
    html_body: str,
    text_body: Optional[str] = None
) -> Dict[str, bool]:
    """
    Core helper to send HTML/text email using built-in smtplib.
    If ENABLE_SMTP is false or connection fails, logs to api/logs/email.log
    and returns {"sent": False, "fallback": True}.
    """
    enable_smtp_str = os.getenv("ENABLE_SMTP", "false").strip().lower()
    enable_smtp = enable_smtp_str in ("true", "1", "yes")
    smtp_host = os.getenv("SMTP_HOST", "smtp.example.com").strip()
    smtp_port_raw = os.getenv("SMTP_PORT", "587").strip()
    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        smtp_port = 587
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASS", "").strip()
    from_email = os.getenv("FROM_EMAIL", smtp_user or "noreply@portfolio.internal").strip()

    if not enable_smtp:
        _log_event(f"[FALLBACK] ENABLE_SMTP is false. Email to {to_addresses} (Subject: '{subject}') logged to fallback.")
        return {"sent": False, "fallback": True}

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = ", ".join(to_addresses)

        if text_body:
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_addresses, msg.as_string())

        _log_event(f"[SUCCESS] Email sent to {to_addresses} (Subject: '{subject}') via SMTP.")
        return {"sent": True, "fallback": False}
    except Exception as e:
        _log_event(f"[ERROR] SMTP failure sending email to {to_addresses} (Subject: '{subject}'): {str(e)}")
        return {"sent": False, "fallback": True}


def send_otp_email(to_email: str, otp_code: str) -> Dict[str, bool]:
    """
    Sends HTML email containing 6-digit OTP code to requested address.
    """
    clean_to = to_email.strip()
    clean_otp = html.escape(str(otp_code).strip())
    subject = "Your Admin Security Verification Code (OTP)"
    
    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #1f2937; margin-top: 0;">Admin Passcode Verification</h2>
    <p>Use the following 6-digit OTP code to complete your authentication:</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb;">{clean_otp}</span>
    </div>
    <p style="font-size: 14px; color: #6b7280;">This code is valid for 15 minutes. If you did not request this OTP, please ignore this email.</p>
  </div>
</body>
</html>"""
    
    text_body = f"Your Admin OTP Code is: {otp_code}. Valid for 15 minutes."
    return _send_email([clean_to], subject, html_body, text_body)


def send_lead_notification(lead_data: dict) -> Dict[str, bool]:
    """
    Sends notification email to owner when a new lead comes in.
    Sanitizes user fields (name, message) before interpolating into HTML.
    """
    owner_email = os.getenv("NOTIFICATION_EMAIL", "owner@portfolio.internal").strip()
    
    raw_name = lead_data.get("name", "") if isinstance(lead_data, dict) else ""
    raw_email = lead_data.get("email", "") if isinstance(lead_data, dict) else ""
    raw_message = lead_data.get("message", "") if isinstance(lead_data, dict) else ""
    raw_slug = lead_data.get("project_slug", "") if isinstance(lead_data, dict) else ""
    raw_created_at = lead_data.get("created_at", "") if isinstance(lead_data, dict) else ""
    
    clean_name = html.escape(str(raw_name))
    clean_email = html.escape(str(raw_email))
    clean_message = html.escape(str(raw_message))
    clean_slug = html.escape(str(raw_slug))
    clean_created_at = html.escape(str(raw_created_at))

    subject = f"New Portfolio Lead: {raw_name or 'Anonymous'}"
    
    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #1f2937; margin-top: 0;">New Contact Lead Received</h2>
    <p><strong>Name:</strong> {clean_name}</p>
    <p><strong>Email:</strong> <a href="mailto:{clean_email}">{clean_email}</a></p>
    <p><strong>Project Slug:</strong> {clean_slug or 'N/A'}</p>
    <p><strong>Received At:</strong> {clean_created_at or 'N/A'}</p>
    <div style="margin-top: 15px;">
      <strong>Message:</strong>
      <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; margin-top: 5px; white-space: pre-wrap;">
{clean_message}
      </div>
    </div>
  </div>
</body>
</html>"""

    text_body = f"New Lead Received\nName: {raw_name}\nEmail: {raw_email}\nProject: {raw_slug}\nMessage: {raw_message}"
    return _send_email([owner_email], subject, html_body, text_body)


def send_booking_notification(booking_data: dict) -> Dict[str, bool]:
    """
    Sends booking notification email to owner & client.
    """
    owner_email = os.getenv("NOTIFICATION_EMAIL", "owner@portfolio.internal").strip()
    client_email = (booking_data.get("email", "") if isinstance(booking_data, dict) else "").strip()
    
    recipients = []
    if client_email:
        recipients.append(client_email)
    if owner_email and owner_email not in recipients:
        recipients.append(owner_email)

    if not recipients:
        recipients = ["owner@portfolio.internal"]

    raw_slot = booking_data.get("slot_time", "") if isinstance(booking_data, dict) else ""
    raw_link = booking_data.get("meeting_link", "") if isinstance(booking_data, dict) else ""

    clean_client = html.escape(client_email)
    clean_slot = html.escape(str(raw_slot))
    clean_link = html.escape(str(raw_link))

    subject = f"Consultation Booking Confirmed ({raw_slot})"

    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #1f2937; margin-top: 0;">Consultation Booking Confirmed</h2>
    <p>A new consultation slot has been successfully scheduled.</p>
    <p><strong>Client Email:</strong> {clean_client}</p>
    <p><strong>Scheduled Slot (UTC):</strong> {clean_slot}</p>
    <p><strong>Meeting Video Link:</strong> <a href="{clean_link}" target="_blank">{clean_link}</a></p>
  </div>
</body>
</html>"""

    text_body = f"Booking Confirmation\nClient: {client_email}\nSlot: {raw_slot}\nLink: {raw_link}"
    return _send_email(recipients, subject, html_body, text_body)
