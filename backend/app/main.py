from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.config import settings
from app.database import engine, Base
from app.routers import auth, attendance, timesheets, employee_portal, team_lead, hr_portal, ceo_portal, resume_analyzer
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

# Auto-create tables for SQLite development.
# For production environments, database migrations (like Alembic) are recommended.
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Error creating database tables: {e}")

app = FastAPI(
    title="NSG-ERP API",
    description="Backend API for the NSG-ERP system",
    version="1.0.0"
)

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request, exc):
    print(f"Database Error: {exc}") # Log it internally
    return JSONResponse(
        status_code=500,
        content={"detail": "A secure database error occurred. Please try again later."},
    )

# Configure CORS (Cross-Origin Resource Sharing) to allow requests from the React frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(attendance.router)
app.include_router(timesheets.router)
app.include_router(employee_portal.router)
app.include_router(team_lead.router)
app.include_router(hr_portal.router)
app.include_router(ceo_portal.router)
app.include_router(resume_analyzer.router)

import os
# Ensure uploads directory exists before mounting
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the NSG-ERP Backend API",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)


