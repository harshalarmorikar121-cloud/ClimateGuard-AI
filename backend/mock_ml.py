import random
from datetime import datetime, timedelta

def generate_forecast(location: str, days: int = 30) -> list:
    """
    Simulates disease case forecasting for the next N days.
    Returns a list of dictionaries with date, historical cases, and predicted cases.
    """
    data = []
    base_date = datetime.now() - timedelta(days=30)
    
    # Generate 30 days of historical data
    for i in range(30):
        current_date = base_date + timedelta(days=i)
        cases = int(max(0, 50 + 20 * random.sin(i / 5.0) + random.uniform(-10, 10)))
        data.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "cases": cases,
            "type": "historical"
        })
    
    # Generate N days of forecast data
    last_cases = data[-1]["cases"]
    for i in range(days):
        current_date = datetime.now() + timedelta(days=i)
        # Add a trend and seasonality to make it look like Prophet/LSTM
        trend = (i / 10.0) * (1 if random.random() > 0.3 else -1)
        cases = int(max(0, last_cases + 15 * random.sin((30 + i) / 5.0) + trend * 10 + random.uniform(-5, 5)))
        
        # Add confidence intervals
        upper = cases + int(cases * 0.2)
        lower = max(0, cases - int(cases * 0.2))
        
        data.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "predicted_cases": cases,
            "upper_bound": upper,
            "lower_bound": lower,
            "type": "forecast"
        })
        
    return data

def generate_risk_map() -> list:
    """
    Simulates high-risk zones for the interactive map.
    Returns a list of coordinates and risk levels.
    """
    # Sample locations (e.g. around Delhi, Mumbai, Manila, etc., let's use some generic clustered points or specific ones)
    # Using generic coordinates near the equator for malaria/dengue
    base_coords = [
        {"lat": 28.6139, "lng": 77.2090, "city": "Delhi, India"},
        {"lat": 19.0760, "lng": 72.8777, "city": "Mumbai, India"},
        {"lat": 14.5995, "lng": 120.9842, "city": "Manila, Philippines"},
        {"lat": -23.5505, "lng": -46.6333, "city": "São Paulo, Brazil"},
        {"lat": 6.5244, "lng": 3.3792, "city": "Lagos, Nigeria"},
    ]
    
    risk_zones = []
    for loc in base_coords:
        # Generate some scattered points around the base location to form a heatmap
        for _ in range(5):
            risk_zones.append({
                "lat": loc["lat"] + random.uniform(-0.5, 0.5),
                "lng": loc["lng"] + random.uniform(-0.5, 0.5),
                "risk_score": round(random.uniform(0.6, 1.0), 2),
                "city": loc["city"]
            })
            
    return risk_zones

def generate_shap_values(location: str) -> list:
    """
    Simulates SHAP feature importance to explain the model's predictions.
    """
    # Climate and environmental features
    features = [
        {"feature": "Cumulative Rainfall (30d)", "importance": round(random.uniform(0.2, 0.4), 2), "impact": "Positive"},
        {"feature": "Mean Temperature", "importance": round(random.uniform(0.15, 0.3), 2), "impact": "Positive"},
        {"feature": "Relative Humidity", "importance": round(random.uniform(0.1, 0.25), 2), "impact": "Positive"},
        {"feature": "Vegetation Index (NDVI)", "importance": round(random.uniform(0.05, 0.15), 2), "impact": "Positive"},
        {"feature": "Distance to Water Body", "importance": round(random.uniform(0.05, 0.15), 2), "impact": "Negative"},
        {"feature": "Wind Speed", "importance": round(random.uniform(0.01, 0.05), 2), "impact": "Negative"}
    ]
    
    # Sort by importance
    features.sort(key=lambda x: x["importance"], reverse=True)
    return features

# Helper method to add sin for realistic data generation without importing math inside the function directly
import math
random.sin = math.sin
