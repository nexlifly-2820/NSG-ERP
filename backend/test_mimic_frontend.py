from app.database import SessionLocal
from app.routers.hr_portal import add_employee, EmployeeCreateRequest
from app.models import User
from app.core import security
from datetime import timedelta
import requests

db = SessionLocal()
current_user = db.query(User).filter(User.role == "hr").first()
if not current_user:
    current_user = User(name="Test HR", role="hr", email="testhr2@example.com", hashed_password="pwd")
    db.add(current_user)
    db.commit()

token = security.create_access_token(data={"sub": current_user.email, "role": "hr"}, expires_delta=timedelta(minutes=30))

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

payload = {
    "name": "Hemanth User",
    "emp_id": None,
    "email": "hemanth@example.com",
    "department": "Engineering",
    "designation": "Dev",
    "status": "probation",
    "join_date": "2026-06-18",
    "photo": "https://images.unsplash.com/photo",
    "manager_id": None,
    "role": "employee",
    "shift_timing": "General Shift (09:00 AM - 06:00 PM) ( - )",
    "pf_number": "QWERTYU45454IOP",
    "uan": "4v5465ds4g642@@#",
    "esi_number": "lxbklmkln787873542sdjfkgjkl",
    "pan_number": "snfkldjklsjfdkg768768",
    "location": "hybnzkl",
    "bank_name": "slkklgjklfgs",
    "account_number": "787897987987987897",
    "ifsc_code": "4546546546",
    "bank_branch": "klflkbs"
}

resp = requests.post("http://127.0.0.1:8000/hr-portal/employees", json=payload, headers=headers)
print("Status:", resp.status_code)
print("Response:", resp.text)
