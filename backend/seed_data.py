from database import engine, Base, SessionLocal
from models import User, AlertSubscription, EmergencyReport
from services.auth_service import get_password_hash

def init_and_seed_db():
    print("[Seed] Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if default admin exists
        existing_user = db.query(User).filter(User.email == "officer@climateguard.org").first()
        if not existing_user:
            admin_user = User(
                email="officer@climateguard.org",
                hashed_password=get_password_hash("HealthOfficer2026!"),
                full_name="Dr. Elena Vance, MD",
                organization="WHO Global Vector Surveillance Unit",
                role="ADMIN",
                assigned_region="Global",
                is_active=True
            )
            db.add(admin_user)
            print("[Seed] Created default health officer: officer@climateguard.org")
            
        # Seed initial sample subscriptions
        if db.query(AlertSubscription).count() == 0:
            subs = [
                AlertSubscription(email="caregiver.delhi@elderlycare.org", phone="+91-9810012345", region="Delhi", demographic_target="SENIORS_55_PLUS", min_risk_threshold=0.75),
                AlertSubscription(email="pediatrics.manila@pgh.gov.ph", phone="+63-9171234567", region="Manila", demographic_target="INFANTS_0_4", min_risk_threshold=0.80),
                AlertSubscription(email="clinic.lagos@health.gov.ng", phone="+234-8021234567", region="Lagos", demographic_target="ALL", min_risk_threshold=0.70),
                AlertSubscription(email="response.dhaka@icddrb.org", phone="+880-1711234567", region="Dhaka", demographic_target="ALL", min_risk_threshold=0.75),
            ]
            db.add_all(subs)
            print("[Seed] Seeded initial alert subscriptions.")
            
        # Seed initial emergency report for demonstration
        if db.query(EmergencyReport).count() == 0:
            report = EmergencyReport(
                reporter_name="Sunita Sharma",
                contact_phone="+91-9876543210",
                contact_email="sunita@example.com",
                patient_age=68,
                demographic_group="SENIORS_55_PLUS",
                city="Delhi",
                address_or_landmark="Rohini Sector 14, Near Community Hall",
                symptoms="High fever (103°F) for 3 days, severe joint pain, bleeding gums after taking aspirin.",
                severity="EMERGENCY",
                status="PENDING",
                notes="Patient has history of hypertension and blood thinners."
            )
            db.add(report)
            print("[Seed] Seeded initial caregiver emergency report.")

        db.commit()
        print("[Seed] Database ready.")
    finally:
        db.close()

if __name__ == "__main__":
    init_and_seed_db()
