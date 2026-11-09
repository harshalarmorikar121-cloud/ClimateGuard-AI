import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
from sqlalchemy.orm import Session
from models import AlertDispatchLog, AlertSubscription
from config import settings

async def dispatch_broadcast_alert(
    region: str,
    subject: str,
    message: str,
    risk_score: float,
    demographic_target: str,
    db: Session
) -> int:
    """
    Dispatches alerts to matching active subscribers in the region and logs dispatch events.
    """
    # 1. Fetch matching subscribers
    query = db.query(AlertSubscription).filter(AlertSubscription.is_active == True)
    if region.lower() != "global":
        query = query.filter(
            (AlertSubscription.region.ilike(f"%{region}%")) | 
            (AlertSubscription.region == "Global")
        )
    if demographic_target != "ALL":
        query = query.filter(
            (AlertSubscription.demographic_target == demographic_target) |
            (AlertSubscription.demographic_target == "ALL")
        )
        
    subscribers = query.all()
    sent_count = 0
    
    for sub in subscribers:
        status = "SENT"
        # Try SMTP if configured
        if settings.SMTP_HOST and settings.SMTP_USER:
            try:
                msg = MIMEMultipart()
                msg['From'] = settings.EMAIL_FROM
                msg['To'] = sub.email
                msg['Subject'] = f"[ClimateGuard Alert] {subject} ({region})"
                msg.attach(MIMEText(message, 'plain'))
                
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                    server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)
            except Exception as e:
                print(f"[Notifier] SMTP dispatch error to {sub.email}: {e}")
                status = "FAILED"
        
        # Log dispatch in database
        log_entry = AlertDispatchLog(
            channel="EMAIL",
            recipient=sub.email,
            region=region,
            risk_score=risk_score,
            subject=subject,
            message_body=message,
            status=status
        )
        db.add(log_entry)
        if status == "SENT":
            sent_count += 1
            
    db.commit()
    return sent_count
