"""
Test setup. Uses a throw-away SQLite file so no PostgreSQL is needed.
The env vars MUST be set before the app is imported.
"""

import os
from datetime import datetime, timedelta

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_healix.db")
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production"
os.environ["DEBUG"] = "True"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import Base, engine, SessionLocal
from app.models.models import User, UserRole
from app.utils.auth import hash_password


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def _login(client, email, password):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def admin_headers(client):
    db = SessionLocal()
    db.add(
        User(
            name="Admin",
            email="admin@test.com",
            hashed_password=hash_password("Admin@123"),
            role=UserRole.admin,
        )
    )
    db.commit()
    db.close()
    return _login(client, "admin@test.com", "Admin@123")


@pytest.fixture
def make_patient(client):
    def _make(email="pat@test.com", name="Pat Ient"):
        r = client.post(
            "/api/auth/register",
            json={"name": name, "email": email, "password": "secret123"},
        )
        assert r.status_code == 201, r.text
        return _login(client, email, "secret123")

    return _make


@pytest.fixture
def make_doctor(client, admin_headers):
    def _make(email="doc@test.com", name="Doc Tor", license_no="LIC-1", **extra):
        u = client.post(
            "/api/users",
            headers=admin_headers,
            json={
                "name": name,
                "email": email,
                "password": "secret123",
                "role": "doctor",
            },
        )
        assert u.status_code == 201, u.text
        d = client.post(
            "/api/doctors",
            headers=admin_headers,
            json={
                "user_id": u.json()["id"],
                "specialization": "Cardiology",
                "license_no": license_no,
                "consultation_fee": 1000,
                **extra,
            },
        )
        assert d.status_code == 201, d.text
        return d.json()["id"], _login(client, email, "secret123")

    return _make


def next_weekday_at(hour=10, minute=0, days_ahead=3):
    """A future Mon-Fri datetime (ISO string) so availability checks pass."""
    d = datetime.now() + timedelta(days=days_ahead)
    while d.weekday() >= 5:
        d += timedelta(days=1)
    return d.replace(hour=hour, minute=minute, second=0, microsecond=0)
