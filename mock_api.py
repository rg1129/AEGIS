from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="VulnerableBank API - Mock Target")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ENDPOINT 1: Clean ──────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.1.0", "region": "us-east"}

# ── ENDPOINT 2: Probable leak (suspicious field name) ─────────────────────
@app.get("/api/products")
def products():
    return {
        "products": [
            {
                "id": "prod_001",
                "name": "Premium Checking Account",
                "category": "banking",
                "internal_margin_score": 0.73,
                "internal_risk_tier": "low",
                "price": 0.00
            }
        ]
    }

# ── ENDPOINT 3: Definite leak (card + password hash) ──────────────────────
@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    return {
        "id": user_id,
        "name": "Sarah Mitchell",
        "email": "sarah.mitchell@email.com",
        "phone": "+1-555-847-2931",
        "card_number": "4111111111111111",
        "card_expiry": "09/26",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i",
        "account_balance": 12450.00
    }

# ── ENDPOINT 4: GDPR Article 9 (special category health data) ─────────────
@app.get("/api/appointments")
def appointments():
    return {
        "appointments": [
            {
                "id": "apt_001",
                "patient_name": "James Okafor",
                "date": "2025-06-15",
                "doctor": "Dr. Patel",
                "health_diagnosis": "Type 2 Diabetes",
                "medication": "Metformin 500mg",
                "ssn": "372-54-1962",
                "insurance_id": "INS-847291"
            }
        ]
    }

# ── ENDPOINT 5: v2 profile — leaks precise geolocation ────────────────────
@app.get("/api/v2/profile")
def profile_v2():
    return {
        "user_id": "usr_9182",
        "username": "james.okafor",
        "email": "james.okafor@email.com",
        "location": {
            "latitude": 40.712776,
            "longitude": -74.005974,
            "altitude": 10.2,
            "accuracy_meters": 3.1
        },
        "passport_number": "L898902C",
        "created_at": "2024-03-01T10:00:00Z"
    }