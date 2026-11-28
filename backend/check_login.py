"""
Diagnose why login fails. Run from the backend folder (next to `app/`):

    python check_login.py                      # checks admin@healix.com / Admin@123
    python check_login.py me@mail.com MyPass1  # check another account
"""
import json
import sys
import urllib.error
import urllib.request

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url

from app.config import settings

email = sys.argv[1] if len(sys.argv) > 1 else "admin@healix.com"
password = sys.argv[2] if len(sys.argv) > 2 else "Admin@123"
API = "http://127.0.0.1:8000"

problems = []


def ok(msg):
    print(f"  [ OK ]  {msg}")


def bad(msg, fix):
    print(f"  [FAIL]  {msg}\n          -> {fix}")
    problems.append(msg)


print("\n1) .env settings")
url_str = settings.DATABASE_URL
if not url_str:
    bad("DATABASE_URL is empty", "backend/.env is missing, misnamed (must be exactly '.env') or has no DATABASE_URL line")
elif "YOUR_PASSWORD" in url_str:
    bad("DATABASE_URL still has the placeholder YOUR_PASSWORD", "you overwrote .env with .env.example - put your real password back")
else:
    ok("DATABASE_URL = " + make_url(url_str).render_as_string(hide_password=True))
if settings.SECRET_KEY in ("", "change-me"):
    bad("SECRET_KEY is empty or the placeholder", "set a long random value in backend/.env")
else:
    ok(f"SECRET_KEY set ({len(settings.SECRET_KEY)} chars)")
print(f"  [info]  DEBUG = {settings.DEBUG}")

print("\n2) Database")
db_ok = False
try:
    engine = create_engine(url_str)
    with engine.connect() as c:
        c.execute(text("select 1"))
    ok("connected to the database")
    db_ok = True
except Exception as e:
    msg = str(e).splitlines()[0][:150]
    bad(f"cannot connect: {msg}", "check Postgres is running, the password, and that the database exists")

if db_ok:
    tables = set(inspect(engine).get_table_names())
    if "users" not in tables:
        bad("table 'users' does not exist (empty database)", "run:  python seed_admin.py")
    else:
        ok(f"tables present ({len(tables)})")
        from app.models.models import User
        from app.utils.auth import verify_password
        from sqlalchemy.orm import sessionmaker

        db = sessionmaker(bind=engine)()
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                bad(f"no user with email {email}", "run:  python seed_admin.py")
            else:
                ok(f"user found (role={user.role.value}, active={user.is_active})")
                if not user.is_active:
                    bad("user is deactivated", "run:  python seed_admin.py   (re-activates the admin)")
                if verify_password(password, user.hashed_password):
                    ok("password matches")
                else:
                    bad("password does NOT match", "run:  python seed_admin.py   (resets the admin password)")
        finally:
            db.close()

print("\n3) Backend server on port 8000")
try:
    with urllib.request.urlopen(API + "/health", timeout=4) as r:
        body = r.read().decode()
    if '"healthy"' in body:
        ok("Healix backend is answering on 127.0.0.1:8000")
    else:
        bad(f"something else is answering on port 8000: {body[:80]!r}",
            "another program holds the port - run: netstat -ano | findstr :8000  then taskkill /PID <pid> /F")
except Exception:
    bad("nothing is answering on 127.0.0.1:8000", "start it:  uvicorn app.main:app --reload --port 8000")

print("\n4) Real login request")
try:
    req = urllib.request.Request(
        API + "/api/auth/login",
        data=json.dumps({"email": email, "password": password}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=6) as r:
        data = json.loads(r.read().decode())
    ok(f"login works -> role={data.get('role')}")
except urllib.error.HTTPError as e:
    detail = e.read().decode()[:200].replace("\n", " ")
    bad(f"login returned HTTP {e.code}: {detail}",
        "500 = server/database error (see the uvicorn window); 401 = wrong credentials or another app on the port")
except Exception as e:
    bad(f"login request failed: {e}", "backend is not reachable")

print("\n" + ("ALL CHECKS PASSED - the backend is fine; if the browser still fails, hard-refresh (Ctrl+Shift+R) and check frontend/vite.config.js proxy or api.js baseURL." if not problems else f"{len(problems)} problem(s) found - fix the [FAIL] lines above, top to bottom."))