from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import get_db
from app.models.models import (
    MedicalRecord,
    Prescription,
    Patient,
    Doctor,
    User,
    UserRole,
)
from app.schemas.schemas import (
    MedicalRecordCreate,
    MedicalRecordUpdate,
    MedicalRecordResponse,
)
from app.utils.auth import get_current_user, require_doctor

router = APIRouter(prefix="/api/records", tags=["Medical Records"])


@router.get("", response_model=List[MedicalRecordResponse])
def get_records(
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MedicalRecord)

    if current_user.role == UserRole.patient:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            return []
        query = query.filter(MedicalRecord.patient_id == patient.id)

    elif current_user.role == UserRole.doctor:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            return []
        if patient_id:
            query = query.filter(MedicalRecord.patient_id == patient_id)
        else:
            query = query.filter(MedicalRecord.doctor_id == doctor.id)

    elif patient_id:
        query = query.filter(MedicalRecord.patient_id == patient_id)

    return query.order_by(MedicalRecord.visit_date.desc()).all()


@router.get("/{record_id}", response_model=MedicalRecordResponse)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")

    if current_user.role == UserRole.patient:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or record.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access denied")

    return record


@router.post("", response_model=MedicalRecordResponse, status_code=201)
def create_record(
    record_data: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    """Doctor creates a medical record."""
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()

    if not doctor:
        raise HTTPException(
            status_code=400,
            detail="Only a user with a doctor profile can create medical records",
        )

    # Validate patient
    patient = db.query(Patient).filter(Patient.id == record_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    prescriptions_data = record_data.prescriptions or []

    record = MedicalRecord(
        patient_id=record_data.patient_id,
        doctor_id=doctor.id,
        appointment_id=record_data.appointment_id,
        diagnosis=record_data.diagnosis,
        treatment=record_data.treatment,
        notes=record_data.notes,
        follow_up_date=record_data.follow_up_date,
    )
    db.add(record)
    db.flush()

    # Add prescriptions
    for rx in prescriptions_data:
        prescription = Prescription(
            medical_record_id=record.id,
            **rx.model_dump(),
        )
        db.add(prescription)

    db.commit()
    db.refresh(record)
    return record


@router.put("/{record_id}", response_model=MedicalRecordResponse)
def update_record(
    record_id: int,
    record_data: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")

    for field, value in record_data.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record
