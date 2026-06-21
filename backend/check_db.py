import os
from sqlalchemy import create_engine
from sqlalchemy import text
from app.database import SessionLocal
from app import models

try:
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        db_url = 'postgresql+psycopg2://postgres.orameusjachckqygskce:Hemanth%402820@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'

    engine = create_engine(db_url)
    with engine.begin() as conn:
        res = conn.execute(text("SELECT id, status, ceo_status FROM resignations")).fetchall()
        print("Resignations:", res)
except Exception as e:
    pass

try:
    db = SessionLocal()
    tickets = db.query(models.SupportTicket).filter(models.SupportTicket.category == 'asset_request').all()
    print("TICKETS:", len(tickets))
    for t in tickets:
        print(t.id, t.title, t.description, t.status)
except Exception as e:
    pass
