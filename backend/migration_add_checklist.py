from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def add_checklist_column():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE projects ADD COLUMN checklist TEXT;"))
            conn.commit()
            print("Migration successful: added checklist column to projects.")
        except Exception as e:
            if "duplicate column" in str(e) or "already exists" in str(e):
                print("Column checklist already exists.")
            else:
                print(f"Error: {e}")

if __name__ == "__main__":
    add_checklist_column()
