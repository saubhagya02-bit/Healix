from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from app.database.database import get_db
from app.models.models import (
    Appointment,
    Patient,
    Doctor,
    User,
    UserRole,
    AppointmentStatus,
)
from app.schemas.schemas import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


@router.get("", response_model=List[AppointmentResponse])
def get_appointments(
    status: Optional[AppointmentStatus] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Appointment)

    # Role-based filtering
    if current_user.role == UserRole.patient:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            return []
        query = query.filter(Appointment.patient_id == patient.id)

    elif current_user.role == UserRole.doctor:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            return []
        query = query.filter(Appointment.doctor_id == doctor.id)

    if status:
        query = query.filter(Appointment.status == status)
    if date_from:
        query = query.filter(
            Appointment.appointment_date
            >= datetime.combine(date_from, datetime.min.time())
        )
    if date_to:
        query = query.filter(
            Appointment.appointment_date
            <= datetime.combine(date_to, datetime.max.time())
        )

    return query.order_by(Appointment.appointment_date.desc()).all()


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Authorization check
    if current_user.role == UserRole.patient:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access denied")

    elif current_user.role == UserRole.doctor:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Access denied")

    return appointment


@router.post("", response_model=AppointmentResponse, status_code=201)
def create_appointment(
    appt_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get patient profile
    if current_user.role == UserRole.patient:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
    else:
        raise HTTPException(
            status_code=403, detail="Only patients can book appointments"
        )

    # Validate doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == appt_data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Check for conflicts (same doctor, same time ± 30 min)
    from datetime import timedelta

    time_window_start = appt_data.appointment_date - timedelta(minutes=29)
    time_window_end = appt_data.appointment_date + timedelta(minutes=29)

    conflict = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == appt_data.doctor_id,
            Appointment.appointment_date.between(time_window_start, time_window_end),
            Appointment.status.in_(
                [AppointmentStatus.pending, AppointmentStatus.confirmed]
            ),
        )
        .first()
    )

    if conflict:
        raise HTTPException(
            status_code=400,
            detail="Doctor already has an appointment at this time. Please choose another slot.",
        )

    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=appt_data.doctor_id,
        appointment_date=appt_data.appointment_date,
        reason=appt_data.reason,
        notes=appt_data.notes,
        status=AppointmentStatus.pending,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appt_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Patients can only cancel their own appointments
    if current_user.role == UserRole.patient:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access denied")
        if appt_data.status and appt_data.status != AppointmentStatus.cancelled:
            raise HTTPException(
                status_code=403, detail="Patients can only cancel appointments"
            )

    for field, value in appt_data.model_dump(exclude_unset=True).items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == UserRole.patient:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access denied")

    db.delete(appointment)
    db.commit()
    return {"message": "Appointment deleted"}
