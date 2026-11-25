from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta

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
from app.utils.auth import get_current_user, require_admin

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


def _is_past(dt: datetime) -> bool:
    now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()
    return dt < now


def _check_slot(
    db: Session, doctor: Doctor, dt: datetime, exclude_id: Optional[int] = None
):
    """Validate that the doctor works at this day/time and has no clash."""
    days = [
        d.strip().lower() for d in (doctor.available_days or "").split(",") if d.strip()
    ]
    if days and dt.strftime("%A").lower() not in days:
        raise HTTPException(
            status_code=400,
            detail=f"Doctor is not available on {dt.strftime('%A')}s",
        )

    start = doctor.start_time or "09:00"
    end = doctor.end_time or "17:00"
    if not (start <= dt.strftime("%H:%M") < end):
        raise HTTPException(
            status_code=400,
            detail=f"Doctor is only available between {start} and {end}",
        )

    q = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date.between(
            dt - timedelta(minutes=29), dt + timedelta(minutes=29)
        ),
        Appointment.status.in_(
            [AppointmentStatus.pending, AppointmentStatus.confirmed]
        ),
    )
    if exclude_id:
        q = q.filter(Appointment.id != exclude_id)
    if q.first():
        raise HTTPException(
            status_code=400,
            detail="Doctor already has an appointment at this time. Please choose another slot.",
        )


@router.post("", response_model=AppointmentResponse, status_code=201)
def create_appointment(
    appt_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.patient:
        raise HTTPException(
            status_code=403, detail="Only patients can book appointments"
        )

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    doctor = db.query(Doctor).filter(Doctor.id == appt_data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    if _is_past(appt_data.appointment_date):
        raise HTTPException(
            status_code=400, detail="Cannot book an appointment in the past"
        )

    _check_slot(db, doctor, appt_data.appointment_date)

    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=doctor.id,
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

    data = appt_data.model_dump(exclude_unset=True)

    if current_user.role == UserRole.patient:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access denied")
        if set(data) != {"status"} or data["status"] != AppointmentStatus.cancelled:
            raise HTTPException(
                status_code=403, detail="Patients can only cancel appointments"
            )

    elif current_user.role == UserRole.doctor:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Access denied")

    final = (AppointmentStatus.completed, AppointmentStatus.cancelled)
    if (
        current_user.role != UserRole.admin
        and appointment.status in final
        and any(getattr(appointment, k) != v for k, v in data.items())
    ):
        raise HTTPException(
            status_code=400,
            detail=f"A {appointment.status.value} appointment cannot be changed",
        )

    if (
        data.get("appointment_date")
        and data["appointment_date"] != appointment.appointment_date
    ):
        if _is_past(data["appointment_date"]):
            raise HTTPException(
                status_code=400, detail="Cannot move an appointment to the past"
            )
        _check_slot(
            db, appointment.doctor, data["appointment_date"], exclude_id=appointment.id
        )

    for field, value in data.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appointment.medical_record:
        raise HTTPException(
            status_code=400,
            detail="This appointment has a medical record and cannot be deleted",
        )

    db.delete(appointment)
    db.commit()
    return {"message": "Appointment deleted"}
