import os
from sqlalchemy import create_engine, text
import dotenv
import bcrypt

dotenv.load_dotenv('.env')
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    salt = bcrypt.gensalt()
    hashed_pw = bcrypt.hashpw(b"erp123", salt).decode('utf-8')
    
    # Update all users where role is not ceo
    result = conn.execute(text(f"UPDATE users SET hashed_password='{hashed_pw}' WHERE role != 'ceo'"))
    conn.commit()
    print(f"Password updated successfully for {result.rowcount} users (skipped CEOs).")
