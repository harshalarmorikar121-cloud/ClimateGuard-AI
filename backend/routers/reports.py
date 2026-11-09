from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import EmergencyReport
from schemas import EmergencyReportCreate, EmergencyReportResponse

router = APIRouter(prefix="/api/reports", tags=["Caregiver Emergency Reports"])

@router.post("/submit", response_model=EmergencyReportResponse, status_code=status.HTTP_201_CREATED)
def submit_caregiver_report(
    payload: EmergencyReportCreate,
    db: Session = Depends(get_db)
):
    """
    Submits a high-priority warning sign report from a caregiver of an elderly person (55+)
    or infant (0-4) directly to the municipal health surveillance queue.
    """
    report = EmergencyReport(
        reporter_name=payload.reporter_name,
        contact_phone=payload.contact_phone,
        contact_email=payload.contact_email,
        patient_age=payload.patient_age,
        demographic_group=payload.demographic_group,
        city=payload.city,
        address_or_landmark=payload.address_or_landmark,
        symptoms=payload.symptoms,
        severity=payload.severity or "URGENT",
        status="PENDING"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

@router.get("/recent-public-count")
def get_recent_reports_count(city: str = None, db: Session = Depends(get_db)):
    """
    Returns anonymized aggregate count of community-reported cases for early warning verification.
    """
    query = db.query(EmergencyReport)
    if city:
        query = query.filter(EmergencyReport.city.ilike(f"%{city}%"))
    
    total_count = query.count()
    emergency_count = query.filter(EmergencyReport.severity == "EMERGENCY").count()
    
    return {
        "city": city or "Global",
        "total_reports": total_count,
        "critical_reports": emergency_count,
        "status": "Active Surveillance"
    }
