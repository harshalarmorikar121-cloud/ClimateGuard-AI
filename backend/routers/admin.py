from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from database import get_db
from models import User, AlertSubscription, EmergencyReport, AlertDispatchLog
from schemas import (
    EmergencyReportResponse, EmergencyReportUpdate,
    SubscriptionResponse, BroadcastAlertRequest
)
from services.auth_service import get_current_user, require_admin
from services.notifier import dispatch_broadcast_alert

router = APIRouter(prefix="/api/admin", tags=["Health Officer Admin Console"])

@router.get("/metrics")
def get_surveillance_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated real-time epidemiological metrics for Health Officers.
    """
    total_subscribers = db.query(AlertSubscription).filter(AlertSubscription.is_active == True).count()
    elderly_subscribers = db.query(AlertSubscription).filter(
        AlertSubscription.is_active == True,
        AlertSubscription.demographic_target == "SENIORS_55_PLUS"
    ).count()
    infant_subscribers = db.query(AlertSubscription).filter(
        AlertSubscription.is_active == True,
        AlertSubscription.demographic_target == "INFANTS_0_4"
    ).count()
    
    pending_reports = db.query(EmergencyReport).filter(EmergencyReport.status == "PENDING").count()
    emergency_reports = db.query(EmergencyReport).filter(EmergencyReport.severity == "EMERGENCY").count()
    total_dispatched = db.query(AlertDispatchLog).count()
    
    return {
        "total_active_subscribers": total_subscribers,
        "elderly_focused_subscribers": elderly_subscribers,
        "infant_focused_subscribers": infant_subscribers,
        "pending_caregiver_reports": pending_reports,
        "critical_emergency_reports": emergency_reports,
        "total_alerts_dispatched": total_dispatched,
        "system_status": "ONLINE - Real-time Ingestion Active"
    }

@router.get("/reports", response_model=List[EmergencyReportResponse])
def list_caregiver_reports(
    status_filter: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists caregiver emergency reports submitted from the field.
    """
    query = db.query(EmergencyReport).order_by(EmergencyReport.created_at.desc())
    if status_filter:
        query = query.filter(EmergencyReport.status == status_filter)
    return query.limit(50).all()

@router.patch("/reports/{report_id}", response_model=EmergencyReportResponse)
def update_report_status(
    report_id: int,
    payload: EmergencyReportUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates status or triage notes of an emergency report.
    """
    report = db.query(EmergencyReport).filter(EmergencyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if payload.status:
        report.status = payload.status
    if payload.notes is not None:
        report.notes = payload.notes
    if payload.severity:
        report.severity = payload.severity
        
    db.commit()
    db.refresh(report)
    return report

@router.post("/broadcast-alert")
async def trigger_broadcast_alert(
    payload: BroadcastAlertRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dispatches an official public health warning advisory to active subscribers in a region.
    """
    risk_score = 0.88 if payload.severity == "CRITICAL" else 0.75
    dispatched_count = await dispatch_broadcast_alert(
        region=payload.region,
        subject=payload.subject,
        message=payload.message,
        risk_score=risk_score,
        demographic_target=payload.target_demographic or "ALL",
        db=db
    )
    
    return {
        "status": "success",
        "message": f"Broadcast advisory dispatched to {dispatched_count} active subscribers in {payload.region}.",
        "dispatched_count": dispatched_count,
        "dispatched_by": current_user.email
    }

@router.get("/dispatch-logs")
def get_dispatch_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns recent alert dispatch logs for audit trails.
    """
    logs = db.query(AlertDispatchLog).order_by(AlertDispatchLog.dispatched_at.desc()).limit(30).all()
    return logs
