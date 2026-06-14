import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from sqlalchemy import create_engine, text
from app.config import settings

engine = create_engine(settings.DATABASE_URL)

try:
    with engine.connect() as conn:
        # Check if description column exists
        result = conn.execute(text("PRAGMA table_info(expense_claims)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'description' not in columns:
            print("Adding description column to expense_claims...")
            conn.execute(text("ALTER TABLE expense_claims ADD COLUMN description TEXT;"))
            print("Successfully added description column.")
        else:
            print("Column description already exists.")
            
except Exception as e:
    print(f"Error: {e}")
