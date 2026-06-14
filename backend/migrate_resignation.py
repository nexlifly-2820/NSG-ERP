import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from sqlalchemy import create_engine, text
from app.config import settings

engine = create_engine(settings.DATABASE_URL)

try:
    with engine.connect() as conn:
        # Check existing columns
        result = conn.execute(text("PRAGMA table_info(resignations)"))
        columns = [row[1] for row in result.fetchall()]
        
        cols_to_add = {
            'early_relief_status': 'VARCHAR',
            'exit_checklist': 'TEXT'
        }
        
        for col_name, col_type in cols_to_add.items():
            if col_name not in columns:
                print(f"Adding {col_name} column to resignations...")
                conn.execute(text(f"ALTER TABLE resignations ADD COLUMN {col_name} {col_type};"))
                print(f"Successfully added {col_name} column.")
            else:
                print(f"Column {col_name} already exists.")
            
except Exception as e:
    print(f"Error: {e}")
