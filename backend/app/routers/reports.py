from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, datetime, timedelta
from typing import List, Dict, Any

from app.database.database import get_db
from app.models.models import (
    User, Patient, Doctor, Appointment, MedicalRecord,
    Department, AppointmentStatus, UserRole
)
from app.schemas.schemas import DashboardStats
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/reports", tags=["Reports & Dashboard"])


@router.get("/dashboard/admin", response_model=DashboardStats)
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    today = date.today()

    total_patients = db.query(Patient).count()
    total_doctors = db.query(Doctor).count()
    total_departments = db.query(Department).count()
    total_appointments = db.query(Appointment).count()

    today_appointments = db.query(Appointment).filter(
        func.date(Appointment.appointment_date) == today
    ).count()

    pending = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.pending
    ).count()

    completed = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.completed
    ).count()

    # Monthly revenue (sum of consultation fees for completed appointments this month)
    first_of_month = today.replace(day=1)
    monthly_revenue_result = (
        db.query(func.sum(Doctor.consultation_fee))
        .join(Appointment, Appointment.doctor_id == Doctor.id)
        .filter(
            Appointment.status == AppointmentStatus.completed,
            func.date(Appointment.appointment_date) >= first_of_month,
        )
        .scalar()
    )

    return DashboardStats(
        total_patients=total_patients,
        total_doctors=total_doctors,
        total_appointments=total_appointments,
        today_appointments=today_appointments,
        pending_appointments=pending,
        completed_appointments=completed,
        total_departments=total_departments,
        monthly_revenue=float(monthly_revenue_result or 0),
    )


@router.get("/dashboard/doctor")
def doctor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.doctor:
        raise HTTPException(status_code=403, detail="Doctor access only")

    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    today = date.today()

    today_patients = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        func.date(Appointment.appointment_date) == today,
        Appointment.status.in_([AppointmentStatus.pending, AppointmentStatus.confirmed]),
    ).count()

    upcoming = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date > datetime.now(),
        Appointment.status.in_([AppointmentStatus.pending, AppointmentStatus.confirmed]),
    ).count()

    completed = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.status == AppointmentStatus.completed,
    ).count()

    total_records = db.query(MedicalRecord).filter(
        MedicalRecord.doctor_id == doctor.id
    ).count()

    return {
        "today_patients": today_patients,
        "upcoming_appointments": upcoming,
        "completed_consultations": completed,
        "total_records_created": total_records,
    }


@router.get("/dashboard/patient")
def patient_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.patient:
        raise HTTPException(status_code=403, detail="Patient access only")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    next_appointment = (
        db.query(Appointment)
        .filter(
            Appointment.patient_id == patient.id,
            Appointment.appointment_date > datetime.now(),
            Appointment.status.in_([AppointmentStatus.pending, AppointmentStatus.confirmed]),
        )
        .order_by(Appointment.appointment_date.asc())
        .first()
    )

    total_appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient.id
    ).count()

    total_prescriptions = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.patient_id == patient.id)
        .count()
    )

    total_records = db.query(MedicalRecord).filter(
        MedicalRecord.patient_id == patient.id
    ).count()

    return {
        "next_appointment": next_appointment,
        "total_appointments": total_appointments,
        "total_prescriptions": total_prescriptions,
        "total_medical_records": total_records,
    }


@router.get("/appointments/monthly")
def monthly_appointments(
    year: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Monthly appointment counts for the given year."""
    year = year or date.today().year
    results = (
        db.query(
            extract("month", Appointment.appointment_date).label("month"),
            func.count(Appointment.id).label("count"),
        )
        .filter(extract("year", Appointment.appointment_date) == year)
        .group_by("month")
        .order_by("month")
        .all()
    )

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    data = {m: 0 for m in months}
    for row in results:
        data[months[int(row.month) - 1]] = row.count

    return [{"month": k, "count": v} for k, v in data.items()]


@router.get("/appointments/by-department")
def appointments_by_department(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    results = (
        db.query(
            Department.name.label("department"),
            func.count(Appointment.id).label("count"),
        )
        .join(Doctor, Doctor.department_id == Department.id)
        .join(Appointment, Appointment.doctor_id == Doctor.id)
        .group_by(Department.name)
        .all()
    )
    return [{"department": r.department, "count": r.count} for r in results]


@router.get("/patients/statistics")
def patient_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    total = db.query(Patient).count()
    male = db.query(Patient).filter(Patient.gender == "male").count()
    female = db.query(Patient).filter(Patient.gender == "female").count()
    other = db.query(Patient).filter(Patient.gender == "other").count()

    # New patients this month
    first_of_month = date.today().replace(day=1)
    new_this_month = db.query(Patient).filter(
        func.date(Patient.created_at) >= first_of_month
    ).count()

    return {
        "total": total,
        "male": male,
        "female": female,
        "other": other,
        "new_this_month": new_this_month,
    }