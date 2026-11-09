from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import AlertSubscription
from schemas import SubscriptionCreate, SubscriptionResponse

router = APIRouter(prefix="/api/subscriptions", tags=["Alert Subscriptions"])

@router.post("/subscribe", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db)
):
    """
    Subscribes a citizen, caregiver, or clinic to localized outbreak early warnings.
    Supports demographic targeting (e.g. Seniors 55+ or Infants 0-4).
    """
    # Check existing subscription for same email and region
    existing = db.query(AlertSubscription).filter(
        AlertSubscription.email == payload.email,
        AlertSubscription.region == payload.region
    ).first()
    
    if existing:
        # Re-activate and update demographic preferences
        existing.is_active = True
        existing.demographic_target = payload.demographic_target or "ALL"
        existing.phone = payload.phone or existing.phone
        existing.min_risk_threshold = payload.min_risk_threshold or 0.70
        db.commit()
        db.refresh(existing)
        return existing
        
    new_sub = AlertSubscription(
        email=payload.email,
        phone=payload.phone,
        region=payload.region,
        disease_type=payload.disease_type or "Dengue/Malaria",
        demographic_target=payload.demographic_target or "ALL",
        min_risk_threshold=payload.min_risk_threshold or 0.70,
        is_active=True
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.post("/unsubscribe")
def unsubscribe_alert(
    email: str,
    region: str = "Global",
    db: Session = Depends(get_db)
):
    """
    Unsubscribes an email address from alerts.
    """
    sub = db.query(AlertSubscription).filter(
        AlertSubscription.email == email
    )
    if region != "Global":
        sub = sub.filter(AlertSubscription.region == region)
        
    records = sub.all()
    if not records:
        raise HTTPException(status_code=404, detail="No active subscriptions found for this email.")
        
    for r in records:
        r.is_active = False
    db.commit()
    
    return {"status": "success", "message": f"Successfully unsubscribed {email} from alerts."}
