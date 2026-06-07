import sys
sys.path.append("c:\\Users\\DELL\\Desktop\\NSG-ERP\\backend")

from app.database import engine, Base
from app.models import Project
from sqlalchemy.orm import Session

# Create table
Project.__table__.create(bind=engine, checkfirst=True)

# Add mock projects
session = Session(bind=engine)
if session.query(Project).count() == 0:
    p1 = Project(name="Project Alpha", client="Acme Corp", budget=50000.0, used=15000.0, status="Active", deadline="2026-12-31")
    p2 = Project(name="Project Beta", client="Globex", budget=100000.0, used=95000.0, status="Active", deadline="2026-08-15")
    session.add(p1)
    session.add(p2)
    session.commit()
    print("Projects added.")
else:
    print("Projects already exist.")
