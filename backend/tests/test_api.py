import pytest
from fastapi.testclient import TestClient
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from database import Base, engine
from seed_data import init_and_seed_db
from services.forecasting import calculate_vector_climate_suitability, generate_forecast_trajectory

@pytest.fixture(scope="module")
def client():
    init_and_seed_db()
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "ClimateGuard AI"
    assert data["status"] == "HEALTHY"

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_vector_suitability_calculation():
    # Test high-risk climate conditions (30°C, 85% humidity, 40mm rain)
    risk, shap_items = calculate_vector_climate_suitability(
        temp=30.0,
        humidity=85.0,
        precip_7d=40.0,
        wind_speed=4.0,
        disease="Dengue"
    )
    assert 0.70 <= risk <= 0.98
    assert len(shap_items) == 4
    assert any(s["feature"] == "Relative Humidity" for s in shap_items)
    
    # Test low-risk climate conditions (12°C, 30% humidity, 0mm rain)
    low_risk, _ = calculate_vector_climate_suitability(
        temp=12.0,
        humidity=30.0,
        precip_7d=0.0,
        wind_speed=20.0,
        disease="Dengue"
    )
    assert low_risk < 0.40

def test_forecast_trajectory_generation():
    trajectory = generate_forecast_trajectory(base_risk=0.75, current_temp=29.0, current_humidity=80.0, days=30)
    assert len(trajectory) == 30
    assert trajectory[0]["predicted_cases"] > 0
    assert trajectory[0]["upper_bound"] >= trajectory[0]["predicted_cases"]

def test_public_risk_summary(client):
    response = client.get("/api/public/risk-summary")
    assert response.status_code == 200
    cities = response.json()
    assert len(cities) >= 5
    first_city = cities[0]
    assert "city" in first_city
    assert "risk_score" in first_city
    assert "shap_attributions" in first_city

def test_custom_location_evaluation(client):
    payload = {
        "city_name": "Test Tropical City",
        "latitude": 14.5995,
        "longitude": 120.9842,
        "disease": "Dengue"
    }
    response = client.post("/api/public/evaluate-custom-location", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["city"] == "Test Tropical City"
    assert "risk_score" in data
    assert len(data["forecast_trajectory"]) == 30

def test_alert_subscription_flow(client):
    payload = {
        "email": "test.subscriber@example.com",
        "phone": "+91-9999988888",
        "region": "Delhi",
        "disease_type": "Dengue",
        "demographic_target": "SENIORS_55_PLUS",
        "min_risk_threshold": 0.75
    }
    response = client.post("/api/subscriptions/subscribe", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test.subscriber@example.com"
    assert data["demographic_target"] == "SENIORS_55_PLUS"
    assert data["is_active"] is True

def test_caregiver_report_submission(client):
    payload = {
        "reporter_name": "Ramesh Kumar",
        "contact_phone": "+91-9876500000",
        "contact_email": "ramesh@example.com",
        "patient_age": 72,
        "demographic_group": "SENIORS_55_PLUS",
        "city": "Delhi",
        "address_or_landmark": "Civil Lines, Block B",
        "symptoms": "High fever, chills, vomiting, joint pain.",
        "severity": "URGENT"
    }
    response = client.post("/api/reports/submit", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["reporter_name"] == "Ramesh Kumar"
    assert data["status"] == "PENDING"

def test_officer_login_and_admin_metrics(client):
    # 1. Login with seeded credentials
    login_payload = {
        "email": "officer@climateguard.org",
        "password": "HealthOfficer2026!"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    token = token_data["access_token"]
    assert token is not None
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Access Admin Metrics
    metrics_res = client.get("/api/admin/metrics", headers=headers)
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert metrics["total_active_subscribers"] > 0
    assert metrics["pending_caregiver_reports"] > 0

    # 3. Access Caregiver Reports Queue
    reports_res = client.get("/api/admin/reports", headers=headers)
    assert reports_res.status_code == 200
    assert len(reports_res.json()) > 0
