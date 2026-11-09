import httpx
from typing import Optional, Dict, Any

OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"

async def fetch_live_weather(latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
    """
    Fetches real-time current weather and 14-day history/forecast from Open-Meteo API.
    Zero-key, free public access.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "timezone": "auto",
        "forecast_days": 14,
        "past_days": 7
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(OPEN_METEO_BASE_URL, params=params)
            if response.status_code == 200:
                data = response.json()
                current = data.get("current", {})
                daily = data.get("daily", {})
                
                # Compute 7-day cumulative rainfall
                recent_rain = sum(daily.get("precipitation_sum", [])[:7]) if daily.get("precipitation_sum") else 0.0
                
                return {
                    "temperature": current.get("temperature_2m", 25.0),
                    "humidity": current.get("relative_humidity_2m", 65.0),
                    "precipitation": current.get("precipitation", 0.0),
                    "wind_speed": current.get("wind_speed_10m", 8.0),
                    "weather_code": current.get("weather_code", 0),
                    "recent_rain_7d": round(recent_rain, 1),
                    "daily_max_temp": daily.get("temperature_2m_max", []),
                    "daily_rain_sum": daily.get("precipitation_sum", [])
                }
    except Exception as e:
        print(f"[ClimateService] Live weather fetch failed: {e}")
        
    return None
