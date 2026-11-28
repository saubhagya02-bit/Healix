from tests.conftest import next_weekday_at


def test_admin_creates_user_with_role(client, admin_headers):
    r = client.post(
        "/api/users",
        headers=admin_headers,
        json={
            "name": "N",
            "email": "n@test.com",
            "password": "secret123",
            "role": "doctor",
        },
    )
    assert r.status_code == 201 and r.json()["role"] == "doctor"


def test_non_admin_cannot_create_user(client, make_patient):
    r = client.post(
        "/api/users",
        headers=make_patient(),
        json={
            "name": "N",
            "email": "n@test.com",
            "password": "secret123",
            "role": "admin",
        },
    )
    assert r.status_code == 403


def test_update_email_to_existing_is_rejected(client, make_patient):
    h1 = make_patient("a@test.com")
    make_patient("b@test.com")
    me = client.get("/api/auth/me", headers=h1).json()
    r = client.put(f"/api/users/{me['id']}", headers=h1, json={"email": "b@test.com"})
    assert r.status_code == 400


def test_delete_user_without_history_works(client, admin_headers, make_patient):
    h = make_patient("gone@test.com")
    uid = client.get("/api/auth/me", headers=h).json()["id"]
    assert client.delete(f"/api/users/{uid}", headers=admin_headers).status_code == 200


def test_delete_doctor_with_appointments_is_blocked(
    client, admin_headers, make_patient, make_doctor
):
    doc_id, _ = make_doctor()
    client.post(
        "/api/appointments",
        headers=make_patient(),
        json={"doctor_id": doc_id, "appointment_date": next_weekday_at(10).isoformat()},
    )
    r = client.delete(f"/api/doctors/{doc_id}", headers=admin_headers)
    assert r.status_code == 400
