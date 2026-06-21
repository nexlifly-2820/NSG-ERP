import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

from app import models
from app.core import security
from datetime import date
import json

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    cand = db.query(models.Candidate).filter(models.Candidate.id == 1).first()
    if not cand:
        print("Candidate not found")
        exit()
        
    print(f"Candidate: {cand.name}, email: {cand.email}")
    
    cand.stage = "joined"
    
    max_serial = 100
    for u in db.query(models.User).all():
        if u.emp_id and u.emp_id.startswith("NSG-0"):
            try:
                num = int(u.emp_id.split("-0")[-1])
                if num > max_serial:
                    max_serial = num
            except ValueError:
                pass
    emp_id = f"NSG-0{max_serial + 1}"
    print("New Emp ID:", emp_id)
    
    today = date.today()
    probation_end = date.fromordinal(today.toordinal() + 30)
    
    offer = db.query(models.JobOffer).filter(models.JobOffer.candidate_id == cand.id).first()
    init_ctc = offer.gross_ctc if offer else 300000.0
    init_base = offer.basic_pay if offer else 15625.0
    
    initial_docs_dict = {
        "docs_list": [],
        "ctc": init_ctc,
        "base_salary": init_base
    }
    
    default_pwd_plain = f"{cand.name.replace(' ', '')}@123"
    default_pwd = security.hash_password(default_pwd_plain)
    
    db_emp = models.User(
        name=cand.name,
        email=cand.email,
        hashed_password=default_pwd,
        plain_password=default_pwd_plain,
        role="employee",
        department="Engineering",
        designation=cand.role,
        status="probation",
        emp_id=emp_id,
        phone=cand.phone,
        join_date=today,
        probation_end_date=probation_end,
        bank_name=None,
        account_number=None,
        ifsc_code=None,
        grade=3,
        manager="John Doe",
        photo="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80",
        documents=json.dumps(initial_docs_dict)
    )
    db.add(db_emp)
    db.flush()
    print("Successfully flushed User")
except Exception as e:
    print("EXCEPTION CAUGHT:")
    import traceback
    traceback.print_exc()
finally:
    db.close()
