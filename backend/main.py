from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from mock_ml import generate_forecast, generate_risk_map, generate_shap_values
import uvicorn

app = FastAPI(
    title="AI-Empowered Disease Forecasting API",
    description="Early warning system for dengue and malaria outbreaks based on climate data.",
    version="1.0.0"
)

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Disease Forecasting API is running"}

@app.get("/api/forecast/{location}")
def get_forecast(location: str, days: int = 30):
    """
    Returns time-series forecast for disease cases (simulating LSTM/Prophet).
    """
    try:
        data = generate_forecast(location, days)
        return {"location": location, "forecast": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/risk-map")
def get_risk_map():
    """
    Returns geo-coordinates and risk scores for the interactive map.
    """
    try:
        data = generate_risk_map()
        return {"risk_zones": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/explain/{location}")
def get_explainability(location: str):
    """
    Returns SHAP feature importance values (simulated) explaining WHY an outbreak is predicted.
    """
    try:
        data = generate_shap_values(location)
        return {"location": location, "shap_values": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/alerts/subscribe")
def subscribe_alert(payload: Dict[str, Any]):
    """
    Subscribe a health worker or agency to SMS/Email alerts for a specific region.
    """
    email = payload.get("email")
    region = payload.get("region")
    if not email or not region:
        raise HTTPException(status_code=400, detail="Email and region are required")
    # In a real app, save to DB
    return {"status": "success", "message": f"Successfully subscribed {email} for alerts in {region}."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
