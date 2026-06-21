import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print("Connecting to:", DATABASE_URL)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN plain_password VARCHAR;"))
        conn.commit()
        print("Column added to postgres successfully.")
    except Exception as e:
        print("Error (maybe already exists):", e)
