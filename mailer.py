"""OTP email delivery via Gmail SMTP.

Reads config from environment variables (see .env):
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, MAIL_DEV_MODE

When MAIL_DEV_MODE=true, the email is printed to the console instead of
being sent — useful for offline development. In production set it to false.
"""
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER or "no-reply@example.com")
DEV_MODE  = os.environ.get("MAIL_DEV_MODE", "true").lower() == "true"


def _send(to, subject, html):
    # Dev mode or missing credentials: print to console
    if DEV_MODE or not SMTP_USER or not SMTP_PASS:
        print(f"\n========== [MAIL-DEV] ==========\n"
              f"To:      {to}\nSubject: {subject}\n{html}\n"
              f"================================\n", flush=True)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = formataddr(("CareerLink", SMTP_FROM))
    msg["To"]      = to
    msg.attach(MIMEText(html, "html"))

    # Port 465 → implicit SSL. Port 587 → STARTTLS. Anything else: plain (no TLS).
    if SMTP_PORT == 465:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=20) as s:
            s.login(SMTP_USER, SMTP_PASS)
            s.send_message(msg)
    elif SMTP_PORT == 587:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as s:
            s.ehlo()
            s.starttls(context=ssl.create_default_context())
            s.ehlo()
            s.login(SMTP_USER, SMTP_PASS)
            s.send_message(msg)
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as s:
            s.login(SMTP_USER, SMTP_PASS)
            s.send_message(msg)


def _otp_html(otp, purpose):
    action = ("finish creating your CareerLink account" if purpose == "register"
              else "reset your CareerLink password")
    return f"""
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;
                padding:30px;border:1px solid #e3ebf5;border-radius:16px;background:#fff">
      <h2 style="color:#0f1f47;margin:0 0 4px">CareerLink</h2>
      <p style="color:#64748b;margin:0 0 22px;font-size:13px">
        Graphic Era (Deemed to be University) — Placement &amp; Internship Portal
      </p>
      <p style="color:#16223f;font-size:15px">Use the code below to {action}.
      It expires in <b>10 minutes</b>.</p>
      <div style="font-size:36px;font-weight:800;letter-spacing:12px;color:#1ba7e0;
                  padding:20px;background:#e8f6fd;border-radius:12px;text-align:center;
                  margin:22px 0;font-family:Consolas,monospace">{otp}</div>
      <p style="color:#94a3b8;font-size:12px;margin:22px 0 0">
        Didn't request this? You can safely ignore this email.
      </p>
    </div>"""


def send_otp(to, otp, purpose):
    _send(to, "CareerLink — your verification code", _otp_html(otp, purpose))