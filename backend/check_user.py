import os
from sqlalchemy import create_engine, text
import dotenv

dotenv.load_dotenv('.env')
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    res = conn.execute(text("SELECT id, email, role, is_active FROM users WHERE email='vivekchamanthla@gmail.com'"))
    print("VIVEK:", res.fetchall())
    res = conn.execute(text("SELECT id, email, role, is_active FROM users"))
    print("ALL:", res.fetchall())
