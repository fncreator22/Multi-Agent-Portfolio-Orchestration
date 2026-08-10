import html
import os
from typing import Dict, Any
import email_service
from database import generate_fortnightly_summary, store_digest


def format_digest_html(summary_data: Dict[str, Any]) -> str:
    digest_code = html.escape(str(summary_data.get("digest_code", "N/A")))
    period_start = html.escape(str(summary_data.get("period_start", "N/A")))
    period_end = html.escape(str(summary_data.get("period_end", "N/A")))
    total_leads = summary_data.get("total_leads", 0)
    verified_leads = summary_data.get("verified_leads_count", 0)
    bookings_count = summary_data.get("bookings_count", 0)
    conv_turns = summary_data.get("conversation_turns_count", 0)
    unique_sessions = summary_data.get("unique_sessions_count", 0)
    top_themes = summary_data.get("top_query_themes", [])

    themes_html = ""
    if top_themes:
        for t in top_themes:
            if isinstance(t, dict):
                theme_name = html.escape(str(t.get("theme", "")))
                count = t.get("count", 0)
                themes_html += f"<li><strong>{theme_name}</strong> ({count} queries)</li>"
            else:
                themes_html += f"<li>{html.escape(str(t))}</li>"
    else:
        themes_html = "<li>No recurring query themes recorded in this period.</li>"

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
    <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
      📊 Fortnightly Performance Digest
    </h2>
    <p><strong>Digest Code:</strong> <span style="font-family: monospace; color: #2563eb;">{digest_code}</span></p>
    <p><strong>Reporting Period:</strong> {period_start} &rarr; {period_end}</p>

    <div style="margin: 20px 0; background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">Key Metrics Overview</h3>
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0;"><strong>Total Contact Leads:</strong></td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2563eb;">{total_leads}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0;"><strong>OTP Verified Leads:</strong></td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #16a34a;">{verified_leads}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0;"><strong>Calendar Bookings:</strong></td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #9333ea;">{bookings_count}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0;"><strong>Conversation Turns Logged:</strong></td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">{conv_turns}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Unique Chat Sessions:</strong></td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">{unique_sessions}</td>
        </tr>
      </table>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="color: #0f172a; font-size: 16px; margin-bottom: 10px;">Top Recurring Query Themes</h3>
      <ul style="padding-left: 20px; color: #334155;">
        {themes_html}
      </ul>
    </div>
  </div>
</body>
</html>"""


def format_digest_text(summary_data: Dict[str, Any]) -> str:
    digest_code = summary_data.get("digest_code", "N/A")
    period_start = summary_data.get("period_start", "N/A")
    period_end = summary_data.get("period_end", "N/A")
    total_leads = summary_data.get("total_leads", 0)
    verified_leads = summary_data.get("verified_leads_count", 0)
    bookings_count = summary_data.get("bookings_count", 0)
    conv_turns = summary_data.get("conversation_turns_count", 0)
    unique_sessions = summary_data.get("unique_sessions_count", 0)
    top_themes = summary_data.get("top_query_themes", [])

    themes_text = ""
    if top_themes:
        for t in top_themes:
            if isinstance(t, dict):
                themes_text += f" - {t.get('theme')}: {t.get('count')} queries\n"
            else:
                themes_text += f" - {t}\n"
    else:
        themes_text = " - None recorded\n"

    return f"""Fortnightly Performance Digest [{digest_code}]
Period: {period_start} to {period_end}

Metrics:
- Total Leads: {total_leads}
- Verified Leads: {verified_leads}
- Bookings: {bookings_count}
- Conversation Turns: {conv_turns}
- Unique Sessions: {unique_sessions}

Top Query Themes:
{themes_text}
"""


def run_fortnightly_digest(days: int = 14) -> dict:
    """
    Computes summary metrics for the past `days`, formats an HTML digest email,
    stores the digest record in the DB, and dispatches the email to NOTIFICATION_EMAIL.
    """
    summary_data = generate_fortnightly_summary(days=days)

    digest_record = store_digest({
        "digest_code": summary_data["digest_code"],
        "period_start": summary_data["period_start"],
        "period_end": summary_data["period_end"],
        "summary": summary_data
    })

    html_body = format_digest_html(summary_data)
    text_body = format_digest_text(summary_data)

    notification_email = os.getenv("NOTIFICATION_EMAIL", "owner@portfolio.internal").strip()
    subject = f"Fortnightly Performance Digest [{summary_data['digest_code']}]"

    email_result = email_service._send_email(
        to_addresses=[notification_email],
        subject=subject,
        html_body=html_body,
        text_body=text_body
    )

    digest_record["email_result"] = email_result
    return digest_record
