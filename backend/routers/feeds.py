from fastapi import APIRouter
from typing import List, Dict, Any
from services.external_feeds import fetch_who_outbreak_news, fetch_reliefweb_reports

router = APIRouter(prefix="/api/feeds", tags=["Global Health Intelligence"])

@router.get("/who-alerts")
async def get_who_alerts():
    """
    Returns live parsed WHO Disease Outbreak News (DON) RSS bulletins.
    """
    alerts = await fetch_who_outbreak_news()
    return {"status": "success", "count": len(alerts), "alerts": alerts}

@router.get("/reliefweb-reports")
async def get_reliefweb_reports():
    """
    Returns live humanitarian health emergency reports from ReliefWeb API.
    """
    reports = await fetch_reliefweb_reports()
    return {"status": "success", "count": len(reports), "reports": reports}
