import requests

token_res = requests.post("http://127.0.0.1:8000/auth/login", data={"username": "vivek1@hnms.com", "password": "password"})
token = token_res.json()["access_token"]

res = requests.post("http://127.0.0.1:8000/api/employee-portal/assets/request", json={
    "asset_type": "Laptop",
    "reason": "kjdskljv",
    "urgency": "Medium"
}, headers={"Authorization": f"Bearer {token}"})

print(res.status_code)
print(res.json())
from app.database import SessionLocal
from app import models
from app.core.security import create_access_token
import urllib.request
import json
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import timedelta
import requests

try:
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        db_url = 'postgresql+psycopg2://postgres.orameusjachckqygskce:Hemanth%402820@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)

    from app import security
    token = security.create_access_token({"sub": "1"})
    print("Token:", token)
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post("http://localhost:8000/api/hr-portal/exits/resignations/12/approve", headers=headers)
    print("Response:", res.status_code, res.text)
except Exception as e:
    pass

try:
    db = SessionLocal()
    u = db.query(models.User).filter(models.User.id == 17).first()
    if u:
        token = create_access_token(data={"sub": str(u.email)}, expires_delta=timedelta(minutes=60))

        req = urllib.request.Request("http://127.0.0.1:8000/team-lead/team-members", headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            for d in data:
                print(f"{d.get('name')}: presence_status={d.get('presence_status', 'MISSING_PRESENCE_STATUS')} - status={d.get('status')}")
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
