from app.database import SessionLocal
from app.routers.hr_portal import add_employee, EmployeeCreateRequest
from app.models import User
from datetime import date

db = SessionLocal()
# Mock user
current_user = db.query(User).filter(User.role == "hr").first()
if not current_user:
    current_user = User(name="Test HR", role="hr")

req = EmployeeCreateRequest(
    name="Test User",
    email="testnew2@example.com",
    department="Engineering",
    designation="Dev",
    join_date=date(2026, 6, 18),
    shift_timing="General Shift"
)

try:
    resp = add_employee(req, current_user=current_user, db=db)
    print("Success:", resp)
except Exception as e:
    import traceback
    traceback.print_exc()
