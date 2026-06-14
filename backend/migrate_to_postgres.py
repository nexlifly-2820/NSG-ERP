import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
# Make sure all models are imported so they are registered in Base.metadata
from app import models

SQLITE_URL = "sqlite:///./sql_app.db"
# Ensure we use psycopg2 driver
POSTGRES_URL = "postgresql+psycopg2://postgres.orameusjachckqygskce:Hemanth%402820@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

def main():
    print("Starting Database Migration from SQLite to PostgreSQL...")
    
    # 1. Setup Engines
    sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    postgres_engine = create_engine(POSTGRES_URL)
    
    # 2. Create tables in PostgreSQL
    print("Dropping existing tables in PostgreSQL (if any)...")
    Base.metadata.drop_all(bind=postgres_engine)
    print("Creating tables in PostgreSQL...")
    Base.metadata.create_all(bind=postgres_engine)
    print("Tables created successfully.")
    
    
    from sqlalchemy import inspect, select
    
    # 3. Setup Sessions
    SqliteSession = sessionmaker(bind=sqlite_engine)
    PostgresSession = sessionmaker(bind=postgres_engine)
    
    sqlite_session = SqliteSession()
    postgres_session = PostgresSession()
    
    from sqlalchemy import text
    # Disable Foreign Key checks in Postgres to allow importing dirty data from SQLite
    postgres_session.execute(text("SET session_replication_role = 'replica';"))
    
    inspector = inspect(sqlite_engine)
    
    try:
        # Use Base.metadata.sorted_tables to get tables ordered by dependencies
        # This prevents Foreign Key constraint errors during insertion
        for table in Base.metadata.sorted_tables:
            print(f"Migrating table: {table.name}...")
            
            if not inspector.has_table(table.name):
                print(f"  - Table {table.name} does not exist in SQLite. Skipping.")
                continue
                
            actual_columns = [col['name'] for col in inspector.get_columns(table.name)]
            columns_to_select = [getattr(table.c, col) for col in actual_columns if hasattr(table.c, col)]
            
            if not columns_to_select:
                print(f"  - No valid columns found for {table.name}. Skipping.")
                continue
            
            stmt = select(*columns_to_select)
            rows = sqlite_session.execute(stmt).all()
            
            if not rows:
                print(f"  - No data found in {table.name}. Skipping.")
                continue
                
            # Convert rows to list of dictionaries
            insert_data = []
            # rows is a list of tuples corresponding to columns_to_select
            col_names = [col.name for col in columns_to_select]
            
            # Find missing columns that are required in postgres
            missing_required_cols = []
            for col in table.columns:
                if col.name not in col_names and not col.nullable and col.default is None and col.server_default is None:
                    if not col.primary_key:
                        missing_required_cols.append(col)
                        
            for row in rows:
                row_dict = {}
                for idx, col_name in enumerate(col_names):
                    row_dict[col_name] = row[idx]
                    
                # fill missing required columns with dummy data based on type
                for col in missing_required_cols:
                    col_type_str = str(col.type).upper()
                    if 'INT' in col_type_str or 'FLOAT' in col_type_str or 'NUMERIC' in col_type_str:
                        row_dict[col.name] = 0
                    elif 'BOOL' in col_type_str:
                        row_dict[col.name] = False
                    elif 'DATE' in col_type_str or 'TIME' in col_type_str:
                        row_dict[col.name] = None # Will still fail if not nullable, but might have server default
                    else:
                        row_dict[col.name] = "migrated_dummy"
                        
                insert_data.append(row_dict)
                
            # Insert into PostgreSQL
            postgres_session.execute(table.insert(), insert_data)
            
            print(f"  - Successfully migrated {len(insert_data)} rows into {table.name}.")
            
        print("Committing changes to PostgreSQL...")
        postgres_session.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        postgres_session.rollback()
    finally:
        sqlite_session.close()
        postgres_session.close()

if __name__ == "__main__":
    main()
