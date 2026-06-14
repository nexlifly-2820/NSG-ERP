import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load the env vars
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL is not set.")
    sys.exit(1)

print(f"Connecting to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    from sqlalchemy import text
    result = session.execute(text("SELECT 1"))
    print("Database connection successful!")
except Exception as e:
    print(f"Database connection failed: {e}")
