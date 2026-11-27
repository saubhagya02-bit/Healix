from tests.conftest import next_weekday_at


def book(client, headers, doctor_id, when, reason="checkup"):
    return client.post(
        "/api/appointments",
        headers=headers,
        json={
            "doctor_id": doctor_id,
            "appointment_date": when.isoformat(),
            "reason": reason,
        },
    )


def test_patient_books_appointment(client, make_patient, make_doctor):
    doc_id, _ = make_doctor()
    r = book(client, make_patient(), doc_id, next_weekday_at(10))
    assert r.status_code == 201
    assert r.json()["status"] == "pending"


def test_cannot_book_in_past(client, make_patient, make_doctor):
    from datetime import datetime, timedelta

    doc_id, _ = make_doctor()
    r = book(client, make_patient(), doc_id, datetime.now() - timedelta(days=1))
    assert r.status_code == 400


def test_cannot_book_outside_working_hours(client, make_patient, make_doctor):
    doc_id, _ = make_doctor()
    r = book(client, make_patient(), doc_id, next_weekday_at(20))
    assert r.status_code == 400
    assert "between" in r.json()["detail"]


def test_cannot_book_on_non_working_day(client, make_patient, make_doctor):
    from datetime import datetime, timedelta

    doc_id, _ = make_doctor()
    d = datetime.now() + timedelta(days=3)
    while d.weekday() != 6:  # Sunday
        d += timedelta(days=1)
    r = book(
        client,
        make_patient(),
        doc_id,
        d.replace(hour=10, minute=0, second=0, microsecond=0),
    )
    assert r.status_code == 400


def test_double_booking_rejected(client, make_patient, make_doctor):
    doc_id, _ = make_doctor()
    when = next_weekday_at(10)
    assert book(client, make_patient("a@test.com"), doc_id, when).status_code == 201
    assert book(client, make_patient("b@test.com"), doc_id, when).status_code == 400


def test_doctor_cannot_book(client, make_doctor):
    doc_id, doc_h = make_doctor()
    assert book(client, doc_h, doc_id, next_weekday_at(10)).status_code == 403


def test_patient_can_cancel_but_not_confirm(client, make_patient, make_doctor):
    doc_id, _ = make_doctor()
    h = make_patient()
    appt = book(client, h, doc_id, next_weekday_at(10)).json()
    r = client.put(
        f"/api/appointments/{appt['id']}", headers=h, json={"status": "confirmed"}
    )
    assert r.status_code == 403
    r = client.put(
        f"/api/appointments/{appt['id']}", headers=h, json={"status": "cancelled"}
    )
    assert r.status_code == 200 and r.json()["status"] == "cancelled"


def test_patient_cannot_edit_other_fields(client, make_patient, make_doctor):
    doc_id, _ = make_doctor()
    h = make_patient()
    appt = book(client, h, doc_id, next_weekday_at(10)).json()
    r = client.put(f"/api/appointments/{appt['id']}", headers=h, json={"notes": "hack"})
    assert r.status_code == 403


def test_doctor_confirms_own_appointment(client, make_patient, make_doctor):
    doc_id, doc_h = make_doctor()
    appt = book(client, make_patient(), doc_id, next_weekday_at(10)).json()
    r = client.put(
        f"/api/appointments/{appt['id']}", headers=doc_h, json={"status": "confirmed"}
    )
    assert r.status_code == 200 and r.json()["status"] == "confirmed"


def test_other_doctor_cannot_touch_appointment(client, make_patient, make_doctor):
    doc_id, _ = make_doctor("d1@test.com", license_no="L1")
    _, other_h = make_doctor("d2@test.com", license_no="L2")
    appt = book(client, make_patient(), doc_id, next_weekday_at(10)).json()
    r = client.put(
        f"/api/appointments/{appt['id']}", headers=other_h, json={"status": "confirmed"}
    )
    assert r.status_code == 403


def test_patients_only_see_own_appointments(client, make_patient, make_doctor):
    doc_id, _ = make_doctor()
    h1, h2 = make_patient("a@test.com"), make_patient("b@test.com")
    book(client, h1, doc_id, next_weekday_at(10))
    assert len(client.get("/api/appointments", headers=h1).json()) == 1
    assert client.get("/api/appointments", headers=h2).json() == []


def test_only_admin_can_delete_appointment(
    client, make_patient, make_doctor, admin_headers
):
    doc_id, _ = make_doctor()
    h = make_patient()
    appt = book(client, h, doc_id, next_weekday_at(10)).json()
    assert (
        client.delete(f"/api/appointments/{appt['id']}", headers=h).status_code == 403
    )
    assert (
        client.delete(
            f"/api/appointments/{appt['id']}", headers=admin_headers
        ).status_code
        == 200
    )
