from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any, TypeVar, Generic
from pydantic import BaseModel, field_validator
import os
import uuid
import shutil

T = TypeVar('T')
class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int
    limit: int
from datetime import date, datetime
import json
import io
import csv
from fastapi.responses import StreamingResponse

from app import models, database
from app.core import security

router = APIRouter(
    prefix="/employee-portal",
    tags=["employee-portal"]
)

class UserPublicResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/users", response_model=List[UserPublicResponse])
def get_all_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.User).filter(models.User.is_active == True).all()

# ─── 1. TASKS SCHEMAS & ROUTES ────────────────────────────────────────────────
class AnnouncementResponse(BaseModel):
    id: int
    title: str
    body: str
    priority: str
    audience: str
    author: str
    date: str # derived from created_at

    class Config:
        from_attributes = True

@router.get("/announcements", response_model=PaginatedResponse[AnnouncementResponse])
def get_announcements(skip: int = 0, limit: int = 50, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    total = db.query(models.Announcement).count()
    anns = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).offset(skip).limit(limit).all()
    res = []
    for a in anns:
        res.append(AnnouncementResponse(
            id=a.id,
            title=a.title,
            body=a.body,
            priority=a.priority,
            audience=a.audience,
            author=a.author,
            date=a.created_at.strftime("%Y-%m-%d") if a.created_at else "N/A"
        ))
    return {"items": res, "total": total, "skip": skip, "limit": limit}

@router.post("/announcements/{id}/read")
def mark_announcement_read(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    ann = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    already_read = db.query(models.AnnouncementRead).filter(
        models.AnnouncementRead.announcement_id == id,
        models.AnnouncementRead.user_id == current_user.id
    ).first()
    
    if not already_read:
        # Create read record
        new_read = models.AnnouncementRead(announcement_id=id, user_id=current_user.id)
        db.add(new_read)
        
        # Update aggregate counts
        total_users = db.query(models.User).filter(models.User.is_active == True).count() or 1
        ann.read_count += 1
        ann.read_pct = round((ann.read_count / total_users) * 100, 1)
        
        db.commit()
    
    return {"status": "success"}

# ─── 1.5 TASKS SCHEMAS & ROUTES ────────────────────────────────────────────────

class SubtaskResponse(BaseModel):
    id: int
    title: str
    done: bool

    class Config:
        from_attributes = True

class TaskAttachmentRequest(BaseModel):
    filename: str
    file_url: str

class TaskAttachmentResponse(BaseModel):
    id: int
    filename: str
    file_url: str

    class Config:
        from_attributes = True

class TaskResponse(BaseModel):
    id: int
    project: str
    sprint: str
    title: str
    description: Optional[str]
    priority: str
    status: str
    sp: int
    due: Optional[date]
    prStatus: Optional[str] = None
    prUrl: Optional[str] = None
    rejectedReason: Optional[str] = None
    customData: Optional[str] = None
    subtasks: List[SubtaskResponse]
    acceptance: Optional[List[str]] = []
    attachments: List[TaskAttachmentResponse] = []

    @field_validator('acceptance', mode='before')
    @classmethod
    def parse_acceptance(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

    class Config:
        from_attributes = True

class PRSubmitRequest(BaseModel):
    prUrl: str

@router.get("/tasks/my-tasks", response_model=PaginatedResponse[TaskResponse])
def get_my_tasks(skip: int = 0, limit: int = 100, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    query = db.query(models.Task).filter(models.Task.user_id == current_user.id)
    total = query.count()
    tasks = query.offset(skip).limit(limit).all()
    # Map fields to match camelCase expected by the React frontend
    resp_tasks = []
    for t in tasks:
        resp_tasks.append(TaskResponse(
            id=t.id,
            project=t.project,
            sprint=t.sprint,
            title=t.title,
            description=t.description,
            priority=t.priority,
            status=t.status,
            sp=t.sp,
            due=t.due,
            prStatus=t.pr_status,
            prUrl=t.pr_url,
            rejectedReason=t.rejected_reason,
            customData=t.custom_data,
            acceptance=t.acceptance,
            subtasks=[SubtaskResponse(id=st.id, title=st.title, done=st.done) for st in t.subtasks],
            attachments=[TaskAttachmentResponse(id=att.id, filename=att.filename, file_url=att.file_url) for att in t.attachments]
        ))
    return {"items": resp_tasks, "total": total, "skip": skip, "limit": limit}

@router.post("/tasks/{id}/subtasks/{subtask_id}/toggle", response_model=SubtaskResponse)
def toggle_subtask(id: int, subtask_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    # Verify task belongs to current user
    task = db.query(models.Task).filter(models.Task.id == id, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    
    subtask = db.query(models.TaskSubtask).filter(models.TaskSubtask.id == subtask_id, models.TaskSubtask.task_id == id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found.")
        
    subtask.done = not subtask.done
    db.commit()
    db.refresh(subtask)
    return subtask

@router.post("/tasks/{id}/submit-pr", response_model=TaskResponse)
def submit_pr(id: int, req: PRSubmitRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == id, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    task.pr_status = "submitted"
    task.pr_url = req.prUrl
    task.status = "pr"  # Keep task visible as PR status; 'done' only set after TL approves
    db.commit()
    db.refresh(task)
    return TaskResponse(
        id=task.id,
        project=task.project,
        sprint=task.sprint,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        sp=task.sp,
        due=task.due,
        prStatus=task.pr_status,
        prUrl=task.pr_url,
        rejectedReason=task.rejected_reason,
        customData=task.custom_data,
        acceptance=task.acceptance,
        subtasks=[SubtaskResponse(id=st.id, title=st.title, done=st.done) for st in task.subtasks],
        attachments=[TaskAttachmentResponse(id=att.id, filename=att.filename, file_url=att.file_url) for att in task.attachments]
    )

@router.get("/tasks/schema")
def get_task_schema(department: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    user_dept = department if department else (current_user.department if current_user.department else "IT")
    
    schema_record = db.query(models.DepartmentSchema).filter(models.DepartmentSchema.department == user_dept).first()
    
    if schema_record:
        import json
        try:
            schema_data = json.loads(schema_record.schema_json)
        except Exception:
            schema_data = []
    else:
        schema_data = [{"name": "notes", "type": "text", "label": "Additional Notes"}]
        
    return {"department": user_dept, "schema": schema_data}

class TaskStatusUpdateRequest(BaseModel):
    status: str
    custom_data: Optional[str] = None

@router.patch("/tasks/{task_id}/status", response_model=TaskResponse)
def update_task_status(task_id: int, req: TaskStatusUpdateRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or does not belong to you.")
    task.status = req.status
    if req.custom_data is not None:
        task.custom_data = req.custom_data
    db.commit()
    db.refresh(task)
    return TaskResponse(
        id=task.id,
        project=task.project,
        sprint=task.sprint,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        sp=task.sp,
        due=task.due,
        prStatus=task.pr_status,
        prUrl=task.pr_url,
        rejectedReason=task.rejected_reason,
        customData=task.custom_data,
        acceptance=task.acceptance,
        subtasks=[SubtaskResponse(id=st.id, title=st.title, done=st.done) for st in task.subtasks],
        attachments=[TaskAttachmentResponse(id=att.id, filename=att.filename, file_url=att.file_url) for att in task.attachments]
    )

# ─── 2. LEAVE SCHEMAS & ROUTES ────────────────────────────────────────────────

class LeaveBalanceResponse(BaseModel):
    id: int
    CL: float
    SL: float
    EL: float
    Maternity: float
    year: int

    class Config:
        from_attributes = True

class LeaveRequestCreate(BaseModel):
    leave_type: str
    from_date: date
    to_date: date
    days: float
    reason: str

class LeaveRequestResponse(BaseModel):
    id: int
    leave_type: str
    from_date: date
    to_date: date
    days: float
    reason: str
    status: str
    tl_approved_at: Optional[datetime] = None
    hr_approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/leave/my-balances", response_model=LeaveBalanceResponse)
def get_my_leave_balances(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.user_id == current_user.id).first()
    if not bal:
        # Initialize default balances for the user
        bal = models.LeaveBalance(user_id=current_user.id, CL=12.0, SL=8.0, EL=15.0, Maternity=26.0)
        db.add(bal)
        db.commit()
        db.refresh(bal)
    return bal

@router.get("/leave/my-requests", response_model=PaginatedResponse[LeaveRequestResponse])
def get_my_leave_requests(skip: int = 0, limit: int = 50, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    query = db.query(models.LeaveRequest).filter(models.LeaveRequest.user_id == current_user.id)
    total = query.count()
    items = query.order_by(models.LeaveRequest.from_date.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit}

@router.post("/leave/request", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def request_leave(req: LeaveRequestCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    # Check for overlapping leave requests
    overlap = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.user_id == current_user.id,
        models.LeaveRequest.status.in_(["pending", "approved"]),
        models.LeaveRequest.from_date <= req.to_date,
        models.LeaveRequest.to_date >= req.from_date
    ).first()
    if overlap:
        raise HTTPException(status_code=400, detail="Leave request overlaps with an existing request.")
        
    new_req = models.LeaveRequest(
        user_id=current_user.id,
        leave_type=req.leave_type,
        from_date=req.from_date,
        to_date=req.to_date,
        days=req.days,
        reason=req.reason,
        status="pending"
    )
    db.add(new_req)
    
    # Create System Notification for the employee
    notif = models.Notification(
        user_id=current_user.id,
        message=f"Your {req.leave_type} request for {req.days} days ({req.from_date} to {req.to_date}) has been successfully submitted and is pending approval.",
        type="info",
        read=False
    )
    db.add(notif)
    
    db.commit()
    db.refresh(new_req)
    return new_req
    
@router.post("/leave/request/{id}/cancel", response_model=LeaveRequestResponse)
def cancel_leave(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id, models.LeaveRequest.user_id == current_user.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
    
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending leave requests can be cancelled.")
        
    req.status = "cancelled"
    
    db.commit()
    db.refresh(req)
    return req


# ─── 3. EXPENSES SCHEMAS & ROUTES ─────────────────────────────────────────────

class ExpenseClaimCreate(BaseModel):
    amount: float
    category: str
    description: str
    claim_date: date
    receipt_url: Optional[str] = "#"

class ExpenseClaimResponse(BaseModel):
    id: int
    claim_date: date
    amount: float
    category: str
    description: Optional[str] = None
    receipt_url: Optional[str]
    tl_approval: str
    hr_approval: str
    status: str

    class Config:
        from_attributes = True

@router.get("/expenses/my-claims", response_model=PaginatedResponse[ExpenseClaimResponse])
def get_my_expense_claims(skip: int = 0, limit: int = 50, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    query = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.user_id == current_user.id, models.ExpenseClaim.deleted_at == None)
    total = query.count()
    items = query.order_by(models.ExpenseClaim.claim_date.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit}

@router.post("/expenses/claim", response_model=ExpenseClaimResponse, status_code=status.HTTP_201_CREATED)
def claim_expense(req: ExpenseClaimCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    claim = models.ExpenseClaim(
        user_id=current_user.id,
        claim_date=req.claim_date,
        amount=req.amount,
        category=req.category,
        description=req.description,
        receipt_url=req.receipt_url,
        tl_approval="pending",
        hr_approval="pending",
        status="pending"
    )
    db.add(claim)
    
    # Create System Notification for the employee
    notif = models.Notification(
        user_id=current_user.id,
        message=f"Your {req.category} expense claim for ₹{req.amount} has been successfully submitted and is pending TL review.",
        type="expenses"
    )
    db.add(notif)
    
    db.commit()
    db.refresh(claim)
    return claim

@router.delete("/expenses/claim/{claim_id}")
def cancel_expense_claim(claim_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    claim = db.query(models.ExpenseClaim).filter(
        models.ExpenseClaim.id == claim_id,
        models.ExpenseClaim.user_id == current_user.id,
        models.ExpenseClaim.deleted_at == None
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.tl_approval != "pending":
        raise HTTPException(status_code=400, detail="Only pending claims can be cancelled")
    claim.deleted_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Claim cancelled successfully"}


# ─── 4. PAYROLL SCHEMAS & ROUTES ──────────────────────────────────────────────

class PayslipResponse(BaseModel):
    id: int
    basic: float
    hra: float
    da: float
    allowances: float
    epf: float
    tds: float
    net: float
    month: int
    year: int
    lop: Optional[float] = 0.0
    worked_days: Optional[float] = None
    arrear_days: Optional[float] = 0.0
    lop_days: Optional[float] = 0.0
    lop_days_reversed: Optional[float] = 0.0
    status: Optional[str] = "pending"
    payment_method: Optional[str] = None
    transaction_ref: Optional[str] = None
    payment_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class LoanResponse(BaseModel):
    id: int
    loan_amount: float
    emi_amount: float
    tenure: int
    outstanding_balance: float
    status: str

    class Config:
        from_attributes = True

class EmployeeStaticDetails(BaseModel):
    name: str
    designation: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    doj: Optional[date] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    pan_number: Optional[str] = None
    pf_number: Optional[str] = None
    uan: Optional[str] = None
    esi_number: Optional[str] = None

class PayslipListResponse(BaseModel):
    items: List[PayslipResponse]
    total: int
    skip: int
    limit: int
    employee_details: EmployeeStaticDetails

@router.get("/payroll/my-payslips", response_model=PayslipListResponse)
def get_my_payslips(skip: int = 0, limit: int = 50, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    query = db.query(models.Payslip).filter(models.Payslip.user_id == current_user.id)
    total = query.count()
    items = query.order_by(models.Payslip.year.desc(), models.Payslip.month.desc()).offset(skip).limit(limit).all()
    
    # We might not have 'doj' natively mapped in models.User, so try to get it if it exists.
    doj = getattr(current_user, 'doj', None)
    if isinstance(doj, str):
        try:
            doj = date.fromisoformat(doj)
        except:
            doj = None
            
    emp_details = {
        "name": current_user.name,
        "designation": current_user.role,
        "department": current_user.department,
        "location": getattr(current_user, "location", None),
        "doj": doj,
        "bank_name": current_user.bank_name,
        "account_number": current_user.account_number,
        "pan_number": getattr(current_user, "pan_number", None),
        "pf_number": getattr(current_user, "pf_number", None),
        "uan": getattr(current_user, "uan", None),
        "esi_number": getattr(current_user, "esi_number", None)
    }
    
    return {"items": items, "total": total, "skip": skip, "limit": limit, "employee_details": emp_details}

@router.get("/payroll/my-loans", response_model=List[LoanResponse])
def get_my_loans(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Loan).filter(models.Loan.user_id == current_user.id).all()

@router.get("/payroll/export")
def export_my_payslips(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    payslips = db.query(models.Payslip).filter(models.Payslip.user_id == current_user.id).order_by(models.Payslip.year.desc(), models.Payslip.month.desc()).all()
    
    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(["ID", "Month", "Year", "Basic", "HRA", "DA", "Allowances", "EPF", "TDS", "Net", "LOP", "Status"])
    
    for p in payslips:
        writer.writerow([p.id, p.month, p.year, p.basic, p.hra, p.da, p.allowances, p.epf, p.tds, p.net, p.lop, p.status])
        
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=payslips_{current_user.emp_id or current_user.id}.csv"
    return response

@router.get("/attendance/export")
def export_my_attendance(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    records = db.query(models.Attendance).filter(models.Attendance.user_id == current_user.id).order_by(models.Attendance.date.desc()).all()
    
    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(["Date", "Clock In", "Clock Out", "Status", "Total Hours", "Work Mode", "Is Late", "Exception Flag"])
    
    for r in records:
        writer.writerow([
            r.date, 
            r.clock_in.strftime("%Y-%m-%d %H:%M:%S") if r.clock_in else "N/A", 
            r.clock_out.strftime("%Y-%m-%d %H:%M:%S") if r.clock_out else "N/A", 
            r.status, 
            r.total_hours or 0.0, 
            r.work_mode, 
            "Yes" if r.is_late else "No", 
            r.exception_flag
        ])
        
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=attendance_{current_user.emp_id or current_user.id}.csv"
    return response

class CTCResponse(BaseModel):
    earnings: List[dict]
    deductions: List[dict]
    total_earnings: float
    total_deductions: float
    net_take_home: float

@router.get("/payroll/ctc", response_model=CTCResponse)
def get_my_ctc(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    # Currently we don't have an EmployeeSalary table mapped yet, so returning 0s 
    # to avoid mocking until HR module sets up proper salary structures.
    basic = 0.0
    hra = 0.0
    sa = 0.0
    pf = 0.0
    pt = 0.0
    tds = 0.0
    monthly_gross = 0.0
    
    return {
        "earnings": [
            {"label": "Basic Salary", "amount": round(basic)},
            {"label": "HRA", "amount": round(hra)},
            {"label": "Special Allowance", "amount": round(sa)},
        ],
        "deductions": [
            {"label": "PF (Employee)", "amount": round(pf)},
            {"label": "Professional Tax", "amount": round(pt)},
            {"label": "TDS", "amount": round(tds)},
        ],
        "total_earnings": round(monthly_gross),
        "total_deductions": round(pf + pt + tds),
        "net_take_home": round(monthly_gross - (pf + pt + tds))
    }

class TDSSubmission(BaseModel):
    sec80c: float
    hra_rent: float
    hra_city: str
    sec80d: float

class TDSDeclarationResponse(BaseModel):
    id: int
    employee_id: int
    financial_year: str
    declaration_type: str
    declared_amount: float
    proof_url: Optional[str]
    status: str
    verified_by: Optional[str]

    class Config:
        from_attributes = True

@router.get("/payroll/tds-declarations", response_model=List[TDSDeclarationResponse])
def get_my_tds_declarations(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    """Return the current employee's TDS declarations."""
    return db.query(models.TDSDeclaration).filter(models.TDSDeclaration.employee_id == current_user.id).all()

@router.post("/payroll/tds-declarations")
def submit_tds_declaration(req: TDSSubmission, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    if req.sec80c > 0:
        db.add(models.TDSDeclaration(employee_id=current_user.id, financial_year="2026-27", declaration_type="80C", declared_amount=req.sec80c, status="pending"))
    if req.hra_rent > 0:
        db.add(models.TDSDeclaration(employee_id=current_user.id, financial_year="2026-27", declaration_type="HRA", declared_amount=req.hra_rent, status="pending"))
        
    notif = models.Notification(
        user_id=current_user.id,
        title="TDS Declaration Submitted",
        message="Your TDS investment declaration has been successfully submitted and is under HR review.",
        type="payroll"
    )
    db.add(notif)
    
    db.commit()
    return {"status": "success", "message": "TDS Declaration submitted successfully."}


# ─── 5. PROFILE SCHEMAS & ROUTES ──────────────────────────────────────────────

class BankUpdate(BaseModel):
    bank_name: str
    account_number: str
    ifsc_code: str

class PersonalDetailsUpdate(BaseModel):
    dob: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None
    is_active: Optional[bool] = True
    photo: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_branch: Optional[str] = None
    documents: Optional[str] = None
    pf_number: Optional[str] = None
    uan: Optional[str] = None
    esi_number: Optional[str] = None
    pan_number: Optional[str] = None
    location: Optional[str] = None
    emp_id: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    grade: Optional[int] = None
    manager: Optional[str] = None
    status: Optional[str] = None
    last_active: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/profile/details", response_model=UserProfileResponse)
def get_profile_details(current_user: models.User = Depends(security.get_current_user)):
    return current_user

@router.post("/profile/update-personal")
def update_personal_details(req: PersonalDetailsUpdate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if req.dob:
        try:
            from datetime import date as dt_date
            user.dob = dt_date.fromisoformat(req.dob)
        except Exception:
            pass
    if req.gender is not None:
        user.gender = req.gender
    if req.address is not None:
        user.address = req.address
    if req.emergency_contact_name is not None:
        user.emergency_contact_name = req.emergency_contact_name
    if req.emergency_contact_phone is not None:
        user.emergency_contact_phone = req.emergency_contact_phone
    db.commit()
    return {"status": "success", "message": "Personal details updated successfully."}

@router.post("/profile/update-avatar")
def update_avatar(req: dict, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    photo_url = req.get("photo_url", "")
    if not photo_url:
        raise HTTPException(status_code=400, detail="No photo_url provided")
    user.photo = photo_url
    db.commit()
    return {"status": "success", "photo": user.photo}

@router.post("/profile/update-bank")
def update_bank_details(req: BankUpdate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    user.bank_name = req.bank_name
    user.account_number = req.account_number
    user.ifsc_code = req.ifsc_code
    
    # Notify HR
    notif = models.Notification(
        user_id=current_user.id,
        title="Bank Details Updated",
        message=f"You have successfully updated your bank account details. HR will review them.",
        type="info"
    )
    db.add(notif)
    
    db.commit()
    return {"status": "success", "message": "Bank details updated successfully."}

@router.post("/profile/update-documents")
def update_documents(req: dict, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    user.documents = json.dumps(req.get("documents", []))
    
    # Notify HR
    notif = models.Notification(
        user_id=current_user.id,
        title="Documents Updated",
        message="You have uploaded/updated your verification documents.",
        type="info"
    )
    db.add(notif)
    
    db.commit()
    return {"status": "success"}

@router.post("/profile/upload-document")
async def upload_document(
    name: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    import uuid
    import os
    from datetime import datetime

    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    os.makedirs("uploads", exist_ok=True)
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join("uploads", file_name)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    existing_docs = []
    if user.documents:
        existing_docs = json.loads(user.documents)
    
    new_doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "docType": name,
        "link": f"/uploads/{file_name}",
        "type": "Document",
        "status": "Uploaded",
        "original_filename": file.filename,
        "uploaded_at": datetime.utcnow().isoformat()
    }
    existing_docs.append(new_doc)
    user.documents = json.dumps(existing_docs)
    
    notif = models.Notification(
        user_id=current_user.id,
        message=f"You have uploaded {name}.",
        type="info"
    )
    db.add(notif)
    db.commit()
    
    return {"status": "success", "document": new_doc, "documents": existing_docs}


# ─── 6. RESIGNATION & ASSETS SCHEMAS & ROUTES ─────────────────────────────────

class ResignationCreate(BaseModel):
    submissionDate: date
    lwdDate: date
    reason: str

class ResignationResponse(BaseModel):
    id: int
    resignation_date: date
    LWD: date
    status: str
    ceo_status: Optional[str] = "pending"
    reason: str
    early_relief_status: Optional[str] = None
    exit_checklist: Optional[str] = None

    class Config:
        from_attributes = True

class AssetResponse(BaseModel):
    id: str
    assetTag: str
    type: str
    name: str
    serialNumber: Optional[str]
    issueDate: Optional[date]
    condition: Optional[str]
    returnStatus: str
    signedDate: Optional[date]

    class Config:
        from_attributes = True

@router.get("/resignation/status", response_model=Optional[ResignationResponse])
def get_resignation_status(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Resignation).filter(models.Resignation.user_id == current_user.id, models.Resignation.deleted_at == None).first()

@router.post("/resignation/submit", response_model=ResignationResponse)
def submit_resignation(req: ResignationCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    existing = db.query(models.Resignation).filter(models.Resignation.user_id == current_user.id, models.Resignation.deleted_at == None).first()
    if existing:
         raise HTTPException(status_code=400, detail="Resignation already submitted.")
    
    res = models.Resignation(
        user_id=current_user.id,
        resignation_date=req.submissionDate,
        LWD=req.lwdDate,
        reason=req.reason,
        status="pending"
    )
    db.add(res)
    
    # Notify HR
    notif = models.Notification(
        user_id=current_user.id,
        message=f"You have submitted your resignation. HR will review and confirm your LWD.",
        type="warning"
    )
    db.add(notif)
    
    db.commit()
    db.refresh(res)
    return res

@router.post("/resignation/withdraw")
def withdraw_resignation(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    res = db.query(models.Resignation).filter(
        models.Resignation.user_id == current_user.id,
        models.Resignation.deleted_at == None
    ).order_by(models.Resignation.id.desc()).first()
    if not res:
        raise HTTPException(status_code=404, detail="No active resignation request found.")
        
    res.deleted_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Resignation request withdrawn successfully."}

@router.post("/resignation/update-checklist")
def update_checklist(req: dict, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    res = db.query(models.Resignation).filter(
        models.Resignation.user_id == current_user.id,
        models.Resignation.deleted_at == None
    ).first()
    if not res:
        raise HTTPException(status_code=404, detail="No active resignation found.")
    
    res.exit_checklist = json.dumps(req.get("checklist", []))
    db.commit()
    return {"status": "success"}

@router.post("/resignation/request-early-relief")
def request_early_relief(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    res = db.query(models.Resignation).filter(
        models.Resignation.user_id == current_user.id,
        models.Resignation.deleted_at == None
    ).first()
    if not res:
        raise HTTPException(status_code=404, detail="No active resignation found.")
    
    res.early_relief_status = "requested"
    db.commit()
    return {"status": "success"}

@router.get("/resignation/my-assets", response_model=List[AssetResponse])
def get_my_assets(skip: int = 0, limit: int = 50, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Asset).filter(models.Asset.user_id == current_user.id).offset(skip).limit(limit).all()

# ─── Asset Requests (separate from issued assets) ───────────────────────────

class AssetRequestCreate(BaseModel):
    asset_type: str
    reason: str
    urgency: str = "Low"

class AssetRequestResponse(BaseModel):
    id: int
    asset_type: str
    reason: str
    urgency: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/assets/my-requests")
def get_my_asset_requests(skip: int = 0, limit: int = 50, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    # Return from SupportTicket table using category='asset_request'
    query = db.query(models.SupportTicket).filter(
        models.SupportTicket.user_id == current_user.id,
        models.SupportTicket.category == "asset_request"
    )
    total = query.count()
    tickets = query.order_by(models.SupportTicket.created_at.desc()).offset(skip).limit(limit).all()
    items = [{"id": t.id, "asset_type": t.title, "reason": t.description, "urgency": t.priority, "status": t.status, "created_at": t.created_at} for t in tickets]
    return {"items": items, "total": total, "skip": skip, "limit": limit}

@router.post("/assets/request", status_code=201)
def create_asset_request(req: AssetRequestCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    ticket = models.SupportTicket(
        user_id=current_user.id,
        title=req.asset_type,
        description=req.reason,
        category="asset_request",
        priority=req.urgency.lower(),
        status="open"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return {"id": ticket.id, "asset_type": ticket.title, "reason": ticket.description, "urgency": ticket.priority, "status": ticket.status, "created_at": ticket.created_at}

class NocSignRequest(BaseModel):
    signature_data: str

@router.post("/assets/sign-noc/{asset_id}")
def sign_asset_noc(asset_id: str, req: NocSignRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    """Employee signs the NOC for a specific issued asset — updates returnStatus to 'Signed' in DB and stores signature."""
    asset = db.query(models.Asset).filter(
        models.Asset.id == asset_id,
        models.Asset.user_id == current_user.id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found or not assigned to you")
    if asset.returnStatus == "Signed":
        raise HTTPException(status_code=400, detail="NOC already signed for this asset")
    asset.returnStatus = "Signed"
    asset.signedDate = date.today()
    asset.signature_data = req.signature_data
    db.commit()
    db.refresh(asset)
    return {
        "status": "success",
        "asset_id": asset.id,
        "returnStatus": asset.returnStatus,
        "signedDate": str(asset.signedDate)
    }


# ─── 7. LEARNING & TRAINING SCHEMAS & ROUTES ───────────────────────────────────

class TrainingProgressUpdate(BaseModel):
    completed_modules: int
    quiz_score: float
    passed: bool

class TrainingProgressResponse(BaseModel):
    id: int
    track_id: int
    completed_modules: int
    quiz_score: float
    passed: bool

    class Config:
        from_attributes = True

@router.get("/learning/progress", response_model=Optional[TrainingProgressResponse])
def get_training_progress(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.TrainingProgress).filter(models.TrainingProgress.employee_id == current_user.id, models.TrainingProgress.track_id == 1).first()

@router.post("/learning/progress", response_model=TrainingProgressResponse)
def update_training_progress(req: TrainingProgressUpdate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    progress = db.query(models.TrainingProgress).filter(models.TrainingProgress.employee_id == current_user.id, models.TrainingProgress.track_id == 1).first()
    if not progress:
        progress = models.TrainingProgress(
            employee_id=current_user.id,
            track_id=1,
            completed_modules=req.completed_modules,
            quiz_score=req.quiz_score,
            passed=req.passed
        )
        db.add(progress)
    else:
        progress.completed_modules = req.completed_modules
        progress.quiz_score = req.quiz_score
        progress.passed = req.passed
    db.commit()
    db.refresh(progress)
    return progress

# ─── 8. HELPDESK SCHEMAS & ROUTES ─────────────────────────────────────────────

class TicketCreate(BaseModel):
    title: str
    description: str
    category: str
    priority: str = "medium"

class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/helpdesk/my-tickets", response_model=List[TicketResponse])
def get_my_tickets(skip: int = 0, limit: int = 50, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.SupportTicket).filter(models.SupportTicket.user_id == current_user.id, models.SupportTicket.deleted_at == None).order_by(models.SupportTicket.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/helpdesk/ticket", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def submit_ticket(req: TicketCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    ticket = models.SupportTicket(
        user_id=current_user.id,
        title=req.title,
        description=req.description,
        category=req.category,
        priority=req.priority,
        status="open"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


# ─── 8. CHAT SCHEMAS & ROUTES ─────────────────────────────────────────────────

@router.get("/chat/users", response_model=List[UserProfileResponse])
def get_chat_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.User).all()

class ChannelCreate(BaseModel):
    id: str
    name: str
    label: Optional[str]
    type: str
    members: List[str]

class ChannelResponse(BaseModel):
    id: str
    name: str
    label: Optional[str]
    type: str
    members: List[str] = []

    @field_validator("members", mode="before")
    def parse_members(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return []
        return v or []

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    text: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    parent_id: Optional[int] = None
    mentions: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    channel_id: str
    sender: str
    text: str
    timestamp: datetime
    is_edited: bool = False
    deleted_at: Optional[datetime] = None
    reactions: Optional[str] = None
    seen_by: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    parent_id: Optional[int] = None
    is_pinned: bool = False
    mentions: Optional[str] = None

    class Config:
        from_attributes = True

class MessageUpdate(BaseModel):
    text: Optional[str] = None
    reactions: Optional[str] = None # JSON string of reactions
    seen_by: Optional[str] = None # JSON string of seen users
    is_pinned: Optional[bool] = None

class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    label: Optional[str] = None

@router.get("/chat/channels", response_model=List[ChannelResponse])
def get_channels(db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.ChatChannel).all()

@router.post("/chat/channels", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
def create_channel(req: ChannelCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    import json
    channel = models.ChatChannel(
        id=req.id,
        name=req.name,
        label=req.label,
        type=req.type,
        members=json.dumps(req.members)
    )
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel

@router.get("/chat/search", response_model=List[MessageResponse])
def search_messages(query: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.ChatMessage).filter(models.ChatMessage.text.ilike(f"%{query}%")).order_by(models.ChatMessage.timestamp.desc()).limit(100).all()

@router.get("/chat/channels/{channel_id}/messages", response_model=List[MessageResponse])
def get_channel_messages(channel_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.ChatMessage).filter(models.ChatMessage.channel_id == channel_id).order_by(models.ChatMessage.timestamp.asc()).all()

@router.post("/chat/channels/{channel_id}/send", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(channel_id: str, req: MessageCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    channel = db.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Chat channel not found.")
        
    msg = models.ChatMessage(
        channel_id=channel_id,
        sender=current_user.name,
        text=req.text,
        attachment_url=req.attachment_url,
        attachment_type=req.attachment_type,
        parent_id=req.parent_id,
        mentions=req.mentions
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

from fastapi import UploadFile, File
import os
import uuid

@router.post("/chat/upload")
async def upload_chat_file(file: UploadFile = File(...)):
    try:
        # Save file to uploads directory
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        filepath = os.path.join("uploads", unique_filename)
        
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)
            
        file_url = f"/uploads/{unique_filename}"
        
        # Determine type
        content_type = file.content_type or ""
        if content_type.startswith('image/'):
            attachment_type = 'image'
        elif content_type.startswith('video/'):
            attachment_type = 'video'
        else:
            attachment_type = 'file'
            
        print(f"DEBUG UPLOAD SUCCESS: {file_url}, {attachment_type}")
        return {"url": file_url, "type": attachment_type, "name": file.filename}
    except Exception as e:
        print(f"DEBUG UPLOAD FAILED: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/upload-dp")
async def upload_dp(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    try:
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"dp_{current_user.id}_{uuid.uuid4()}{file_ext}"
        os.makedirs(os.path.join("uploads", "dps"), exist_ok=True)
        filepath = os.path.join("uploads", "dps", unique_filename)
        
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)
            
        file_url = f"/uploads/dps/{unique_filename}"
        
        current_user.photo = file_url
        db.commit()
        db.refresh(current_user)
        
        return {"url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class MembersUpdate(BaseModel):
    members: List[str]

@router.put("/chat/channels/{channel_id}/members", response_model=ChannelResponse)
def update_channel_members(channel_id: str, req: MembersUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    """Update the member list for a channel. Called by HR portal when adding/removing employees."""
    import json
    channel = db.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
    if not channel:
        # Auto-create channel if it does not exist
        channel = models.ChatChannel(
            id=channel_id,
            name=f"#{channel_id}",
            label=f"Channel {channel_id}",
            type="staff",
            members=json.dumps(req.members)
        )
        db.add(channel)
    else:
        channel.members = json.dumps(req.members)
    db.commit()
    db.refresh(channel)
    return channel

@router.patch("/chat/channels/{channel_id}", response_model=ChannelResponse)
def update_channel(channel_id: str, req: ChannelUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    channel = db.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if req.name is not None:
        channel.name = req.name
    if req.label is not None:
        channel.label = req.label
    db.commit()
    db.refresh(channel)
    return channel

@router.delete("/chat/channels/{channel_id}")
def delete_channel(channel_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    channel = db.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    db.delete(channel)
    db.commit()
    return {"message": "Channel deleted"}

@router.patch("/chat/messages/{message_id}", response_model=MessageResponse)
async def update_message(message_id: int, req: MessageUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if req.text is not None:
        # Allow edit if sender matches user's name OR user's role (for backward compat with old role-named messages)
        sender_matches = (
            msg.sender == current_user.name or
            msg.sender.lower() == current_user.role.lower() or
            msg.sender.lower().startswith(current_user.name.lower()) or
            current_user.name.lower().startswith(msg.sender.lower()) or
            current_user.role in ['ceo', 'hr'] # CEO/HR can edit any message
        )
        if not sender_matches:
            raise HTTPException(status_code=403, detail="Forbidden")
        msg.text = req.text
        msg.is_edited = True
    
    if req.reactions is not None:
        msg.reactions = req.reactions
        
    if req.seen_by is not None:
        msg.seen_by = req.seen_by
        
    if req.is_pinned is not None:
        msg.is_pinned = req.is_pinned
        
    db.commit()
    db.refresh(msg)
    
    # Broadcast edit event
    broadcast_data = {
        "event_type": "update_message",
        "id": msg.id,
        "channel_id": msg.channel_id,
        "sender": msg.sender,
        "text": msg.text,
        "is_edited": msg.is_edited,
        "reactions": msg.reactions,
        "seen_by": msg.seen_by,
        "is_pinned": msg.is_pinned,
        "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
    }
    await manager.broadcast_message(broadcast_data)
    
    return msg

@router.delete("/chat/messages/{message_id}")
async def delete_message(message_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    sender_matches = (
        msg.sender == current_user.name or
        msg.sender.lower() == current_user.role.lower() or
        msg.sender.lower().startswith(current_user.name.lower()) or
        current_user.name.lower().startswith(msg.sender.lower()) or
        current_user.role in ['ceo', 'hr']
    )
    if not sender_matches:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    msg.deleted_at = datetime.utcnow()
    db.commit()
    
    # Broadcast delete event
    broadcast_data = {
        "event_type": "delete_message",
        "id": msg.id,
        "channel_id": msg.channel_id
    }
    await manager.broadcast_message(broadcast_data)
    
    return {"message": "Message deleted"}


@router.get("/chat/my-channels", response_model=List[ChannelResponse])
def get_my_channels(db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    """Return only channels where the current logged-in user's ID is in the members list."""
    import json
    all_channels = db.query(models.ChatChannel).all()
    my_channels = []
    user_id_str = str(current_user.id)
    for ch in all_channels:
        try:
            members = json.loads(ch.members) if isinstance(ch.members, str) else (ch.members or [])
        except Exception:
            members = []
        # Include channel if user's ID (as string) is in members list
        if user_id_str in [str(m) for m in members]:
            my_channels.append(ch)
    return my_channels


# ─── WebSocket Connection Manager & Endpoint ───────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)
        
        db = database.SessionLocal()
        try:
            user = db.query(models.User).filter(models.User.name == client_id).first()
            if user:
                user.last_active = datetime.utcnow()
                db.commit()
            await self.broadcast_message({"event_type": "presence_update", "user": client_id, "online": True})
        finally:
            db.close()

    async def disconnect(self, client_id: str, websocket: WebSocket):
        if client_id in self.active_connections:
            self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
                
                db = database.SessionLocal()
                try:
                    user = db.query(models.User).filter(models.User.name == client_id).first()
                    if user:
                        user.last_active = datetime.utcnow()
                        db.commit()
                        await self.broadcast_message({"event_type": "presence_update", "user": client_id, "online": False, "last_active": user.last_active.isoformat()})
                finally:
                    db.close()

    async def broadcast_message(self, message: dict):
        import json
        payload = json.dumps(message)
        for client_id, websockets in list(self.active_connections.items()):
            for websocket in websockets:
                try:
                    await websocket.send_text(payload)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(client_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            import json
            try:
                msg_data = json.loads(data)
                msg_type = msg_data.get("type")
                
                if msg_type in ["delivered", "read"]:
                    msg_id = msg_data.get("msg_id")
                    db_session = database.SessionLocal()
                    try:
                        db_msg = db_session.query(models.ChatMessage).filter(models.ChatMessage.id == msg_id).first()
                        if db_msg:
                            import json as pyjson
                            if msg_type == "delivered":
                                existing = pyjson.loads(db_msg.delivered_to) if db_msg.delivered_to else []
                                if client_id not in existing:
                                    existing.append(client_id)
                                    db_msg.delivered_to = pyjson.dumps(existing)
                                    db_session.commit()
                                    await manager.broadcast_message({
                                        "event_type": "message_delivered",
                                        "msg_id": msg_id,
                                        "by": client_id
                                    })
                            elif msg_type == "read":
                                existing = pyjson.loads(db_msg.seen_by) if db_msg.seen_by else []
                                if client_id not in existing:
                                    existing.append(client_id)
                                    db_msg.seen_by = pyjson.dumps(existing)
                                    db_session.commit()
                                    await manager.broadcast_message({
                                        "event_type": "message_read",
                                        "msg_id": msg_id,
                                        "by": client_id
                                    })
                    finally:
                        db_session.close()
                    continue

                if msg_type in ["typing_start", "typing_stop"]:
                    await manager.broadcast_message({
                        "event_type": msg_type,
                        "channel_id": msg_data.get("channel_id"),
                        "user": msg_data.get("sender") or client_id
                    })
                    continue

                if msg_type == "pin_message":
                    msg_id = msg_data.get("msg_id")
                    is_pinned_raw = msg_data.get("is_pinned", True)
                    is_pinned = is_pinned_raw.lower() == 'true' if isinstance(is_pinned_raw, str) else bool(is_pinned_raw)
                    db_session = database.SessionLocal()
                    try:
                        # Try to parse as integer, some clients send float timestamp strings like "171092831.123"
                        try:
                            msg_id_int = int(float(msg_id))
                        except (ValueError, TypeError):
                            msg_id_int = msg_id

                        db_msg = db_session.query(models.ChatMessage).filter(models.ChatMessage.id == msg_id_int).first()
                        if db_msg:
                            db_msg.is_pinned = is_pinned
                            db_session.commit()
                            await manager.broadcast_message({
                                "event_type": "message_pinned",
                                "msg_id": msg_id,
                                "is_pinned": is_pinned,
                                "channel_id": db_msg.channel_id
                            })
                    finally:
                        db_session.close()
                    continue


                channel_id = msg_data.get("channel_id")
                text = msg_data.get("text", "")
                sender = msg_data.get("sender", client_id)
                attachment_url = msg_data.get("attachment_url")

                if channel_id and (text or attachment_url):
                    # Save to database
                    db_session = database.SessionLocal()
                    try:
                        # Check channel exists or seed it dynamically for testing
                        channel = db_session.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
                        if not channel:
                            # Dynamic seed for custom channels
                            channel = models.ChatChannel(id=channel_id, name=f"#{channel_id}", label=f"Room {channel_id}", type="staff")
                            db_session.add(channel)
                            db_session.flush()

                        db_msg = models.ChatMessage(
                            channel_id=channel_id,
                            sender=sender,
                            text=text,
                            attachment_url=msg_data.get("attachment_url"),
                            attachment_type=msg_data.get("attachment_type"),
                            parent_id=msg_data.get("parent_id"),
                            mentions=msg_data.get("mentions")
                        )
                        db_session.add(db_msg)
                        db_session.commit()
                        db_session.refresh(db_msg)
                        
                        # Broadcast
                        broadcast_data = {
                            "event_type": "new_message",
                            "id": db_msg.id,
                            "channel_id": db_msg.channel_id,
                            "sender": db_msg.sender,
                            "text": db_msg.text,
                            "attachment_url": db_msg.attachment_url,
                            "attachment_type": db_msg.attachment_type,
                            "parent_id": db_msg.parent_id,
                            "mentions": db_msg.mentions,
                            "is_pinned": db_msg.is_pinned,
                            "timestamp": db_msg.timestamp.isoformat()
                        }
                        await manager.broadcast_message(broadcast_data)
                    finally:
                        db_session.close()
            except Exception as e:
                err_msg = f"Error parsing websocket payload: {str(e)}\n"
                print(err_msg)
                with open("ws_errors.log", "a") as f:
                    f.write(err_msg)
    except WebSocketDisconnect:
        await manager.disconnect(client_id, websocket)
class OrgChartResponse(BaseModel):
    id: int
    name: str
    role: str
    department: Optional[str]
    designation: Optional[str]
    manager_id: Optional[int]
    photo: Optional[str]
    email: str

    class Config:
        from_attributes = True

class AppraisalScorecardResponse(BaseModel):
    id: int
    employee_name: str
    tl_name: str
    rating: str
    comments: str
    emp_acknowledged: bool
    hr_acknowledged: bool

    class Config:
        from_attributes = True

# 8. Org Chart
@router.get("/org-chart", response_model=List[OrgChartResponse])
def get_org_chart(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    # Return all active employees, TLs, managers, HR, CEO
    users = db.query(models.User).filter(models.User.status.in_(["active", "probation"])).all()
    return users

# 9. Performance Appraisals
@router.get("/performance/my-scorecards", response_model=PaginatedResponse[AppraisalScorecardResponse])
def get_my_scorecards(skip: int = 0, limit: int = 50, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    query = db.query(models.AppraisalScorecard).filter(models.AppraisalScorecard.employee_name == current_user.name)
    total = query.count()
    items = query.order_by(models.AppraisalScorecard.id.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit}

@router.post("/performance/scorecards/{id}/acknowledge")
def acknowledge_scorecard(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    scorecard = db.query(models.AppraisalScorecard).filter(models.AppraisalScorecard.id == id, models.AppraisalScorecard.employee_name == current_user.name).first()
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found.")
    
    scorecard.emp_acknowledged = True
    
    tl_user = db.query(models.User).filter(models.User.name == scorecard.tl_name).first()
    if tl_user:
        db_notify = models.Notification(
            user_id=tl_user.id,
            message=f"{current_user.name} has acknowledged their performance scorecard.",
            type="info"
        )
        db.add(db_notify)
        db.commit()
    else:
        db.commit()
    return {"status": "success", "message": "Scorecard acknowledged."}

# 10. Global Information
class HolidayResponse(BaseModel):
    id: int
    name: str
    date: str
    type: str

    class Config:
        from_attributes = True

@router.get("/holidays", response_model=List[HolidayResponse])
def get_company_holidays(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    """Returns company holidays for all authenticated users without role restrictions."""
    return db.query(models.Holiday).order_by(models.Holiday.date.asc()).all()


# ─── Task Attachment Endpoints ───────────────────────────────────────────────

@router.post("/tasks/upload")
async def upload_task_file(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user)):
    try:
        os.makedirs(os.path.join("uploads", "tasks"), exist_ok=True)
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        filepath = os.path.join("uploads", "tasks", unique_filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"/uploads/tasks/{unique_filename}"
        return {"filename": file.filename, "file_url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.post("/tasks/{task_id}/attachments", response_model=TaskAttachmentResponse)
def add_task_attachment(task_id: int, req: TaskAttachmentRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or does not belong to you")
        
    db_att = models.TaskAttachment(
        task_id=task_id,
        filename=req.filename,
        file_url=req.file_url
    )
    db.add(db_att)
    db.commit()
    db.refresh(db_att)
    return db_att


@router.delete("/tasks/{task_id}/attachments/{attachment_id}")
def delete_task_attachment(task_id: int, attachment_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or does not belong to you")
        
    att = db.query(models.TaskAttachment).filter(models.TaskAttachment.id == attachment_id, models.TaskAttachment.task_id == task_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
        
    # Delete from database
    db.delete(att)
    db.commit()
    
    # Try to delete from disk
    try:
        if att.file_url.startswith("/uploads/"):
            local_path = att.file_url.lstrip("/")
            if os.path.exists(local_path):
                os.remove(local_path)
    except Exception as e:
        print(f"Error removing physical file: {e}")
        
    return {"status": "success", "message": "Attachment deleted successfully"}

