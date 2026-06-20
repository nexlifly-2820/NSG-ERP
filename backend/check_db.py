from app.database import SessionLocal
from app import models

db = SessionLocal()
tickets = db.query(models.SupportTicket).filter(models.SupportTicket.category == 'asset_request').all()
print("TICKETS:", len(tickets))
for t in tickets:
    print(t.id, t.title, t.description, t.status)
