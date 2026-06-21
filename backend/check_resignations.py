import os
from sqlalchemy import create_engine, text
import dotenv

dotenv.load_dotenv('.env')
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    res = conn.execute(text("SELECT id, user_id, status FROM resignations"))
    print("Resignations:", res.fetchall())
    
    users = conn.execute(text("SELECT id, name, email FROM users"))
    print("Users:", users.fetchall())
