from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.models import User, Patient, UserRole
from app.schemas.schemas import UserCreate, UserLogin, Token, UserResponse
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (default to patient role)"""
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
    )
    db.add(user)
    db.flush()

    # Auto create patient profile if role is patient
    if user.role == UserRole.patient:
        patient = Patient(user_id=user.id)
        db.add(patient)

    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and return JWT token"""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name,
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get currently authenticated user"""
    return current_user


@router.post("/logout")
def logout():
    """Logout"""
    return {"message": "Logged out successfully"}
