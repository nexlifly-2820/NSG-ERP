import json
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app import models

from app.database import engine, SessionLocal

db = SessionLocal()

users = db.query(models.User).all()
for u in users:
    if u.documents:
        try:
            parsed = json.loads(u.documents)
            if isinstance(parsed, list):
                new_docs = {
                    'docs_list': parsed,
                    'ctc': 300000.0,
                    'base_salary': 15625.0
                }
                u.documents = json.dumps(new_docs)
            elif isinstance(parsed, dict) and 'ctc' not in parsed:
                parsed['ctc'] = 300000.0
                parsed['base_salary'] = 15625.0
                u.documents = json.dumps(parsed)
        except Exception:
            pass
    else:
        new_docs = {
            'docs_list': [],
            'ctc': 300000.0,
            'base_salary': 15625.0
        }
        u.documents = json.dumps(new_docs)

db.commit()
print("Database CTC fixed successfully.")
