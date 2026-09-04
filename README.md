# 🏥 Healix - Healthcare Management System

A full-stack web application for managing healthcare operations including patient appointments, electronic medical records, prescriptions, doctor schedules and admin reporting.

Built with **Python FastAPI** (backend) + **React.js** (frontend) + **PostgreSQL** (database).

---

## 📸 Preview

### 🔐 Login Page
![Login](screenshots/login.png)

### 🔧 Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)

### 📅 Admin Appointments
![Admin Appointments](screenshots/admin-appointments.png)

### 👨‍⚕️ Doctor Dashboard
![Doctor Dashboard](screenshots/doctor-dashboard.png)

### 📋 Doctor Appointments
![Doctor Appointments](screenshots/doctor-appointments.png)

### 🧑‍🤝‍🧑 Patient Dashboard
![Patient Dashboard](screenshots/patient-dashboard.png)

### 📅 Book Appointment
![Book Appointment](screenshots/patient-book.png)

---

## ✨ Features

### 🧑‍💼 Admin
- Full user management (activate / deactivate / delete)
- Create and manage doctor profiles
- Manage hospital departments
- View and update all appointments
- Analytics dashboard with charts
- Monthly appointment reports
- Patient and department statistics

### 👨‍⚕️ Doctor
- View daily schedule and upcoming appointments
- Add diagnoses, treatment plans, and prescriptions
- Complete consultations and create medical records
- View patient history
- Update professional profile and availability

### 🧑‍🤝‍🧑 Patient
- Register and login
- Book appointments with doctor availability checking
- View and cancel appointments
- View complete medical history
- View prescriptions from doctors
- Update personal profile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Charts | Recharts |
| HTTP Client | Axios |
| Backend | Python 3.12, FastAPI |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic v2 |
| Authentication | JWT (python-jose), bcrypt |
| Database | PostgreSQL 16 |
| Web Server | Nginx (production) |

---

## 📁 Project Structure

```
Healix/
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings & environment variables
│   │   ├── database/
│   │   │   └── database.py      # SQLAlchemy engine & session
│   │   ├── models/
│   │   │   └── models.py        # All database models
│   │   ├── schemas/
│   │   │   └── schemas.py       # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py          # Register, Login, Logout
│   │   │   ├── users.py         # User management
│   │   │   ├── patients.py      # Patient CRUD
│   │   │   ├── doctors.py       # Doctor CRUD
│   │   │   ├── appointments.py  # Appointment CRUD
│   │   │   ├── records.py       # Medical records
│   │   │   ├── departments.py   # Department CRUD
│   │   │   └── reports.py       # Dashboard stats & charts
│   │   └── utils/
│   │       └── auth.py          # JWT utils, password hashing
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Layout.jsx
    │   │   │   └── Sidebar.jsx
    │   │   └── common/
    │   │       └── index.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── admin/
    │       ├── doctor/
    │       └── patient/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── Dockerfile
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 16+
- Git

---

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/healix.git
cd healix
```

---

### 2. Database Setup

Open **pgAdmin** or **psql** and create the database:

```sql
CREATE DATABASE hospital_appoinment_system;
```

Then run the full setup script:

```bash
psql -U postgres -d hospital_appoinment_system -f database_setup.sql
```

Or open `database_setup.sql` in pgAdmin Query Tool and click **Run**.

---

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials
```

**Edit `.env`:**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/hospital_appoinment_system
SECRET_KEY=your-long-random-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
APP_NAME=Healix
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Start the backend:**
```bash
python -m uvicorn app.main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

---

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

### 5. Generate Password Hashes (First Time Setup)

After setting up the database, generate correct password hashes:

```bash
cd backend
venv\Scripts\activate
python generate_hashes.py
```

Copy the 3 SQL statements it prints and run them in pgAdmin.

---

## 🔐 User Roles & Access

| Role | Access |
|---|---|
| Admin | Full system access, user management, reports |
| Doctor | Appointments, medical records, prescriptions |
| Patient | Book appointments, view records and prescriptions |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/patients` | List all patients |
| GET | `/api/doctors` | List all doctors |
| GET | `/api/departments` | List departments |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments` | Get appointments |
| PUT | `/api/appointments/{id}` | Update appointment |
| POST | `/api/records` | Create medical record |
| GET | `/api/records` | Get medical records |
| GET | `/api/reports/dashboard/admin` | Admin dashboard stats |
| GET | `/api/reports/dashboard/doctor` | Doctor dashboard stats |
| GET | `/api/reports/dashboard/patient` | Patient dashboard stats |
| GET | `/api/reports/appointments/monthly` | Monthly chart data |
| GET | `/api/reports/appointments/by-department` | Department chart data |

Full API documentation available at `http://localhost:8000/docs`

---

## 🗄️ Database Schema

```
users
  ├── patients (one-to-one)
  │     ├── appointments (one-to-many)
  │     ├── medical_records (one-to-many)
  │     └── lab_reports (one-to-many)
  └── doctors (one-to-one)
        ├── department (many-to-one)
        ├── appointments (one-to-many)
        └── medical_records (one-to-many)
              └── prescriptions (one-to-many)
```

---

## 🔒 Security

- JWT token authentication with configurable expiry
- Bcrypt password hashing
- Role-based access control on every API endpoint
- CORS configuration for allowed origins
- Input validation with Pydantic
- SQL injection protection via SQLAlchemy ORM
- Environment variables for all sensitive data

---

## 🐳 Docker Deployment (Optional)

```bash
# Build and start all services
docker-compose up --build

# App runs at http://localhost:3000
# API runs at http://localhost:8000
```

---

## 📦 Building for Production

**Frontend:**
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

**Backend:**
```bash
# Use gunicorn for production
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Ushani Saubhagya** - Software Engineering Student, University of Kelaniya

---

## 📄 License

This project is licensed under the MIT License - free for academic and commercial use.
