import httpx
import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from models import HospitalCache
from datetime import datetime, timedelta

OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter"

async def fetch_nearby_hospitals(
    latitude: float,
    longitude: float,
    radius_meters: int = 8000,
    db: Session = None
) -> List[Dict[str, Any]]:
    """
    Queries OpenStreetMap Overpass API for emergency hospitals, pediatric centers,
    and clinics within a geospatial bounding radius, caching results in DB.
    """
    city_key = f"{round(latitude, 2)}_{round(longitude, 2)}"
    
    # 1. Check DB Cache
    if db:
        cached = db.query(HospitalCache).filter(HospitalCache.city_key == city_key).first()
        if cached:
            # Check if cache is newer than 24 hours
            if (datetime.utcnow() - cached.last_synced_at.replace(tzinfo=None)) < timedelta(hours=24):
                try:
                    return json.loads(cached.raw_osm_json)
                except Exception:
                    pass

    # 2. Overpass Bounding Query
    delta = radius_meters / 111000.0
    bbox = f"{latitude - delta},{longitude - delta},{latitude + delta},{longitude + delta}"
    query = f"""
    [out:json][timeout:12];
    (
      node["amenity"="hospital"]({bbox});
      way["amenity"="hospital"]({bbox});
      node["amenity"="clinic"]({bbox});
      node["healthcare"="paediatric"]({bbox});
    );
    out center 15;
    """
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(OVERPASS_ENDPOINT, data=query)
            if response.status_code == 200:
                data = response.json()
                elements = data.get("elements", [])
                hospitals = []
                
                for el in elements:
                    tags = el.get("tags", {})
                    lat = el.get("lat") or el.get("center", {}).get("lat")
                    lon = el.get("lon") or el.get("center", {}).get("lon")
                    
                    if not lat or not lon:
                        continue
                        
                    name = tags.get("name") or tags.get("name:en") or "Medical Center"
                    is_emergency = tags.get("emergency") in ["yes", "true", "24/7"]
                    is_pediatric = "paediatric" in tags.get("healthcare", "") or "child" in name.lower() or "pediatric" in name.lower()
                    
                    hospitals.append({
                        "id": el.get("id"),
                        "name": name,
                        "lat": lat,
                        "lng": lon,
                        "emergency": is_emergency,
                        "pediatric": is_pediatric,
                        "beds": tags.get("beds"),
                        "phone": tags.get("phone") or tags.get("contact:phone"),
                        "website": tags.get("website")
                    })
                
                # 3. Store in DB Cache
                if db and hospitals:
                    if cached:
                        cached.raw_osm_json = json.dumps(hospitals)
                    else:
                        new_cache = HospitalCache(city_key=city_key, raw_osm_json=json.dumps(hospitals))
                        db.add(new_cache)
                    db.commit()
                    
                return hospitals
    except Exception as e:
        print(f"[OSMService] Overpass query failed: {e}")
        
    return []
