from tests.conftest import next_weekday_at


def setup_visit(client, make_patient, make_doctor):
    doc_id, doc_h = make_doctor()
    pat_h = make_patient()
    appt = client.post(
        "/api/appointments",
        headers=pat_h,
        json={
            "doctor_id": doc_id,
            "appointment_date": next_weekday_at(10).isoformat(),
            "reason": "cough",
        },
    ).json()
    patient_id = appt["patient_id"]
    return doc_h, pat_h, appt, patient_id


def make_record(client, doc_h, appt, patient_id):
    return client.post(
        "/api/records",
        headers=doc_h,
        json={
            "patient_id": patient_id,
            "appointment_id": appt["id"],
            "diagnosis": "Flu",
            "treatment": "Rest",
            "prescriptions": [
                {"medicine_name": "Paracetamol", "dosage": "500mg"},
                {"medicine_name": "Vitamin C"},
            ],
        },
    )


def test_doctor_creates_record_and_completes_appointment(
    client, make_patient, make_doctor
):
    doc_h, pat_h, appt, pid = setup_visit(client, make_patient, make_doctor)
    r = make_record(client, doc_h, appt, pid)
    assert r.status_code == 201
    assert len(r.json()["prescriptions"]) == 2
    got = client.get(f"/api/appointments/{appt['id']}", headers=doc_h).json()
    assert got["status"] == "completed"


def test_record_cannot_be_duplicated_for_same_appointment(
    client, make_patient, make_doctor
):
    doc_h, _, appt, pid = setup_visit(client, make_patient, make_doctor)
    assert make_record(client, doc_h, appt, pid).status_code == 201
    assert make_record(client, doc_h, appt, pid).status_code == 400


def test_patient_cannot_create_record(client, make_patient, make_doctor):
    _, pat_h, appt, pid = setup_visit(client, make_patient, make_doctor)
    assert make_record(client, pat_h, appt, pid).status_code == 403


def test_patient_sees_own_record_only(client, make_patient, make_doctor):
    doc_h, pat_h, appt, pid = setup_visit(client, make_patient, make_doctor)
    make_record(client, doc_h, appt, pid)
    assert len(client.get("/api/records", headers=pat_h).json()) == 1
    other = make_patient("other@test.com")
    assert client.get("/api/records", headers=other).json() == []


def test_other_doctor_cannot_edit_record(client, make_patient, make_doctor):
    doc_h, _, appt, pid = setup_visit(client, make_patient, make_doctor)
    rec = make_record(client, doc_h, appt, pid).json()
    _, other_doc_h = make_doctor("d2@test.com", license_no="L2")
    r = client.put(
        f"/api/records/{rec['id']}", headers=other_doc_h, json={"diagnosis": "Changed"}
    )
    assert r.status_code == 403


def test_owner_doctor_can_edit_record(client, make_patient, make_doctor):
    doc_h, _, appt, pid = setup_visit(client, make_patient, make_doctor)
    rec = make_record(client, doc_h, appt, pid).json()
    r = client.put(
        f"/api/records/{rec['id']}", headers=doc_h, json={"diagnosis": "Updated"}
    )
    assert r.status_code == 200 and r.json()["diagnosis"] == "Updated"


def test_patient_dashboard_counts_prescriptions(client, make_patient, make_doctor):
    doc_h, pat_h, appt, pid = setup_visit(client, make_patient, make_doctor)
    make_record(client, doc_h, appt, pid)
    d = client.get("/api/reports/dashboard/patient", headers=pat_h).json()
    assert d["total_prescriptions"] == 2
    assert d["total_medical_records"] == 1
