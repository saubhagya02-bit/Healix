# 🏥 Healix - Healthcare Appointment & Electronic Medical Records System

A full-stack web application where **patients** book appointments, **doctors** run consultations and issue prescriptions, and **admins** manage the whole hospital, with role-based access, analytics and a production-style DevOps setup.

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
 
### 👤 Patient
- Self-registration and secure login
- Browse doctors by department and book appointments with date and time-slot selection
- Cancel own appointments
- View personal medical records, diagnoses and prescriptions
- Manage personal profile (blood group, emergency contact, etc.)
### 🩺 Doctor
- Dashboard with today's patients, upcoming appointments and consultation stats
- Confirm appointments, then complete the visit by writing a **medical record with multiple prescriptions**
- "My Patients" view built from confirmed and completed appointments
- Manage own professional profile, fees, available days and working hours
### 🛠️ Admin
- Create, activate/deactivate and delete users
- Manage doctors, departments, patients and all appointments
- Analytics: monthly appointments, appointments by department, patient demographics, monthly revenue
### ⚙️ Business Rules (enforced by the API)
- Appointments can only be booked **in the future**, on the doctor's **working days** and **within working hours**
- **No double-booking**: a doctor cannot have two active appointments within the same 30-minute window
- Patients can only **cancel**; doctors can only manage **their own** appointments and records
- Completed or cancelled appointments are locked for non-admins
- Saving a medical record automatically **completes** its appointment
- Users with appointments or records cannot be deleted (deactivate instead), which preserves medical history
- Public registration always creates a **patient**; doctors and admins are created by an admin
### 🎨 UI / UX
- Responsive layout with a **collapsible sidebar** and a mobile drawer
- Consistent design system with Tailwind CSS: cards, tables, badges, modals, confirm dialogs
- Toast notifications and clear validation messages
---
 
## 🧰 Tech Stack
 
| Layer | Technologies |
|---|---|
| **Backend** | FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic, python-jose (JWT), passlib + bcrypt |
| **Database** | PostgreSQL 16 (SQLite is used for tests) |
| **Frontend** | React, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide icons, date-fns, react-hot-toast |
| **DevOps** | Docker, Docker Compose, Nginx, GitHub Actions |
| **Testing** | pytest, FastAPI TestClient |
 
---
 
## 🏗️ Architecture
 
```mermaid
flowchart LR
    U[Browser<br/>React SPA] -->|HTTP /api| N[Nginx]
    N -->|proxy| B[FastAPI<br/>REST API]
    B -->|SQLAlchemy ORM| D[(PostgreSQL)]
    B -.->|JWT auth + RBAC| B
```
 
<details>
<summary><b>Database schema (ER diagram)</b></summary>
```mermaid
erDiagram
    USER ||--o| PATIENT : "has profile"
    USER ||--o| DOCTOR : "has profile"
    DEPARTMENT ||--o{ DOCTOR : contains
    PATIENT ||--o{ APPOINTMENT : books
    DOCTOR ||--o{ APPOINTMENT : receives
    APPOINTMENT ||--o| MEDICAL_RECORD : produces
    PATIENT ||--o{ MEDICAL_RECORD : owns
    DOCTOR ||--o{ MEDICAL_RECORD : writes
    MEDICAL_RECORD ||--o{ PRESCRIPTION : includes
    PATIENT ||--o{ LAB_REPORT : has
 
    USER { int id string name string email string role bool is_active }
    PATIENT { int id date dob string gender string blood_group }
    DOCTOR { int id string specialization string license_no float consultation_fee }
    APPOINTMENT { int id datetime appointment_date string status string reason }
    MEDICAL_RECORD { int id text diagnosis text treatment date follow_up_date }
    PRESCRIPTION { int id string medicine_name string dosage string frequency }
```
</details>
---
 
## 🚀 Getting Started
 
### Option 1: Docker (recommended)
 
```bash
git clone https://github.com/YOUR_USERNAME/healix.git
cd healix
 
cp .env.example .env              # edit the password and SECRET_KEY
docker compose up --build
 
# in another terminal: create the first admin account
docker compose exec backend python seed_admin.py
```
 
| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:8000 |
| Interactive API docs (Swagger) | http://localhost:8000/docs |
 
### Option 2: Run locally
 
**Prerequisites:** Python 3.12+, Node.js 20+, PostgreSQL 14+
 
**1. Create a database**
```sql
CREATE DATABASE healix_db;
```
 
**2. Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux
 
pip install -r requirements.txt
cp .env.example .env             # then set DATABASE_URL and SECRET_KEY
alembic upgrade head             # create the tables
python seed_admin.py             # create the admin user
uvicorn app.main:app --reload --port 8000
```
 
**3. Frontend**
```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173 (proxies /api to :8000)
```
 
---
 
## ⚙️ Configuration
 
Backend settings are read from `backend/.env` (see `backend/.env.example`).
 
| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/healix_db` |
| `SECRET_KEY` | JWT signing key, long and random | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `60` |
| `DEBUG` | Auto-create tables on startup (use `False` in production and rely on Alembic) | `True` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |
 
> Never commit your real `.env` file. It is listed in `.gitignore`.
 
---
 
## 📡 API Overview
 
Full interactive documentation is available at **`/docs`** (Swagger UI) and **`/redoc`**.
 
| Area | Endpoints | Access |
|---|---|---|
| **Auth** | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` | Public / authenticated |
| **Users** | `GET/POST /api/users` · `GET/PUT/DELETE /api/users/{id}` · `PATCH /api/users/{id}/toggle-active` | Admin (self for read/update) |
| **Patients** | `GET /api/patients` · `GET/PUT /api/patients/me` · `GET/PUT/DELETE /api/patients/{id}` | Admin, doctor, self |
| **Doctors** | `GET /api/doctors` · `GET/PUT /api/doctors/me` · `POST` · `PUT/DELETE /api/doctors/{id}` | All read, admin write |
| **Departments** | `GET/POST /api/departments` · `GET/PUT/DELETE /api/departments/{id}` | All read, admin write |
| **Appointments** | `GET/POST /api/appointments` · `GET/PUT/DELETE /api/appointments/{id}` | Role-filtered |
| **Medical Records** | `GET/POST /api/records` · `GET/PUT /api/records/{id}` | Doctor writes, patient reads own |
| **Reports** | `GET /api/reports/dashboard/{admin\|doctor\|patient}` · `/appointments/monthly` · `/appointments/by-department` · `/patients/statistics` | Role-specific |
 
Authentication uses a **Bearer JWT** header: `Authorization: Bearer <token>`.
 
---
 
## 🧪 Testing
 
The backend has **42 automated tests** covering authentication, role-based permissions, booking rules, medical records and user management. They run against a temporary SQLite database, so PostgreSQL is not required.
 
```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest -q
```
 
GitHub Actions runs the test suite, applies the migrations to a real PostgreSQL service and builds the frontend on every push and pull request.
 
---
 
## 🗄️ Database Migrations
 
Schema changes are managed with **Alembic**.
 
```bash
# after changing a model
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
 
# roll back one step
alembic downgrade -1
```
 
---
 
## 📁 Project Structure
 
```
healix/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, routers
│   │   ├── config.py            # Settings from environment
│   │   ├── database/            # Engine, session, Base
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # auth, users, patients, doctors, appointments, records, departments, reports
│   │   └── utils/auth.py        # JWT, password hashing, role guards
│   ├── migrations/              # Alembic migrations
│   ├── tests/                   # pytest suite
│   ├── seed_admin.py            # Creates / resets the admin account
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # common UI + layout (collapsible sidebar)
│   │   ├── context/             # AuthContext
│   │   ├── pages/               # admin / doctor / patient / auth pages
│   │   └── services/api.js      # Axios client and API helpers
│   ├── Dockerfile
│   └── nginx.conf
├── .github/workflows/ci.yml     # CI pipeline
├── docker-compose.yml
└── README.md
```
 
---
 
## 🔒 Security
 
- Passwords hashed with **bcrypt**; JWT access tokens with expiry
- **Role-based access control** and ownership checks on every endpoint, verified by tests
- Public registration cannot create privileged accounts
- Secrets come from environment variables and `.env` is git-ignored
- Input validation with Pydantic; SQL injection protection through the SQLAlchemy ORM
- Medical history is protected from accidental deletion
---
 
## 🗺️ Roadmap
 
- [x] Role-based authentication (admin / doctor / patient)
- [x] Appointment workflow with availability and conflict checks
- [x] Medical records and prescriptions
- [x] Analytics dashboard
- [x] Automated tests, Alembic migrations, Docker, CI
- [ ] Pagination on all list endpoints
- [ ] Login rate limiting
- [ ] Audit log for medical-record access
- [ ] Refresh tokens with httpOnly cookies
- [ ] Email notifications and password reset
- [ ] Lab report upload
- [ ] Live deployment
---
 
## 📄 License
 
Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
 
---
 
<div align="center">
 
If you find this project useful, consider giving it a ⭐
 
</div>
