def test_patient_cannot_list_users(client, make_patient):
    h = make_patient()
    assert client.get("/api/users", headers=h).status_code == 403


def test_admin_can_list_users(client, admin_headers):
    assert client.get("/api/users", headers=admin_headers).status_code == 200


def test_patient_cannot_list_patients(client, make_patient):
    assert client.get("/api/patients", headers=make_patient()).status_code == 403


def test_patient_cannot_create_department(client, make_patient):
    r = client.post("/api/departments", headers=make_patient(), json={"name": "X"})
    assert r.status_code == 403


def test_admin_creates_department_and_duplicates_rejected(client, admin_headers):
    assert (
        client.post(
            "/api/departments", headers=admin_headers, json={"name": "Cardio"}
        ).status_code
        == 201
    )
    assert (
        client.post(
            "/api/departments", headers=admin_headers, json={"name": "Cardio"}
        ).status_code
        == 400
    )


def test_user_cannot_read_other_user(client, make_patient):
    h1 = make_patient("a@test.com")
    make_patient("b@test.com")
    me = client.get("/api/auth/me", headers=h1).json()
    other_id = me["id"] + 1
    assert client.get(f"/api/users/{other_id}", headers=h1).status_code == 403


def test_admin_cannot_delete_self(client, admin_headers):
    me = client.get("/api/auth/me", headers=admin_headers).json()
    assert (
        client.delete(f"/api/users/{me['id']}", headers=admin_headers).status_code
        == 400
    )


def test_duplicate_license_rejected(client, make_doctor, admin_headers):
    make_doctor("d1@test.com", license_no="SAME")
    u = client.post(
        "/api/users",
        headers=admin_headers,
        json={
            "name": "D2",
            "email": "d2@test.com",
            "password": "secret123",
            "role": "doctor",
        },
    )
    r = client.post(
        "/api/doctors",
        headers=admin_headers,
        json={"user_id": u.json()["id"], "license_no": "SAME"},
    )
    assert r.status_code == 400
