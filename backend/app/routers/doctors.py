from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import get_db
from app.models.models import Doctor, User, UserRole
from app.schemas.schemas import DoctorResponse, DoctorCreate, DoctorUpdate
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])


@router.get("", response_model=List[DoctorResponse])
def get_doctors(
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Doctor).join(User)
    if department_id:
        query = query.filter(Doctor.department_id == department_id)
    if search:
        query = query.filter(User.name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()


@router.get("/me", response_model=DoctorResponse)
def get_my_doctor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.doctor:
        raise HTTPException(status_code=403, detail="Doctor access only")
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return doctor


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.post("", response_model=DoctorResponse, status_code=201)
def create_doctor(
    doctor_data: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin: Create doctor profile for an existing user."""
    user = db.query(User).filter(User.id == doctor_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(Doctor).filter(Doctor.user_id == doctor_data.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doctor profile already exists for this user")

    # Update user role to doctor
    user.role = UserRole.doctor

    doctor = Doctor(**doctor_data.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.put("/me", response_model=DoctorResponse)
def update_my_doctor_profile(
    doctor_data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.doctor:
        raise HTTPException(status_code=403, detail="Doctor access only")

    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    for field, value in doctor_data.model_dump(exclude_unset=True).items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)
    return doctor


@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    doctor_data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    for field, value in doctor_data.model_dump(exclude_unset=True).items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/{doctor_id}")
def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db.delete(doctor)
    db.commit()
    return {"message": "Doctor deleted successfully"}