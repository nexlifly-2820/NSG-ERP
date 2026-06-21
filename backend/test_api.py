from app.database import SessionLocal
from app import models
from app.core.security import create_access_token
import urllib.request
import json
from datetime import timedelta

db = SessionLocal()
u = db.query(models.User).filter(models.User.id == 17).first()
token = create_access_token(data={"sub": str(u.email)}, expires_delta=timedelta(minutes=60))

req = urllib.request.Request("http://127.0.0.1:8000/team-lead/team-members", headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for d in data:
            print(f"{d.get('name')}: presence_status={d.get('presence_status', 'MISSING_PRESENCE_STATUS')} - status={d.get('status')}")
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
