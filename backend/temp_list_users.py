import os
from dotenv import load_dotenv
load_dotenv('.env')

from app.database import SessionLocal
from app.models import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id}, Name: {u.name}, Role: {u.role}, Manager ID: {u.manager_id}, Status: {u.status}, Is Active: {u.is_active}")
db.close()
