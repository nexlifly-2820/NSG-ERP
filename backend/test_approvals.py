from app.database import SessionLocal
from app.routers.ceo_portal import get_all_approvals
from app import models

db = SessionLocal()
class MockUser:
    id = 1
    name = "CEO"
    email = "ceo@hnms.com"
    role = "ceo"

try:
    res = get_all_approvals(current_user=MockUser(), db=db)
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
