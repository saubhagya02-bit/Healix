from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session  # Used to communicate with the database
from typing import List, Optional

from app.database.database import get_db
from app.models.models import Patient, User, UserRole
from app.schemas.schemas import PatientResponse, PatientCreate, PatientUpdate
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/patients", tags=["Patients"])


@router.get("", response_model=List[PatientResponse])
def get_patients(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all patients (admin/doctor only)."""
    if current_user.role == UserRole.patient:
        raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(Patient).join(User)
    if search:
        query = query.filter(User.name.ilike(f"%{search}%"))

    return query.offset(skip).limit(limit).all()


@router.get("/me", response_model=PatientResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get own patient profile"""
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if current_user.role == UserRole.patient and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return patient


@router.put("/me", response_model=PatientResponse)
def update_my_profile(
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update own patient profile"""
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    for field, value in patient_data.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)

        db.commit()
        db.refresh(patient)
        return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin can update any patient"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    for field, value in patient_data.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)

    db.commit() # Saves changes to the database
    db.refresh(patient) # Reloads the updated patient from the database
    return patient


@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted successfully"}
