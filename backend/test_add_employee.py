import requests
import sys

# To get token, we can import from backend
from app.core.security import create_access_token
from datetime import timedelta

token = create_access_token(data={"sub": "admin", "role": "hr"}, expires_delta=timedelta(minutes=30))
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

payload = {
    "name": "Test User",
    "email": "testnew@example.com",
    "department": "Engineering",
    "designation": "Dev",
    "join_date": "2026-06-18",
    "shift_timing": "General Shift"
}

resp = requests.post("http://127.0.0.1:8000/hr-portal/employees", json=payload, headers=headers)
print("Status:", resp.status_code)
print("Response:", resp.text)
