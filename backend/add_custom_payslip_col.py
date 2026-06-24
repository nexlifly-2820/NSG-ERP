from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Database URL not found in .env")
    exit(1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE payslips ADD COLUMN custom_payslip_html TEXT;"))
        conn.commit()
        print("Successfully added custom_payslip_html column to payslips table.")
    except Exception as e:
        print(f"Error: {e}")
