from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
from app.models import Base

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))
Base.metadata.create_all(bind=engine, tables=[Base.metadata.tables['global_templates']])
print("Table global_templates created successfully.")
