from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import get_db
from app.models.models import (
    User,
    UserRole,
    Patient,
    Doctor,
    Appointment,
    MedicalRecord,
    LabReport,
)
from app.schemas.schemas import UserResponse, UserUpdate, UserCreate
from app.utils.auth import get_current_user, require_admin, hash_password

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def get_users(
    role: Optional[UserRole] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin: create a user with any role."""
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
    )
    db.add(user)
    db.flush()
    if user.role == UserRole.patient:
        db.add(Patient(user_id=user.id))
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = user_data.model_dump(exclude_unset=True)
    if "email" in data and data["email"] != user.email:
        if db.query(User).filter(User.email == data["email"]).first():
            raise HTTPException(status_code=400, detail="Email already registered")

    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()
    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'}",
        "is_active": user.is_active,
    }


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    patient, doctor = user.patient_profile, user.doctor_profile
    has_history = False
    if patient:
        has_history = bool(
            db.query(Appointment).filter(Appointment.patient_id == patient.id).first()
            or db.query(MedicalRecord)
            .filter(MedicalRecord.patient_id == patient.id)
            .first()
            or db.query(LabReport).filter(LabReport.patient_id == patient.id).first()
        )
    if doctor:
        has_history = has_history or bool(
            db.query(Appointment).filter(Appointment.doctor_id == doctor.id).first()
            or db.query(MedicalRecord)
            .filter(MedicalRecord.doctor_id == doctor.id)
            .first()
        )
    if has_history:
        raise HTTPException(
            status_code=400,
            detail="User has appointments/medical records and cannot be deleted. Deactivate the account instead.",
        )

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
