import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app import models
from app.routers.hr_portal import approve_resignation

db_url = os.getenv('DATABASE_URL')
if not db_url:
    db_url = 'postgresql+psycopg2://postgres.orameusjachckqygskce:Hemanth%402820@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

ceo_user = db.query(models.User).filter(models.User.id == 1).first()
print("CEO User:", ceo_user.name, ceo_user.role)

try:
    result = approve_resignation(id=12, current_user=ceo_user, db=db)
    print("Result:", result)
except Exception as e:
    print("Error:", repr(e))

