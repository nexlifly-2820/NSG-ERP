from app.database import SessionLocal
from app.routers.team_lead import get_team_members
from app import models

db = SessionLocal()

u = db.query(models.User).filter(models.User.name == 'Ananya Sharma').first()
print(f"Ananya Sharma's manager ID is: {u.manager_id}")

users = db.query(models.User).filter(models.User.manager_id == u.manager_id).all()
from datetime import date
today = date.today()
print("Today:", today)
for u in users:
    u.manager = "Test Manager"
    u.presence_status = "offline"
    leave = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.user_id == u.id,
        models.LeaveRequest.status == "approved",
        models.LeaveRequest.from_date <= today,
        models.LeaveRequest.to_date >= today
    ).first()
    
    if leave:
        if leave.leave_type == "WFH":
            u.presence_status = "wfh"
        else:
            u.presence_status = "on_leave"
    else:
        att = db.query(models.Attendance).filter(
            models.Attendance.user_id == u.id, 
            models.Attendance.date == today
        ).first()
        if att:
            if att.work_mode == "wfh":
                u.presence_status = "wfh"
            elif att.status == "leave":
                u.presence_status = "on_leave"
            elif att.status == "absent":
                u.presence_status = "absent"
            elif att.clock_out is not None:
                u.presence_status = "offline"
            else:
                u.presence_status = "online"

for u in users:
    print(f"User {u.name}: presence_status={getattr(u, 'presence_status', 'NOT_SET')}")

from app.routers.team_lead import UserProfileResponse
res = [UserProfileResponse.model_validate(u).model_dump() for u in users]
for r in res:
    print(f"{r['name']}: {r['presence_status']}")
db.close()
