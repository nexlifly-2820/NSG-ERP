from app.routers.hr_portal import EmployeeCreateResponse, EmployeeResponse
from app.database import SessionLocal
from app.models import User

db = SessionLocal()
db_emp = db.query(User).filter_by(email="testnew2@example.com").first()

try:
    resp = EmployeeCreateResponse(employee=EmployeeResponse.model_validate(db_emp))
    print("Serialization Success")
except Exception as e:
    import traceback
    traceback.print_exc()
