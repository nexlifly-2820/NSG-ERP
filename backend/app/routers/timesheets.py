from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

from app import models, database
from app.core import security

router = APIRouter(
    prefix="/timesheets",
    tags=["timesheets"]
)

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class DailyTimesheetCreate(BaseModel):
    date: date
    project: str
    task: str
    description: str
    hours: float = Field(..., gt=0, le=9)
    status: str = "draft"  # draft or pending

class DailyTimesheetUpdate(BaseModel):
    project: str
    task: str
    description: str
    hours: float = Field(..., gt=0, le=9)

class DailyTimesheetSubmitRequest(BaseModel):
    ids: List[int]

class TimesheetRejectRequest(BaseModel):
    comment: str

class DailyTimesheetResponse(BaseModel):
    id: int
    user_id: int
    manager_id: Optional[int]
    date: date
    project: str
    task: str
    description: str
    hours: float
    status: str
    rejection_comment: Optional[str]
    created_at: datetime
    employee_name: Optional[str] = None

    class Config:
        from_attributes = True

# Helper to verify manager/tl roles
def verify_manager_role(user: models.User):
    if user.role not in ["tl", "hr", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden. Higher privileges required."
        )

# ─── Helper: 9-Hour Limit Check ───────────────────────────────────────────────

def check_hours_limit(db: Session, user_id: int, log_date: date, new_hours: float, exclude_id: Optional[int] = None):
    query = db.query(func.sum(models.DailyTimesheet.hours)).filter(
        models.DailyTimesheet.user_id == user_id,
        models.DailyTimesheet.date == log_date
    )
    if exclude_id:
        query = query.filter(models.DailyTimesheet.id != exclude_id)
        
    existing_hours = query.scalar() or 0.0
    if existing_hours + new_hours > 9.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot log more than 9 hours per day. You already have {existing_hours} hours logged for {log_date}."
        )

# ─── Employee Endpoints ───────────────────────────────────────────────────────

@router.get("/my-timesheets", response_model=List[DailyTimesheetResponse])
def get_my_timesheets(
    year: Optional[int] = None,
    month: Optional[int] = None,
    week: Optional[int] = None,
    current_user: models.User = Depends(security.get_current_user), 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.DailyTimesheet).filter(models.DailyTimesheet.user_id == current_user.id)
    
    if year:
        import calendar
        if month:
            if week and 1 <= week <= 5:
                start_day = (week - 1) * 7 + 1
                _, last_day_of_month = calendar.monthrange(year, month)
                
                if start_day > last_day_of_month:
                    start_date = date(year, month, 1) # Fallback
                    end_date = date(year, month, last_day_of_month)
                else:
                    end_day = min(start_day + 6, last_day_of_month)
                    if week == 5:
                        end_day = last_day_of_month
                    start_date = date(year, month, start_day)
                    end_date = date(year, month, end_day)
            else:
                start_date = date(year, month, 1)
                _, last_day = calendar.monthrange(year, month)
                end_date = date(year, month, last_day)
        else:
            start_date = date(year, 1, 1)
            end_date = date(year, 12, 31)
        query = query.filter(models.DailyTimesheet.date >= start_date, models.DailyTimesheet.date <= end_date)
        
    timesheets = query.order_by(models.DailyTimesheet.date.desc(), models.DailyTimesheet.created_at.desc()).all()
    
    res = []
    for t in timesheets:
        r = DailyTimesheetResponse.model_validate(t)
        r.employee_name = current_user.name
        res.append(r)
    return res

@router.post("/", response_model=DailyTimesheetResponse, status_code=status.HTTP_201_CREATED)
def create_daily_timesheet(
    req: DailyTimesheetCreate, 
    current_user: models.User = Depends(security.get_current_user), 
    db: Session = Depends(database.get_db)
):
    check_hours_limit(db, current_user.id, req.date, req.hours)

    timesheet = models.DailyTimesheet(
        user_id=current_user.id,
        manager_id=current_user.manager_id,
        date=req.date,
        project=req.project,
        task=req.task,
        description=req.description,
        hours=req.hours,
        status=req.status if req.status in ['draft', 'pending'] else 'draft'
    )
    db.add(timesheet)
    db.commit()
    db.refresh(timesheet)
    
    res = DailyTimesheetResponse.model_validate(timesheet)
    res.employee_name = current_user.name
    return res

@router.put("/{id}", response_model=DailyTimesheetResponse)
def update_daily_timesheet(
    id: int, 
    req: DailyTimesheetUpdate, 
    current_user: models.User = Depends(security.get_current_user), 
    db: Session = Depends(database.get_db)
):
    timesheet = db.query(models.DailyTimesheet).filter(
        models.DailyTimesheet.id == id,
        models.DailyTimesheet.user_id == current_user.id
    ).first()

    if not timesheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found.")
        
    if timesheet.status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit timesheet because it is already approved."
        )

    check_hours_limit(db, current_user.id, timesheet.date, req.hours, exclude_id=id)

    timesheet.project = req.project
    timesheet.task = req.task
    timesheet.description = req.description
    timesheet.hours = req.hours
    
    db.commit()
    db.refresh(timesheet)
    res = DailyTimesheetResponse.model_validate(timesheet)
    res.employee_name = current_user.name
    return res

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_daily_timesheet(
    id: int, 
    current_user: models.User = Depends(security.get_current_user), 
    db: Session = Depends(database.get_db)
):
    timesheet = db.query(models.DailyTimesheet).filter(
        models.DailyTimesheet.id == id,
        models.DailyTimesheet.user_id == current_user.id
    ).first()

    if not timesheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found.")
        
    if timesheet.status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete timesheet because it is already approved."
        )

    db.delete(timesheet)
    db.commit()
    return None

@router.post("/submit", response_model=List[DailyTimesheetResponse])
def submit_timesheets(
    req: DailyTimesheetSubmitRequest, 
    current_user: models.User = Depends(security.get_current_user), 
    db: Session = Depends(database.get_db)
):
    timesheets = db.query(models.DailyTimesheet).filter(
        models.DailyTimesheet.id.in_(req.ids),
        models.DailyTimesheet.user_id == current_user.id
    ).all()

    if not timesheets:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No matching timesheets found.")

    res = []
    for ts in timesheets:
        if ts.status in ["draft", "rejected"]:
            ts.status = "pending"
            ts.manager_id = current_user.manager_id  # Update to latest manager just in case
            
    db.commit()
    
    for ts in timesheets:
        r = DailyTimesheetResponse.model_validate(ts)
        r.employee_name = current_user.name
        res.append(r)
        
    return res

# ─── Manager / TL Endpoints ───────────────────────────────────────────────────

@router.get("/pending", response_model=List[DailyTimesheetResponse])
def get_pending_timesheets(
    year: Optional[int] = None,
    month: Optional[int] = None,
    week: Optional[int] = None,
    employee_id: Optional[int] = None,
    current_user: models.User = Depends(security.get_current_user), 
    db: Session = Depends(database.get_db)
):
    verify_manager_role(current_user)
    
    query = db.query(models.DailyTimesheet, models.User).join(
        models.User, models.DailyTimesheet.user_id == models.User.id
    ).filter(
        models.DailyTimesheet.status == "pending"
    )

    if current_user.role == "tl":
        query = query.filter(models.DailyTimesheet.manager_id == current_user.id)
        
    if employee_id:
        query = query.filter(models.DailyTimesheet.user_id == employee_id)

    if year:
        import calendar
        if month:
            if week and 1 <= week <= 5:
                start_day = (week - 1) * 7 + 1
                _, last_day_of_month = calendar.monthrange(year, month)
                
                if start_day > last_day_of_month:
                    start_date = date(year, month, 1) # Fallback
                    end_date = date(year, month, last_day_of_month)
                else:
                    end_day = min(start_day + 6, last_day_of_month)
                    if week == 5:
                        end_day = last_day_of_month
                    start_date = date(year, month, start_day)
                    end_date = date(year, month, end_day)
            else:
                start_date = date(year, month, 1)
                _, last_day = calendar.monthrange(year, month)
                end_date = date(year, month, last_day)
        else:
            start_date = date(year, 1, 1)
            end_date = date(year, 12, 31)
        query = query.filter(models.DailyTimesheet.date >= start_date, models.DailyTimesheet.date <= end_date)
        
    results = query.order_by(models.DailyTimesheet.date.desc()).all()
    
    res = []
    for ts, user in results:
        r = DailyTimesheetResponse.model_validate(ts)
        r.employee_name = user.name
        res.append(r)
    return res

@router.post("/{id}/approve", response_model=DailyTimesheetResponse)
def approve_timesheet(
    id: int, 
    current_user: models.User = Depends(security.get_current_user), 
    db: Session = Depends(database.get_db)
):
    verify_manager_role(current_user)
    
    timesheet = db.query(models.DailyTimesheet).filter(models.DailyTimesheet.id == id).first()
    if not timesheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found.")
        
    if current_user.role == "tl" and timesheet.manager_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to approve this timesheet.")
        
    if timesheet.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Timesheet is {timesheet.status}, cannot be approved."
        )
        
    timesheet.status = "approved"
    timesheet.rejection_comment = None
    timesheet.manager_id = current_user.id
    
    # Notify employee
    notification = models.Notification(
        user_id=timesheet.user_id,
        message=f"Your timesheet for {timesheet.date} ({timesheet.task}) was approved.",
        type="success",
        read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(timesheet)
    return DailyTimesheetResponse.model_validate(timesheet)

@router.post("/{id}/reject", response_model=DailyTimesheetResponse)
def reject_timesheet(
    id: int, 
    req: TimesheetRejectRequest, 
    current_user: models.User = Depends(security.get_current_user), 
    db: Session = Depends(database.get_db)
):
    verify_manager_role(current_user)
    
    timesheet = db.query(models.DailyTimesheet).filter(models.DailyTimesheet.id == id).first()
    if not timesheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found.")
        
    if current_user.role == "tl" and timesheet.manager_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to reject this timesheet.")
        
    if timesheet.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Timesheet is {timesheet.status}, cannot be rejected."
        )
        
    timesheet.status = "rejected"
    timesheet.rejection_comment = req.comment
    timesheet.manager_id = current_user.id
    
    # Notify employee
    notification = models.Notification(
        user_id=timesheet.user_id,
        message=f"Your timesheet for {timesheet.date} ({timesheet.task}) was rejected. Reason: {req.comment}",
        type="danger",
        read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(timesheet)
    return DailyTimesheetResponse.model_validate(timesheet)
