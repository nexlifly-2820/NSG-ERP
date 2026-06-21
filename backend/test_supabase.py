import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+psycopg2://postgres.orameusjachckqygskce:Hemanth%402820@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

from datetime import date
today = date.today()

res = db.execute(text("SELECT id, name, status FROM users LIMIT 10"))
print("Users:")
for row in res:
    print(row)

res = db.execute(text(f"SELECT user_id, date, clock_in, clock_out, status, work_mode FROM attendance WHERE date = '{today}'"))
print("\nAttendance for today:", today)
for row in res:
    print(row)

db.close()
