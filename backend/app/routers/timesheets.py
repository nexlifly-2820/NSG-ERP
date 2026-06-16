from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

from app import models, database
from app.core import security

router = APIRouter(
    prefix="/timesheets",
    tags=["timesheets"]
)

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class TimesheetRowHours(BaseModel):
    Mon: float = 0.0
    Tue: float = 0.0
    Wed: float = 0.0
    Thu: float = 0.0
    Fri: float = 0.0

class TimesheetRowCreate(BaseModel):
    taskId: Optional[int] = None
    name: str
    sprint: str
    hours: TimesheetRowHours

class TimesheetSaveRequest(BaseModel):
    week_start_date: date
    rows: List[TimesheetRowCreate]

class TimesheetSubmitRequest(BaseModel):
    week_start_date: date

class TimesheetRejectRequest(BaseModel):
    comment: str

class TimesheetRowResponse(BaseModel):
    taskId: Optional[int] = None
    name: str
    sprint: str
    hours: TimesheetRowHours

class TimesheetResponse(BaseModel):
    id: int
    employee_id: int
    week_start_date: date
    status: str
    rejection_comment: str = ""
    rows: List[TimesheetRowResponse]

    class Config:
        from_attributes = True

# Helper to verify manager/tl roles
def verify_manager_role(user: models.User):
    if user.role not in ["tl", "hr", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden. Higher privileges required."
        )

# Helper mapper to output identical frontend format
def map_to_response(timesheet: models.Timesheet) -> TimesheetResponse:
    rows = []
    for r in timesheet.rows:
        rows.append(TimesheetRowResponse(
            taskId=r.task_id,
            name=r.name,
            sprint=r.sprint,
            hours=TimesheetRowHours(
                Mon=r.hours_mon,
                Tue=r.hours_tue,
                Wed=r.hours_wed,
                Thu=r.hours_thu,
                Fri=r.hours_fri
            )
        ))
    return TimesheetResponse(
        id=timesheet.id,
        employee_id=timesheet.user_id,
        week_start_date=timesheet.week_start_date,
        status=timesheet.status,
        rejection_comment=timesheet.rejection_comment or "",
        rows=rows
    )

# ─── Employee Endpoints ───────────────────────────────────────────────────────

@router.get("/my-timesheets", response_model=List[TimesheetResponse])
def get_my_timesheets(week_start_date: Optional[date] = None, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    query = db.query(models.Timesheet).filter(models.Timesheet.user_id == current_user.id)
    if week_start_date:
        query = query.filter(models.Timesheet.week_start_date == week_start_date)
    timesheets = query.order_by(models.Timesheet.week_start_date.desc()).all()
    return [map_to_response(t) for t in timesheets]

@router.post("/save", response_model=TimesheetResponse, status_code=status.HTTP_200_OK)
def save_timesheet_draft(req: TimesheetSaveRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    # Check if a timesheet already exists for this week
    timesheet = db.query(models.Timesheet).filter(
        models.Timesheet.user_id == current_user.id,
        models.Timesheet.week_start_date == req.week_start_date
    ).first()

    if timesheet:
        if timesheet.status in ["submitted", "approved"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Timesheet for week {req.week_start_date} is already {timesheet.status} and locked."
            )
        # Reset/recreate the row records
        db.query(models.TimesheetRow).filter(models.TimesheetRow.timesheet_id == timesheet.id).delete()
        timesheet.status = "draft"
        timesheet.rejection_comment = None
    else:
        timesheet = models.Timesheet(
            user_id=current_user.id,
            week_start_date=req.week_start_date,
            status="draft",
            rejection_comment=None
        )
        db.add(timesheet)
        db.flush() # flush to generate timesheet.id

    # Add the rows
    for r in req.rows:
        db_row = models.TimesheetRow(
            timesheet_id=timesheet.id,
            task_id=r.taskId,
            name=r.name,
            sprint=r.sprint,
            hours_mon=r.hours.Mon,
            hours_tue=r.hours.Tue,
            hours_wed=r.hours.Wed,
            hours_thu=r.hours.Thu,
            hours_fri=r.hours.Fri
        )
        db.add(db_row)

    db.commit()
    db.refresh(timesheet)
    return map_to_response(timesheet)

@router.post("/submit", response_model=TimesheetResponse)
def submit_timesheet(req: TimesheetSubmitRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    timesheet = db.query(models.Timesheet).filter(
        models.Timesheet.user_id == current_user.id,
        models.Timesheet.week_start_date == req.week_start_date
    ).first()

    if not timesheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No timesheet draft found for week {req.week_start_date}. Save a draft first."
        )

    if timesheet.status in ["submitted", "approved"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Timesheet is already {timesheet.status}."
        )

    # Validate that all days have some logged hours (e.g. check standard requirements if any)
    # We will enforce state locks here
    timesheet.status = "submitted"
    db.commit()
    db.refresh(timesheet)
    return map_to_response(timesheet)

# ─── Manager / TL Endpoints ───────────────────────────────────────────────────

@router.get("/pending", response_model=List[TimesheetResponse])
def get_pending_timesheets(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    if current_user.role == "tl":
        emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.manager_id == current_user.id).all()]
        if not emp_ids:
            return []
        timesheets = db.query(models.Timesheet).filter(
            models.Timesheet.status == "submitted",
            models.Timesheet.user_id.in_(emp_ids)
        ).order_by(models.Timesheet.week_start_date.desc()).all()
    else:
        timesheets = db.query(models.Timesheet).filter(
            models.Timesheet.status == "submitted"
        ).order_by(models.Timesheet.week_start_date.desc()).all()
    return [map_to_response(t) for t in timesheets]

@router.post("/{id}/approve", response_model=TimesheetResponse)
def approve_timesheet(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == id).first()
    if not timesheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet not found."
        )
        
    if timesheet.status != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Timesheet is in {timesheet.status} state, and cannot be approved."
        )
        
    timesheet.status = "approved"
    timesheet.rejection_comment = None
    
    # Notify employee of approval
    notification = models.Notification(
        user_id=timesheet.user_id,
        message=f"Your timesheet for week starting {timesheet.week_start_date} has been approved.",
        type="success",
        read=False
    )
    db.add(notification)
    
    db.commit()
    db.refresh(timesheet)
    return map_to_response(timesheet)

@router.post("/{id}/reject", response_model=TimesheetResponse)
def reject_timesheet(id: int, req: TimesheetRejectRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == id).first()
    if not timesheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timesheet not found."
        )
        
    if timesheet.status != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Timesheet is in {timesheet.status} state, and cannot be rejected."
        )
        
    timesheet.status = "rejected"
    timesheet.rejection_comment = req.comment
    
    # Notify employee of rejection
    notification = models.Notification(
        user_id=timesheet.user_id,
        message=f"Your timesheet for week starting {timesheet.week_start_date} was rejected. Reason: {req.comment}",
        type="danger",
        read=False
    )
    db.add(notification)
    
    db.commit()
    db.refresh(timesheet)
    return map_to_response(timesheet)
