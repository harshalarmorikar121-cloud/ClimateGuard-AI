from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from database import get_db
from services.osm_service import fetch_nearby_hospitals

router = APIRouter(prefix="/api/hospitals", tags=["Hospital & Clinic Network"])

@router.get("/nearby")
async def get_nearby_hospitals(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius: int = Query(8000, ge=1000, le=25000),
    db: Session = Depends(get_db)
):
    """
    Fetches real hospitals, emergency wards, and pediatric clinics from OpenStreetMap Overpass API
    with database-level caching.
    """
    hospitals = await fetch_nearby_hospitals(latitude=lat, longitude=lng, radius_meters=radius, db=db)
    return {
        "latitude": lat,
        "longitude": lng,
        "radius_meters": radius,
        "count": len(hospitals),
        "hospitals": hospitals
    }
