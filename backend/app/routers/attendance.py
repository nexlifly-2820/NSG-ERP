from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timezone, timedelta

from app import models, database
from app.core import security

router = APIRouter(
    prefix="/attendance",
    tags=["attendance"]
)

# Standard IST timezone offset for local business logic calculations (+05:30)
IST = timezone(timedelta(hours=5, minutes=30))

# Pydantic schemas
class ClockInRequest(BaseModel):
    work_mode: str = "office"  # office, wfh
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class GeofenceSettingsUpdate(BaseModel):
    enabled: bool
    latitude: float
    longitude: float
    radius: float

class ClockOutResponse(BaseModel):
    id: int
    user_id: int
    date: date
    clock_in: Optional[datetime]
    clock_out: Optional[datetime]
    status: str
    work_mode: str
    is_late: bool
    exception_flag: str
    total_hours: Optional[float]

    class Config:
        from_attributes = True

class AttendanceLogResponse(BaseModel):
    id: int
    user_id: int
    date: date
    clock_in: Optional[datetime]
    clock_out: Optional[datetime]
    status: str
    work_mode: str
    is_late: bool
    exception_flag: str
    total_hours: Optional[float]

    class Config:
        from_attributes = True

class CorrectionCreate(BaseModel):
    correction_date: date
    requested_clock_in: datetime
    requested_clock_out: datetime
    reason: str

class CorrectionResponse(BaseModel):
    id: int
    user_id: int
    correction_date: date
    requested_clock_in: datetime
    requested_clock_out: datetime
    reason: str
    status: str

    class Config:
        from_attributes = True

class DenyRequest(BaseModel):
    comment: str

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    timestamp: datetime
    type: str
    read: bool

    class Config:
        from_attributes = True

class ManualNotificationCreate(BaseModel):
    employee_id: int
    message: str
    type: str = "warning"  # warning, success, danger, info

# Helper function to check for manager roles
def verify_manager_role(user: models.User):
    if user.role not in ["tl", "hr", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden. Higher privileges required."
        )

# ─── Employee Endpoints ───────────────────────────────────────────────────────

import math

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

@router.post("/clock-in", response_model=AttendanceLogResponse, status_code=status.HTTP_201_CREATED)
def clock_in(req: ClockInRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    local_now = datetime.now(IST)
    today = local_now.date()
    
    # Check if a log exists for today
    existing_log = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id,
        models.Attendance.date == today
    ).first()
    
    if existing_log:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already clocked in today."
        )
    
    # Validate location if geofencing is enabled and mode is office
    if req.work_mode == "office":
        enabled_s = db.query(models.SystemSetting).filter(models.SystemSetting.key == "geofence_enabled").first()
        geofence_enabled = enabled_s.value.lower() == "true" if enabled_s else True
        
        if geofence_enabled:
            if req.latitude is None or req.longitude is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coordinates are required for Office clock-in validation."
                )
            
            lat_s = db.query(models.SystemSetting).filter(models.SystemSetting.key == "office_latitude").first()
            lng_s = db.query(models.SystemSetting).filter(models.SystemSetting.key == "office_longitude").first()
            rad_s = db.query(models.SystemSetting).filter(models.SystemSetting.key == "allowed_radius").first()
            
            office_lat = float(lat_s.value) if lat_s else 12.9716
            office_lng = float(lng_s.value) if lng_s else 77.5946
            allowed_radius = float(rad_s.value) if rad_s else 100.0
            
            distance = calculate_haversine_distance(req.latitude, req.longitude, office_lat, office_lng)
            if distance > allowed_radius:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Outside office perimeter. Current distance: {distance:.0f}m, Allowed: {allowed_radius:.0f}m."
                )

    # Calculate lateness (threshold: clock-in after 09:30 AM local time)
    is_late = local_now.hour > 9 or (local_now.hour == 9 and local_now.minute > 30)
    attendance_status = "late" if is_late else "present"
    
    new_log = models.Attendance(
        user_id=current_user.id,
        date=today,
        clock_in=local_now,
        clock_out=None,
        status=attendance_status,
        work_mode=req.work_mode,
        is_late=is_late,
        exception_flag="none",
        total_hours=None
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.post("/clock-out", response_model=AttendanceLogResponse)
def clock_out(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    local_now = datetime.now(IST)
    today = local_now.date()
    
    # Retrieve today's clock-in record
    log = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id,
        models.Attendance.date == today
    ).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active clock-in session found for today."
        )
        
    if log.clock_out is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already clocked out today."
        )
        
    log.clock_out = local_now
    
    # Calculate elapsed hours
    start_time = log.clock_in.replace(tzinfo=local_now.tzinfo) if log.clock_in.tzinfo is None else log.clock_in
    elapsed_time = local_now - start_time
    hours_worked = elapsed_time.total_seconds() / 3600.0
    log.total_hours = round(hours_worked, 2)
    
    # Update status if hours are very low (e.g. less than 4 hours is half-day)
    if hours_worked < 4.0:
        log.status = "half-day"
        
    db.commit()
    db.refresh(log)
    return log

@router.get("/my-logs", response_model=List[AttendanceLogResponse])
def get_my_logs(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id
    ).order_by(models.Attendance.date.desc()).all()

@router.post("/correction", response_model=CorrectionResponse, status_code=status.HTTP_201_CREATED)
def request_correction(req: CorrectionCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    # Verify requested clock-out is after clock-in
    if req.requested_clock_out <= req.requested_clock_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clock-out time must be after clock-in time."
        )
        
    # Check if a pending correction request already exists for this date
    existing_corr = db.query(models.AttendanceCorrection).filter(
        models.AttendanceCorrection.user_id == current_user.id,
        models.AttendanceCorrection.correction_date == req.correction_date,
        models.AttendanceCorrection.status == "pending"
    ).first()
    
    if existing_corr:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A pending correction request already exists for {req.correction_date}."
        )
        
    new_corr = models.AttendanceCorrection(
        user_id=current_user.id,
        correction_date=req.correction_date,
        requested_clock_in=req.requested_clock_in,
        requested_clock_out=req.requested_clock_out,
        reason=req.reason,
        status="pending"
    )
    db.add(new_corr)
    db.commit()
    db.refresh(new_corr)
    return new_corr

@router.get("/my-corrections", response_model=List[CorrectionResponse])
def get_my_corrections(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.AttendanceCorrection).filter(
        models.AttendanceCorrection.user_id == current_user.id
    ).order_by(models.AttendanceCorrection.correction_date.desc()).all()

@router.get("/my-notifications", response_model=List[NotificationResponse])
def get_my_notifications(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.timestamp.desc()).all()

@router.post("/my-notifications/{id}/read")
def mark_notification_read(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    notification = db.query(models.Notification).filter(
        models.Notification.id == id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )
        
    notification.read = True
    db.commit()
    return {"status": "success", "message": "Notification marked as read."}

# ─── HR & Team Lead Endpoints ─────────────────────────────────────────────────

@router.get("/all-logs", response_model=List[AttendanceLogResponse])
def get_all_logs(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    return db.query(models.Attendance).order_by(models.Attendance.date.desc()).all()

@router.get("/corrections", response_model=List[CorrectionResponse])
def get_all_pending_corrections(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    return db.query(models.AttendanceCorrection).filter(
        models.AttendanceCorrection.status == "pending"
    ).order_by(models.AttendanceCorrection.correction_date.desc()).all()

@router.post("/corrections/{id}/approve")
def approve_correction(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    
    corr = db.query(models.AttendanceCorrection).filter(
        models.AttendanceCorrection.id == id
    ).first()
    
    if not corr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Correction request not found."
        )
        
    if corr.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Correction request is already {corr.status}."
        )
        
    # Mark correction as approved
    corr.status = "approved"
    
    # Check if an attendance log already exists for this user and date
    log = db.query(models.Attendance).filter(
        models.Attendance.user_id == corr.user_id,
        models.Attendance.date == corr.correction_date
    ).first()
    
    elapsed = corr.requested_clock_out - corr.requested_clock_in
    hours_worked = round(elapsed.total_seconds() / 3600.0, 2)
    
    if log:
        # Update existing log
        log.clock_in = corr.requested_clock_in
        log.clock_out = corr.requested_clock_out
        log.total_hours = hours_worked
        log.status = "present" if hours_worked >= 4.0 else "half-day"
        log.work_mode = "office"
        log.is_late = False
        log.exception_flag = "none"
    else:
        # Create a new log
        log = models.Attendance(
            user_id=corr.user_id,
            date=corr.correction_date,
            clock_in=corr.requested_clock_in,
            clock_out=corr.requested_clock_out,
            status="present" if hours_worked >= 4.0 else "half-day",
            total_hours=hours_worked,
            work_mode="office",
            is_late=False,
            exception_flag="none"
        )
        db.add(log)
        
    # Create notification for employee
    notification = models.Notification(
        user_id=corr.user_id,
        message=f"Your regularization request for {corr.correction_date} has been approved.",
        type="success",
        read=False
    )
    db.add(notification)
    db.commit()
    return {"status": "success", "message": "Correction request approved and attendance log updated."}

@router.post("/corrections/{id}/deny")
def deny_correction(id: int, req: DenyRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    
    corr = db.query(models.AttendanceCorrection).filter(
        models.AttendanceCorrection.id == id
    ).first()
    
    if not corr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Correction request not found."
        )
        
    if corr.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Correction request is already {corr.status}."
        )
        
    corr.status = "denied"
    
    # Create notification for employee
    notification = models.Notification(
        user_id=corr.user_id,
        message=f"Your regularization request for {corr.correction_date} has been denied. Reason: {req.comment}",
        type="danger",
        read=False
    )
    db.add(notification)
    db.commit()
    return {"status": "success", "message": "Correction request denied."}

@router.post("/notify", status_code=status.HTTP_201_CREATED)
def trigger_notification(req: ManualNotificationCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    
    # Verify employee exists
    emp = db.query(models.User).filter(models.User.id == req.employee_id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found."
        )
        
    notification = models.Notification(
        user_id=req.employee_id,
        message=req.message,
        type=req.type,
        read=False
    )
    db.add(notification)
    db.commit()
    return {"status": "success", "message": f"Notification sent to employee {emp.name}."}


# ─── Geofencing Configuration Endpoints ──────────────────────────────────────────

@router.get("/geofence-settings")
def get_geofence_settings(db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    enabled_s = db.query(models.SystemSetting).filter(models.SystemSetting.key == "geofence_enabled").first()
    lat_s = db.query(models.SystemSetting).filter(models.SystemSetting.key == "office_latitude").first()
    lng_s = db.query(models.SystemSetting).filter(models.SystemSetting.key == "office_longitude").first()
    rad_s = db.query(models.SystemSetting).filter(models.SystemSetting.key == "allowed_radius").first()

    return {
        "enabled": enabled_s.value.lower() == "true" if enabled_s else True,
        "latitude": float(lat_s.value) if lat_s else 12.9716,
        "longitude": float(lng_s.value) if lng_s else 77.5946,
        "radius": float(rad_s.value) if rad_s else 100.0
    }

@router.post("/geofence-settings")
def update_geofence_settings(req: GeofenceSettingsUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_manager_role(current_user)
    
    def set_key(key: str, val: str):
        setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
        if setting:
            setting.value = val
        else:
            db.add(models.SystemSetting(key=key, value=val))

    set_key("geofence_enabled", str(req.enabled).lower())
    set_key("office_latitude", str(req.latitude))
    set_key("office_longitude", str(req.longitude))
    set_key("allowed_radius", str(req.radius))
    
    db.commit()
    return {"status": "success", "message": "Geofencing settings updated successfully."}
