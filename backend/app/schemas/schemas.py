from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date
from app.models.models import UserRole, AppointmentStatus, Gender


# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.patient

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Patient Schemas
class PatientBase(BaseModel):
    dob: Optional[date] = None
    gender: Optional[Gender] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(PatientBase):
    pass


class PatientResponse(PatientBase):
    id: int
    user_id: int
    user: UserResponse
    created_at: datetime

    class Config:
        from_attributes = True


# Doctor Schemas
class DoctorBase(BaseModel):
    specialization: Optional[str] = None
    license_no: Optional[str] = None
    department_id: Optional[int] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = 0
    consultation_fee: Optional[float] = 0.0
    available_days: Optional[str] = "Monday,Tuesday,Wednesday,Thursday,Friday"
    start_time: Optional[str] = "09:00"
    end_time: Optional[str] = "17:00"


class DoctorCreate(DoctorBase):
    user_id: int


class DoctorUpdate(DoctorBase):
    pass


class DoctorResponse(DoctorBase):
    id: int
    user_id: int
    user: UserResponse
    department: Optional[DepartmentResponse] = None

    class Config:
        from_attributes = True


# Appoinment Schemas
class AppointmentBase(BaseModel):
    appointment_date: datetime
    reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    doctor_id: int


class AppointmentUpdate(BaseModel):
    appointment_date: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    reason: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: int
    patient_id: int
    doctor_id: int
    status: AppointmentStatus
    created_at: datetime
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


# Prescription Schemas
class PrescriptionBase(BaseModel):
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionResponse(PrescriptionBase):
    id: int
    medical_record_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Medical Record Schemas
class MedicalRecordBase(BaseModel):
    diagnosis: str
    treatment: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[date] = None


class MedicalRecordCreate(MedicalRecordBase):
    patient_id: int
    appointment_id: Optional[int] = None
    prescriptions: Optional[List[PrescriptionCreate]] = []


class MedicalRecordUpdate(BaseModel):
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[date] = None


class MedicalRecordResponse(MedicalRecordBase):
    id: int
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    visit_date: datetime
    created_at: datetime
    prescriptions: List[PrescriptionResponse] = []
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


# Lab Report Schemas


class LabReportCreate(BaseModel):
    report_name: str
    description: Optional[str] = None


class LabReportResponse(BaseModel):
    id: int
    patient_id: int
    report_name: str
    file_path: Optional[str] = None
    description: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


# Dashboard Stats
class DashboardStats(BaseModel):
    total_patients: int
    total_doctors: int
    total_appointments: int
    today_appointments: int
    pending_appointments: int
    completed_appointments: int
    monthly_revenue: float
