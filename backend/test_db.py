from app.database import SessionLocal
from app import models

db = SessionLocal()
try:
    user = db.query(models.User).filter(models.User.email == "vivek1@hnms.com").first()
    ticket = models.SupportTicket(
        user_id=user.id,
        title="Laptop",
        description="kjdskljv",
        category="asset_request",
        priority="medium",
        status="open"
    )
    db.add(ticket)
    
    ceo_hr_users = db.query(models.User).filter(models.User.role.in_(["ceo", "hr"])).all()
    for u in ceo_hr_users:
        db.add(models.Notification(
            user_id=u.id,
            title="New Asset Request",
            message=f"{user.name} has requested a new asset (Laptop).",
            type="info"
        ))
    
    db.commit()
    print("SUCCESS")
except Exception as e:
    print("ERROR:", e)
