from app.database.database import SessionLocal
from app.models.models import User


def test_register_creates_patient(client):
    r = client.post(
        "/api/auth/register",
        json={"name": "A", "email": "a@test.com", "password": "secret123"},
    )
    assert r.status_code == 201
    assert r.json()["role"] == "patient"


def test_register_cannot_self_assign_admin(client):
    r = client.post(
        "/api/auth/register",
        json={
            "name": "Evil",
            "email": "evil@test.com",
            "password": "secret123",
            "role": "admin",
        },
    )
    assert r.status_code == 201
    assert r.json()["role"] == "patient"


def test_register_duplicate_email(client):
    body = {"name": "A", "email": "dup@test.com", "password": "secret123"}
    assert client.post("/api/auth/register", json=body).status_code == 201
    assert client.post("/api/auth/register", json=body).status_code == 400


def test_register_short_password_rejected(client):
    r = client.post(
        "/api/auth/register",
        json={"name": "A", "email": "s@test.com", "password": "123"},
    )
    assert r.status_code == 422


def test_login_success_returns_role(client, make_patient):
    make_patient("p@test.com")
    r = client.post(
        "/api/auth/login", json={"email": "p@test.com", "password": "secret123"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["role"] == "patient" and body["access_token"]


def test_login_wrong_password(client, make_patient):
    make_patient("p@test.com")
    r = client.post(
        "/api/auth/login", json={"email": "p@test.com", "password": "nope-nope"}
    )
    assert r.status_code == 401


def test_login_unknown_user(client):
    r = client.post(
        "/api/auth/login", json={"email": "x@test.com", "password": "secret123"}
    )
    assert r.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_rejects_garbage_token(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer abc.def.ghi"})
    assert r.status_code == 401


def test_deactivated_user_cannot_login(client, admin_headers, make_patient):
    make_patient("p@test.com")
    db = SessionLocal()
    uid = db.query(User).filter(User.email == "p@test.com").first().id
    db.close()
    assert (
        client.patch(
            f"/api/users/{uid}/toggle-active", headers=admin_headers
        ).status_code
        == 200
    )
    r = client.post(
        "/api/auth/login", json={"email": "p@test.com", "password": "secret123"}
    )
    assert r.status_code == 400
