from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN pan_number TEXT;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN pf_number TEXT;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN uan TEXT;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN esi_number TEXT;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN location TEXT;"))
            print("Users table updated.")
        except Exception as e:
            print(f"Users Error (might already exist): {e}")
            
        try:
            conn.execute(text("ALTER TABLE payslips ADD COLUMN worked_days FLOAT;"))
            conn.execute(text("ALTER TABLE payslips ADD COLUMN arrear_days FLOAT DEFAULT 0.0;"))
            conn.execute(text("ALTER TABLE payslips ADD COLUMN lop_days FLOAT DEFAULT 0.0;"))
            conn.execute(text("ALTER TABLE payslips ADD COLUMN lop_days_reversed FLOAT DEFAULT 0.0;"))
            print("Payslips table updated.")
        except Exception as e:
            print(f"Payslips Error (might already exist): {e}")

        conn.commit()
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
