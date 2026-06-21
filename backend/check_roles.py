import os
from sqlalchemy import create_engine
from sqlalchemy import text

db_url = os.getenv('DATABASE_URL')
if not db_url:
    db_url = 'postgresql+psycopg2://postgres.orameusjachckqygskce:Hemanth%402820@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'

engine = create_engine(db_url)
with engine.begin() as conn:
    res = conn.execute(text("SELECT id, name, role FROM users LIMIT 10")).fetchall()
    print(res)
