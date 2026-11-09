from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum
from sqlalchemy.sql import func
import enum
from database import Base

class DemographicGroup(str, enum.Enum):
    ALL = "ALL"
    SENIORS_55_PLUS = "SENIORS_55_PLUS"
    INFANTS_0_4 = "INFANTS_0_4"

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ReportSeverity(str, enum.Enum):
    MILD = "MILD"
    URGENT = "URGENT"
    EMERGENCY = "EMERGENCY"

class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    ESCALATED = "ESCALATED"

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    OFFICER = "OFFICER"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    organization = Column(String(255), default="Public Health Agency")
    role = Column(String(50), default="OFFICER")
    assigned_region = Column(String(255), default="Global")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    region = Column(String(255), nullable=False)
    disease_type = Column(String(100), default="Dengue/Malaria")
    demographic_target = Column(String(50), default="ALL")
    min_risk_threshold = Column(Float, default=0.70)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RiskForecastRecord(Base):
    __tablename__ = "risk_forecast_records"
    
    id = Column(Integer, primary_key=True, index=True)
    city = Column(String(255), index=True, nullable=False)
    country = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    disease = Column(String(100), nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    precipitation = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    shap_humidity = Column(Float, default=0.0)
    shap_rainfall = Column(Float, default=0.0)
    shap_temp = Column(Float, default=0.0)
    shap_wind = Column(Float, default=0.0)
    forecast_cases = Column(Integer, default=0)
    model_version = Column(String(50), default="Ensemble-v2.0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EmergencyReport(Base):
    __tablename__ = "emergency_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    reporter_name = Column(String(255), nullable=False)
    contact_phone = Column(String(100), nullable=False)
    contact_email = Column(String(255), nullable=True)
    patient_age = Column(Integer, nullable=False)
    demographic_group = Column(String(50), nullable=False)  # SENIORS_55_PLUS or INFANTS_0_4
    city = Column(String(255), nullable=False)
    address_or_landmark = Column(String(255), nullable=True)
    symptoms = Column(Text, nullable=False)
    severity = Column(String(50), default="URGENT")
    status = Column(String(50), default="PENDING")  # PENDING, REVIEWED, ESCALATED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AlertDispatchLog(Base):
    __tablename__ = "alert_dispatch_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String(50), default="EMAIL")  # EMAIL, SMS, SYSTEM
    recipient = Column(String(255), nullable=False)
    region = Column(String(255), nullable=False)
    risk_score = Column(Float, nullable=False)
    subject = Column(String(255), nullable=False)
    message_body = Column(Text, nullable=False)
    status = Column(String(50), default="SENT")  # SENT, FAILED
    dispatched_at = Column(DateTime(timezone=True), server_default=func.now())

class HospitalCache(Base):
    __tablename__ = "hospital_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    city_key = Column(String(255), unique=True, index=True, nullable=False)
    raw_osm_json = Column(Text, nullable=False)
    last_synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
