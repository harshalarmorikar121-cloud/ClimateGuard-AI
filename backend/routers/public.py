import asyncio
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
from database import get_db
from schemas import CustomCityEvaluationRequest, AIDiseasePredictionRequest
from services.climate import fetch_live_weather
from services.forecasting import calculate_vector_climate_suitability, generate_forecast_trajectory
from services.ai_disease_model import ai_engine

router = APIRouter(prefix="/api/public", tags=["Public Surveillance"])

MONITORED_CITIES = [
    {"name": "Delhi", "country": "India", "lat": 28.6139, "lng": 77.2090, "disease": "Dengue"},
    {"name": "Mumbai", "country": "India", "lat": 19.0760, "lng": 72.8777, "disease": "Dengue"},
    {"name": "Manila", "country": "Philippines", "lat": 14.5995, "lng": 120.9842, "disease": "Dengue"},
    {"name": "Dhaka", "country": "Bangladesh", "lat": 23.8103, "lng": 90.4125, "disease": "Dengue"},
    {"name": "Lagos", "country": "Nigeria", "lat": 6.5244, "lng": 3.3792, "disease": "Malaria"},
    {"name": "São Paulo", "country": "Brazil", "lat": -23.5505, "lng": -46.6333, "disease": "Dengue"},
    {"name": "Bangkok", "country": "Thailand", "lat": 13.7563, "lng": 100.5018, "disease": "Dengue"},
    {"name": "Kinshasa", "country": "DR Congo", "lat": -4.4419, "lng": 15.2663, "disease": "Malaria"},
    {"name": "Chennai", "country": "India", "lat": 13.0827, "lng": 80.2707, "disease": "Dengue/Malaria"},
    {"name": "Jakarta", "country": "Indonesia", "lat": -6.2088, "lng": 106.8456, "disease": "Dengue"},
]

# In-memory cache
_cities_cache = None
_cities_cache_timestamp = 0
CACHE_TTL = 300  # 5 minutes

def get_risk_level_str(score: float) -> str:
    if score >= 0.90: return "CRITICAL"
    if score >= 0.75: return "HIGH"
    if score >= 0.55: return "MEDIUM"
    return "LOW"

async def _process_city(city: Dict[str, Any]) -> Dict[str, Any]:
    weather = await fetch_live_weather(city["lat"], city["lng"])
    
    temp = weather.get("temperature", 28.5) if weather else 28.5
    humidity = weather.get("humidity", 75.0) if weather else 75.0
    precip_7d = weather.get("recent_rain_7d", 25.0) if weather else 25.0
    wind = weather.get("wind_speed", 8.0) if weather else 8.0
    
    risk_score, shap_items = calculate_vector_climate_suitability(
        temp=temp,
        humidity=humidity,
        precip_7d=precip_7d,
        wind_speed=wind,
        disease=city["disease"]
    )
    
    level = get_risk_level_str(risk_score)
    forecast_cases = int(risk_score * 1800)
    
    return {
        "city": city["name"],
        "country": city["country"],
        "latitude": city["lat"],
        "longitude": city["lng"],
        "disease": city["disease"],
        "risk_score": risk_score,
        "risk_level": level,
        "forecast_cases": forecast_cases,
        "weather": {
            "temperature": temp,
            "humidity": humidity,
            "precipitation": weather.get("precipitation", 0.0) if weather else 0.0,
            "wind_speed": wind,
            "weather_code": weather.get("weather_code", 0) if weather else 0
        } if weather else None,
        "shap_attributions": shap_items,
        "last_updated": datetime.now().isoformat()
    }

@router.get("/risk-summary")
async def get_all_cities_risk(db: Session = Depends(get_db)):
    """
    Evaluates real-time climate telemetry concurrently with background caching.
    """
    global _cities_cache, _cities_cache_timestamp
    now = time.time()
    
    if _cities_cache and (now - _cities_cache_timestamp) < CACHE_TTL:
        return _cities_cache

    tasks = [_process_city(city) for city in MONITORED_CITIES]
    results = await asyncio.gather(*tasks, return_exceptions=False)
    
    _cities_cache = results
    _cities_cache_timestamp = now
    return results

@router.post("/evaluate-custom-location")
async def evaluate_custom_location(
    req: CustomCityEvaluationRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates real-time vector disease risk for any global coordinates on demand.
    """
    weather = await fetch_live_weather(req.latitude, req.longitude)
    temp = weather.get("temperature", 25.0) if weather else 25.0
    humidity = weather.get("humidity", 60.0) if weather else 60.0
    precip_7d = weather.get("recent_rain_7d", 10.0) if weather else 10.0
    wind = weather.get("wind_speed", 8.0) if weather else 8.0
    
    risk_score, shap_items = calculate_vector_climate_suitability(
        temp=temp,
        humidity=humidity,
        precip_7d=precip_7d,
        wind_speed=wind,
        disease=req.disease or "Dengue"
    )
    
    level = get_risk_level_str(risk_score)
    trajectory = generate_forecast_trajectory(risk_score, temp, humidity, days=30)
    
    return {
        "city": req.city_name or f"Custom Lat: {req.latitude}, Lng: {req.longitude}",
        "latitude": req.latitude,
        "longitude": req.longitude,
        "disease": req.disease or "Dengue",
        "risk_score": risk_score,
        "risk_level": level,
        "weather": weather,
        "shap_attributions": shap_items,
        "forecast_trajectory": trajectory,
        "evaluated_at": datetime.now().isoformat()
    }

@router.post("/ai-disease-prediction")
async def predict_disease_ai(req: AIDiseasePredictionRequest):
    """
    Dedicated AI Machine Learning Model:
    Consumes Open-Meteo live satellite weather for any coordinates (or custom inputs)
    and predicts Dengue and Malaria outbreak probabilities, incubation days (EIP),
    and targeted alerts for Seniors 55+ and Infants 0-4.
    """
    temp = req.temperature
    humidity = req.humidity
    rain_7d = req.rainfall_7d
    wind = req.wind_speed
    loc_name = req.location_name or "Custom Location"

    # If coordinates provided and weather params missing, fetch live from Open-Meteo
    if (req.latitude is not None and req.longitude is not None) and (temp is None or humidity is None):
        weather = await fetch_live_weather(req.latitude, req.longitude)
        if weather:
            temp = weather.get("temperature", 28.0) if temp is None else temp
            humidity = weather.get("humidity", 70.0) if humidity is None else humidity
            rain_7d = weather.get("recent_rain_7d", 15.0) if rain_7d is None else rain_7d
            wind = weather.get("wind_speed", 8.0) if wind is None else wind
            if not req.location_name or req.location_name == "Location":
                loc_name = f"Coordinates ({req.latitude:.4f}, {req.longitude:.4f})"

    temp = 28.0 if temp is None else temp
    humidity = 70.0 if humidity is None else humidity
    rain_7d = 15.0 if rain_7d is None else rain_7d
    wind = 8.0 if wind is None else wind

    prediction = ai_engine.predict(
        temperature=float(temp),
        humidity=float(humidity),
        rainfall_7d=float(rain_7d),
        wind_speed=float(wind),
        location_name=loc_name
    )

    return prediction

@router.get("/forecast-trajectory/{city_name}")
async def get_city_forecast_trajectory(city_name: str):
    """
    Returns 30-day forward trajectory with confidence intervals for a specific city.
    """
    target = next((c for c in MONITORED_CITIES if c["name"].lower() == city_name.lower()), None)
    if not target:
        target = {"name": city_name, "lat": 20.0, "lng": 77.0, "disease": "Dengue"}
        
    weather = await fetch_live_weather(target["lat"], target["lng"])
    temp = weather.get("temperature", 28.0) if weather else 28.0
    humidity = weather.get("humidity", 70.0) if weather else 70.0
    precip_7d = weather.get("recent_rain_7d", 20.0) if weather else 20.0
    wind = weather.get("wind_speed", 8.0) if weather else 8.0
    
    risk_score, _ = calculate_vector_climate_suitability(temp, humidity, precip_7d, wind, target["disease"])
    trajectory = generate_forecast_trajectory(risk_score, temp, humidity, days=30)
    
    return {
        "city": target["name"],
        "base_risk": risk_score,
        "trajectory": trajectory
    }
