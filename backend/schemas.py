from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Authentication Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization: Optional[str] = "Public Health Agency"
    role: Optional[str] = "OFFICER"
    assigned_region: Optional[str] = "Global"

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: str
    full_name: str
    organization: str
    role: str
    assigned_region: str
    created_at: datetime

# --- Alert Subscription Schemas ---
class SubscriptionCreate(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    region: str = Field(..., min_length=2)
    disease_type: Optional[str] = "Dengue/Malaria"
    demographic_target: Optional[str] = "ALL"  # ALL, SENIORS_55_PLUS, INFANTS_0_4
    min_risk_threshold: Optional[float] = 0.70

class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: str
    phone: Optional[str]
    region: str
    disease_type: str
    demographic_target: str
    min_risk_threshold: float
    is_active: bool
    created_at: datetime

# --- Emergency Report Schemas ---
class EmergencyReportCreate(BaseModel):
    reporter_name: str = Field(..., min_length=2)
    contact_phone: str = Field(..., min_length=5)
    contact_email: Optional[EmailStr] = None
    patient_age: int = Field(..., ge=0, le=120)
    demographic_group: str = Field(..., pattern="^(SENIORS_55_PLUS|INFANTS_0_4)$")
    city: str = Field(..., min_length=2)
    address_or_landmark: Optional[str] = None
    symptoms: str = Field(..., min_length=5)
    severity: Optional[str] = "URGENT"

class EmergencyReportUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    severity: Optional[str] = None

class EmergencyReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    reporter_name: str
    contact_phone: str
    contact_email: Optional[str]
    patient_age: int
    demographic_group: str
    city: str
    address_or_landmark: Optional[str]
    symptoms: str
    severity: str
    status: str
    notes: Optional[str]
    created_at: datetime

# --- Broadcast Alert Schema ---
class BroadcastAlertRequest(BaseModel):
    region: str
    subject: str = Field(..., min_length=5)
    message: str = Field(..., min_length=10)
    target_demographic: Optional[str] = "ALL"
    severity: Optional[str] = "HIGH"

# --- Forecast & Climate Schemas ---
class ClimateCurrent(BaseModel):
    temperature: float
    humidity: float
    precipitation: float
    wind_speed: float
    weather_code: Optional[int] = 0

class ShapExplanation(BaseModel):
    feature: str
    value_observed: Optional[str] = ""
    shap_value: float
    interpretation: str
    impact_direction: str

class CityRiskResponse(BaseModel):
    city: str
    country: str
    latitude: float
    longitude: float
    disease: str
    risk_score: float
    risk_level: str
    forecast_cases: int
    weather: Optional[ClimateCurrent] = None
    shap_attributions: List[ShapExplanation] = []
    forecast_trajectory: List[Dict[str, Any]] = []
    last_updated: datetime

class CustomCityEvaluationRequest(BaseModel):
    city_name: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    disease: Optional[str] = "Dengue"


class AIDiseasePredictionRequest(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    location_name: Optional[str] = "Location"
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall_7d: Optional[float] = None
    wind_speed: Optional[float] = None
