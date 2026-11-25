"""
Create (or reset) the admin account.

Run from the backend folder (the one that contains the `app` package):

    python seed_admin.py                      # admin@healix.com / Admin@123
    python seed_admin.py me@mail.com MyPass1  # custom email + password
"""
import sys

from app.database.database import SessionLocal, engine, Base
from app.models.models import User, UserRole
from app.utils.auth import hash_password

email = sys.argv[1] if len(sys.argv) > 1 else "admin@healix.com"
password = sys.argv[2] if len(sys.argv) > 2 else "Admin@123"

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.hashed_password = hash_password(password)
        user.role = UserRole.admin
        user.is_active = True
        print(f"Updated existing user -> admin: {email}")
    else:
        db.add(
            User(
                name="Administrator",
                email=email,
                hashed_password=hash_password(password),
                role=UserRole.admin,
                is_active=True,
            )
        )
        print(f"Created admin: {email}")
    db.commit()
    print(f"Login with  {email}  /  {password}")
finally:
    db.close()