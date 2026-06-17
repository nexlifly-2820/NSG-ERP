from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date, datetime, timedelta
import json
import hashlib
import os
import shutil
from app import models, database
from app.core import security

router = APIRouter(
    prefix="/ceo-portal",
    tags=["ceo-portal"]
)

# Verify CEO or Admin roles
def verify_ceo_role(user: models.User):
    if user.role not in ["ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden. CEO/Admin privileges required."
        )

# ─── Pydantic Validation Schemas ──────────────────────────────────────────────

class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    department: str
    designation: str
    role: str
    phone: Optional[str] = None
    join_date: date
    status: Optional[str] = "probation"
    shift_timing: Optional[str] = None

class UserCreateResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    temporary_password: str

class UserDetailResponse(BaseModel):
    id: int
    emp_id: Optional[str]
    name: str
    email: str
    role: str
    department: Optional[str]
    designation: Optional[str]
    status: str
    join_date: Optional[date]
    photo: Optional[str]
    last_active: Optional[datetime] = None
    shift_timing: Optional[str] = None

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    shift_timing: Optional[str] = None

class PasswordResetRequest(BaseModel):
    new_password: str

class AnnouncementCreate(BaseModel):
    title: str
    body: str
    priority: Optional[str] = "Normal"
    audience: Optional[str] = "All Portals"

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    body: str
    priority: str
    audience: str
    created_at: Optional[datetime] = None
    author: Optional[str] = "CEO Office"
    read_count: Optional[int] = 0
    read_pct: Optional[float] = 0.0

    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str
    client: str
    budget: float
    used: Optional[float] = 0.0
    status: Optional[str] = "Active"
    deadline: str
    checklist: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client: Optional[str] = None
    budget: Optional[float] = None
    used: Optional[float] = None
    status: Optional[str] = None
    deadline: Optional[str] = None
    checklist: Optional[str] = None

class VendorCreate(BaseModel):
    vendor_id: str
    name: str
    category: str
    status: Optional[str] = "Active"
    annual_spend: str
    renewal_date: Optional[str] = None
    risk_level: Optional[str] = "Low"

class VendorResponse(BaseModel):
    id: int
    vendor_id: str
    name: str
    category: str
    status: str
    annual_spend: str
    renewal_date: Optional[str]
    risk_level: str

    class Config:
        from_attributes = True

class VaultDocumentResponse(BaseModel):
    id: int
    doc_id: str
    name: str
    type: str
    sign_status: str
    file_url: str
    file_hash: Optional[str]
    parties: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectMilestoneResponse(BaseModel):
    id: int
    name: str
    progress: int
    status: str

    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: int
    name: str
    client: str
    budget: float
    used: float
    status: str
    deadline: Optional[str]
    checklist: Optional[str] = None
    milestones: Optional[List[ProjectMilestoneResponse]] = []

    class Config:
        from_attributes = True

class KeyResultResponse(BaseModel):
    id: int
    objective_id: int
    title: str
    target: int
    current: int
    unit: str
    sprint_link: Optional[str] = None

    class Config:
        from_attributes = True

class ObjectiveResponse(BaseModel):
    id: int
    title: str
    status: str
    progress: int
    owner: str
    quarter: str
    year: str
    krs: List[KeyResultResponse]

    class Config:
        from_attributes = True

class PayrollRunResponse(BaseModel):
    id: int
    month: int
    year: int
    status: str
    maker_id: Optional[str]
    maker_signed_at: Optional[datetime]
    checker_id: Optional[str]
    checker_signed_at: Optional[datetime]
    bank_transfer_at: Optional[datetime]

    class Config:
        from_attributes = True

class LoanResponse(BaseModel):
    id: int
    user_id: int
    loan_amount: float
    emi_amount: float
    tenure: int
    disbursed_at: Optional[datetime]
    outstanding_balance: float
    status: str

    class Config:
        from_attributes = True

class ExpenseClaimResponse(BaseModel):
    id: int
    user_id: int
    claim_date: date
    amount: float
    category: str
    receipt_url: Optional[str]
    tl_approval: Optional[str]
    hr_approval: Optional[str]
    status: str

    class Config:
        from_attributes = True

class LeaveRequestResponse(BaseModel):
    id: int
    user_id: int
    leave_type: str
    from_date: date
    to_date: date
    days: float
    reason: str
    status: str
    tl_approved_at: Optional[datetime]
    hr_approved_at: Optional[datetime]

    class Config:
        from_attributes = True

class EscalationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    task_link: str
    submitted_at: datetime
    severity: str
    ceo_viewed: bool
    resolved: bool
    dependencies: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    initiator_id: str
    module: str
    record_id: Optional[int]
    action_type: str
    change_diff: Optional[str]
    ip_address: Optional[str]
    client_agent: Optional[str]

    class Config:
        from_attributes = True

class ConfigValueRequest(BaseModel):
    key: str
    value: str

# ─── Endpoints ───────────────────────────────────────────────────────────────

# 1. Telemetry Dashboard
@router.get("/dashboard/summary")
def get_dashboard_summary(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)

    total_headcount = db.query(models.User).filter(models.User.role != "admin").count()
    active_blockers = db.query(models.Escalation).filter(models.Escalation.resolved == False).count()
    
    # Pendings count (PayrollRun table not yet seeded; graceful fallback)
    try:
        pending_payroll = db.query(models.PayrollRun).filter(models.PayrollRun.status == "maker_signed").count()
    except Exception:
        pending_payroll = 0
    pending_loans = db.query(models.Loan).filter(models.Loan.status == "active", models.Loan.outstanding_balance > 0).count()
    pending_claims = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.status == "pending").count()
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").count()
    
    total_approvals = pending_payroll + pending_claims + pending_leaves + pending_loans
    
    total_payroll = db.query(func.sum(models.Payslip.net)).scalar() or 0.0
    active_projects = db.query(models.Project).filter(models.Project.status == "Active").count()
    
    # Calculate real OKR progress
    objectives = db.query(models.Objective).offset(skip).limit(limit).all()
    avg_okr = 0.0
    if objectives:
        avg_okr = sum([obj.progress for obj in objectives]) / len(objectives)
    
    return {
        "headcount": total_headcount,
        "activeBlockers": active_blockers,
        "pendingApprovalsCount": total_approvals,
        "okrProgressAverage": round(avg_okr, 1),
        "riskIndex": "Low" if active_blockers <= 2 else "High",
        "monthlyPayroll": total_payroll,
        "activeProjects": active_projects
    }

@router.get("/dashboard/heatmap")
def get_dashboard_heatmap(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    heatmap_depts = ["Sales", "Engineering", "Marketing", "HR", "Finance"]
    calculated_dates = []
    start_date = datetime.now().date() - timedelta(days=13)
    
    # Generate dates list
    for i in range(14):
        d = start_date + timedelta(days=i)
        calculated_dates.append(d)
        
    # Get all users and group by department
    users = db.query(models.User).filter(models.User.role == "employee", models.User.status == "active").offset(skip).limit(limit).all()
    dept_users = {dept: [] for dept in heatmap_depts}
    for u in users:
        if u.department in dept_users:
            dept_users[u.department].append(u.id)
            
    # Calculate heatmap matrix
    computed_heatmap = []
    dates_str = [d.strftime("%b %d") for d in calculated_dates]
    
    for dept in heatmap_depts:
        user_ids = dept_users[dept]
        dept_row = []
        if not user_ids:
            # No users in dept
            dept_row = [0] * 14
        else:
            for d in calculated_dates:
                # Query attendance for this date and these users
                logs = db.query(models.Attendance).filter(
                    models.Attendance.date == d,
                    models.Attendance.user_id.in_(user_ids)
                ).all()
                if not logs:
                    dept_row.append(0)
                else:
                    present_logs = [log for log in logs if log.status in ["present", "late", "half-day"]]
                    pct = round((len(present_logs) / len(logs)) * 100)
                    dept_row.append(pct)
        computed_heatmap.append(dept_row)
        
    return {
        "dates": dates_str,
        "departments": heatmap_depts,
        "data": computed_heatmap
    }

@router.get("/users", response_model=List[UserDetailResponse])
def get_all_users_by_ceo(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.User).filter(models.User.role != "admin").offset(skip).limit(limit).all()

@router.post("/users", response_model=UserCreateResponse, status_code=status.HTTP_201_CREATED)
def create_user_by_ceo(req: UserCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    exists = db.query(models.User).filter(models.User.email == req.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
        
    # Calculate emp_id
    max_serial = 100
    for u in db.query(models.User).all():
        if u.emp_id and u.emp_id.startswith("NSG-0"):
            try:
                num = int(u.emp_id.split("-0")[-1])
                if num > max_serial:
                    max_serial = num
            except ValueError:
                pass
    emp_id = f"NSG-0{max_serial + 1}"
    
    # Generate temporary password
    import string, random
    chars = string.ascii_letters + string.digits
    temp_pwd_plain = f"{req.name.split(' ')[0]}@123" if req.name else "Welcome@123"
    hashed_pwd = security.hash_password(temp_pwd_plain)
    
    db_user = models.User(
        name=req.name,
        email=req.email,
        hashed_password=hashed_pwd,
        role=req.role.lower(),
        department=req.department,
        designation=req.designation,
        phone=req.phone,
        join_date=req.join_date,
        status=req.status,
        emp_id=emp_id,
        is_active=True,
        shift_timing=req.shift_timing
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {
        "user_id": db_user.id,
        "name": db_user.name,
        "email": db_user.email,
        "role": db_user.role,
        "temporary_password": temp_pwd_plain
    }

@router.patch("/users/{user_id}", response_model=UserDetailResponse)
def update_user_by_ceo(user_id: int, req: UserUpdateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if req.name is not None:
        db_user.name = req.name
    if req.email is not None:
        exists = db.query(models.User).filter(models.User.email == req.email, models.User.id != user_id).first()
        if exists:
            raise HTTPException(status_code=400, detail="Another user with this email already exists.")
        db_user.email = req.email
    if req.department is not None:
        db_user.department = req.department
    if req.designation is not None:
        db_user.designation = req.designation
    if req.role is not None:
        db_user.role = req.role.lower()
    if req.status is not None:
        db_user.status = req.status
    if req.shift_timing is not None:
        db_user.shift_timing = req.shift_timing
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/users/{user_id}/password")
def reset_user_password_by_ceo(user_id: int, req: PasswordResetRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    hashed_pwd = security.hash_password(req.new_password)
    db_user.hashed_password = hashed_pwd
    db.commit()
    
    return {"message": "Password updated successfully."}

@router.delete("/users/{user_id}")
def delete_user_by_ceo(user_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    # We may need to cascade delete or just delete the user record
    db.delete(db_user)
    db.commit()
    return {"status": "success", "message": "User deleted."}

# ─── 2. Corporate Announcements ───────────────────────────────────────────────

@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(
    current_user: models.User = Depends(security.get_current_user),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    """List all announcements (newest first). Open to all authenticated users."""
    return db.query(models.Announcement).order_by(
        models.Announcement.created_at.desc()
    ).offset(skip).limit(limit).all()


@router.post("/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    req: AnnouncementCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Create a new announcement. CEO/Admin only."""
    verify_ceo_role(current_user)

    ann = models.Announcement(
        title=req.title,
        body=req.body,
        priority=req.priority,
        audience=req.audience,
        author="CEO Office",
        read_count=0,
        read_pct=0.0
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann

# 3. Enterprise Projects
@router.get("/projects", response_model=List[ProjectResponse])
def get_projects(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    projects = db.query(models.Project).order_by(models.Project.created_at.desc()).offset(skip).limit(limit).all()
    for proj in projects:
        proj.milestones = db.query(models.Milestone).filter(models.Milestone.project_id == proj.id).all()
    return projects

@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(req: ProjectCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    proj = models.Project(
        name=req.name,
        client=req.client,
        budget=req.budget,
        used=req.used,
        status=req.status,
        deadline=req.deadline,
        checklist=req.checklist
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    proj.milestones = []
    return proj

@router.patch("/projects/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, req: ProjectUpdate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if req.name is not None: proj.name = req.name
    if req.client is not None: proj.client = req.client
    if req.budget is not None: proj.budget = req.budget
    if req.used is not None: proj.used = req.used
    if req.status is not None: proj.status = req.status
    if req.deadline is not None: proj.deadline = req.deadline
    if req.checklist is not None: proj.checklist = req.checklist
        
    db.commit()
    db.refresh(proj)
    proj.milestones = db.query(models.Milestone).filter(models.Milestone.project_id == proj.id).all()
    return proj

@router.post("/projects/{project_id}/signoff", response_model=ProjectResponse)
def signoff_project(project_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    proj.status = "Completed"
    
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Projects",
        action_type="signoff",
        record_id=proj.id,
        change_diff=json.dumps({"status": "Completed"})
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(proj)
    proj.milestones = db.query(models.Milestone).filter(models.Milestone.project_id == proj.id).all()
    return proj

@router.delete("/projects/{project_id}")
def delete_project_by_ceo(project_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db.delete(proj)
    db.commit()
    return {"status": "success", "message": "Project deleted."}

@router.delete("/announcements/{ann_id}")
def delete_announcement(
    ann_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Delete an announcement. CEO/Admin only."""
    verify_ceo_role(current_user)
    ann = db.query(models.Announcement).filter(models.Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found.")
    
    # Delete related reads first to avoid foreign key constraint violations
    db.query(models.AnnouncementRead).filter(models.AnnouncementRead.announcement_id == ann_id).delete(synchronize_session=False)
    
    db.delete(ann)
    db.commit()
    return {"status": "success", "message": "Announcement removed."}


class UnreadUserResponse(BaseModel):
    id: int
    name: str
    department: Optional[str] = None


@router.get("/announcements/{ann_id}/unread-users", response_model=List[UnreadUserResponse])
def get_unread_users(
    ann_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """List users who haven't read a specific announcement. CEO/Admin only."""
    verify_ceo_role(current_user)
    ann = db.query(models.Announcement).filter(models.Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found.")

    read_user_ids = [
        r.user_id for r in db.query(models.AnnouncementRead).filter(
            models.AnnouncementRead.announcement_id == ann_id
        ).all()
    ]

    query = db.query(models.User).filter(models.User.is_active == True)
    if read_user_ids:
        query = query.filter(models.User.id.notin_(read_user_ids))
    
    unread_users = query.all()
    return unread_users

# 3. CEO Checker Approvals
@router.get("/approvals/pending")
def get_pending_approvals(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    payroll = db.query(models.PayrollRun).filter(models.PayrollRun.status == "maker_signed").offset(skip).limit(limit).all()
    claims = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.status == "pending").offset(skip).limit(limit).all()
    leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").offset(skip).limit(limit).all()
    loans = db.query(models.Loan).filter(models.Loan.status == "active", models.Loan.outstanding_balance > 0).offset(skip).limit(limit).all()
    
    enriched_payroll = []
    for p in payroll:
        # Calculate total amount from payslips
        total = db.query(func.sum(models.Payslip.net)).filter(models.Payslip.payroll_run_id == p.id).scalar() or 0.0
        enriched_payroll.append({
            "id": p.id,
            "month": p.month,
            "year": p.year,
            "maker_id": p.maker_id,
            "maker_signed_at": p.maker_signed_at.isoformat() if p.maker_signed_at else None,
            "total_amount": total
        })

    # Enrich with employee names for frontend display
    enriched_claims = []
    for c in claims:
        emp = db.query(models.User).filter(models.User.id == c.user_id).first()
        enriched_claims.append({
            "id": c.id,
            "user_id": c.user_id,
            "employee_name": emp.name if emp else f"User #{c.user_id}",
            "claim_date": c.claim_date.isoformat() if c.claim_date else None,
            "amount": c.amount,
            "category": c.category,
            "receipt_url": c.receipt_url,
            "tl_approval": c.tl_approval,
            "hr_approval": c.hr_approval,
            "status": c.status
        })

    enriched_leaves = []
    for l in leaves:
        emp = db.query(models.User).filter(models.User.id == l.user_id).first()
        enriched_leaves.append({
            "id": l.id,
            "user_id": l.user_id,
            "employee_name": emp.name if emp else f"User #{l.user_id}",
            "leave_type": l.leave_type,
            "from_date": l.from_date.isoformat() if l.from_date else None,
            "to_date": l.to_date.isoformat() if l.to_date else None,
            "days": l.days,
            "reason": l.reason,
            "status": l.status,
            "tl_approved_at": l.tl_approved_at.isoformat() if l.tl_approved_at else None,
            "hr_approved_at": l.hr_approved_at.isoformat() if l.hr_approved_at else None
        })

    enriched_loans = []
    for ln in loans:
        emp = db.query(models.User).filter(models.User.id == ln.user_id).first()
        enriched_loans.append({
            "id": ln.id,
            "user_id": ln.user_id,
            "employee_name": emp.name if emp else f"User #{ln.user_id}",
            "loan_amount": ln.loan_amount,
            "emi_amount": ln.emi_amount,
            "tenure": ln.tenure,
            "disbursed_at": ln.disbursed_at.isoformat() if ln.disbursed_at else None,
            "outstanding_balance": ln.outstanding_balance,
            "status": ln.status
        })

    return {
        "payrollRuns": enriched_payroll,
        "expenseClaims": enriched_claims,
        "leaveRequests": enriched_leaves,
        "loans": enriched_loans
    }

@router.post("/payroll/runs/{id}/sign-checker", response_model=PayrollRunResponse)
def sign_payroll_checker(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    run = db.query(models.PayrollRun).filter(models.PayrollRun.id == id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found.")
        
    run.status = "checker_signed"
    run.checker_id = current_user.name
    run.checker_signed_at = datetime.now()
    
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Finance",
        record_id=id,
        action_type="verify_doc",
        change_diff=json.dumps({"payroll_state": "checker_signed"})
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(run)
    return run

@router.post("/payroll/runs/{id}/transfer-bank", response_model=PayrollRunResponse)
def transfer_payroll_bank(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    run = db.query(models.PayrollRun).filter(models.PayrollRun.id == id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found.")
        
    run.status = "bank_transferred"
    run.bank_transfer_at = datetime.now()
    
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Finance",
        record_id=id,
        action_type="verify_doc",
        change_diff=json.dumps({"payroll_state": "bank_transferred"})
    )
    db.add(db_log)
    db.commit()
    db.refresh(run)
    return run

@router.post("/loans/{id}/approve", response_model=LoanResponse)
def approve_loan_ceo(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    loan = db.query(models.Loan).filter(models.Loan.id == id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan application not found.")
        
    loan.status = "active"
    loan.disbursed_at = datetime.now()
    
    db_notify = models.Notification(
        user_id=loan.user_id,
        message=f"Your loan of ₹{loan.loan_amount} has been approved and disbursed by the CEO.",
        type="success"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(loan)
    return loan

@router.post("/loans/{id}/reject", response_model=LoanResponse)
def reject_loan_ceo(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    loan = db.query(models.Loan).filter(models.Loan.id == id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan application not found.")
        
    loan.status = "rejected"
    loan.outstanding_balance = 0.0
    
    db_notify = models.Notification(
        user_id=loan.user_id,
        message=f"Your loan application of ₹{loan.loan_amount} was rejected by the CEO.",
        type="danger"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(loan)
    return loan

@router.post("/expenses/{id}/approve", response_model=ExpenseClaimResponse)
def approve_expense_ceo(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    claim = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found.")
        
    claim.status = "approved"
    
    db_notify = models.Notification(
        user_id=claim.user_id,
        message=f"Your expense claim of ₹{claim.amount} has been approved by the CEO.",
        type="success"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(claim)
    return claim

@router.post("/expenses/{id}/reject", response_model=ExpenseClaimResponse)
def reject_expense_ceo(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    claim = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found.")
        
    claim.status = "rejected"
    
    db_notify = models.Notification(
        user_id=claim.user_id,
        message=f"Your expense claim of ₹{claim.amount} was rejected by the CEO.",
        type="danger"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(claim)
    return claim

@router.post("/leaves/{id}/approve", response_model=LeaveRequestResponse)
def approve_leave_ceo(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    req.status = "approved" # Set to final approved status
    req.hr_approved_at = datetime.now()
    
    # Adjust balance
    bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.user_id == req.user_id).first()
    if bal:
        if req.leave_type == "CL": bal.CL -= req.days
        elif req.leave_type == "SL": bal.SL -= req.days
        elif req.leave_type == "EL": bal.EL -= req.days
        elif req.leave_type == "Maternity": bal.Maternity -= req.days
        
    db_notify = models.Notification(
        user_id=req.user_id,
        message=f"Your leave request from {req.from_date} to {req.to_date} was approved by the CEO.",
        type="success"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(req)
    return req

@router.post("/leaves/{id}/reject", response_model=LeaveRequestResponse)
def reject_leave_ceo(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    req.status = "rejected"
    
    db_notify = models.Notification(
        user_id=req.user_id,
        message=f"Your leave request from {req.from_date} to {req.to_date} was rejected by the CEO.",
        type="danger"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(req)
    return req

# 4. Projects & Blocker Escalations
@router.get("/projects/escalations", response_model=List[EscalationResponse])
def get_escalations(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    # Mark viewed by CEO
    escalations = db.query(models.Escalation).offset(skip).limit(limit).all()
    for esc in escalations:
        if not esc.ceo_viewed:
            esc.ceo_viewed = True
            
    db.commit()
    return escalations

@router.post("/projects/escalations/{id}/resolve", response_model=EscalationResponse)
def resolve_escalation_ceo(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    esc = db.query(models.Escalation).filter(models.Escalation.id == id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found.")
        
    esc.resolved = True
    db.commit()
    db.refresh(esc)
    return esc

@router.delete("/projects/escalations/{id}")
def delete_escalation_ceo(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    esc = db.query(models.Escalation).filter(models.Escalation.id == id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found.")
        
    db.delete(esc)
    db.commit()
    return {"status": "success", "message": "Escalation deleted."}

# 5. Configs & Audit Trails
@router.get("/audit-trail", response_model=List[AuditLogResponse])
def get_audit_trail(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    security.check_rbac_permission(db, current_user, "View Audit Logs")
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

@router.get("/configs")
def get_system_settings(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    settings_list = db.query(models.SystemSetting).offset(skip).limit(limit).all()
    result = {s.key: s.value for s in settings_list}
    
    if "designation_list" in result:
        try:
            designations = json.loads(result["designation_list"])
            for d in designations:
                if d.get("name"):
                    count = db.query(models.User).filter(func.lower(models.User.designation) == str(d["name"]).lower()).count()
                    d["count"] = count
            result["designation_list"] = json.dumps(designations)
        except Exception:
            pass

    if "department_tree" in result:
        def update_dept_headcount(nodes):
            total_tree_count = 0
            for node in nodes:
                if node.get("name"):
                    direct_count = db.query(models.User).filter(func.lower(models.User.department) == str(node["name"]).lower()).count()
                    sub_count = 0
                    if "children" in node and isinstance(node["children"], list):
                        sub_count = update_dept_headcount(node["children"])
                    node["headcount"] = direct_count + sub_count
                    total_tree_count += node["headcount"]
            return total_tree_count

        try:
            dept_tree = json.loads(result["department_tree"])
            update_dept_headcount(dept_tree)
            result["department_tree"] = json.dumps(dept_tree)
        except Exception:
            pass

    return result

@router.post("/configs")
def update_system_setting(req: ConfigValueRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == req.key).first()
    if not setting:
        setting = models.SystemSetting(key=req.key, value=req.value)
        db.add(setting)
    else:
        setting.value = req.value
        
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Settings",
        action_type="CHANGED",
        change_diff=json.dumps({"config_key": req.key, "new_value": req.value})
    )
    db.add(db_log)
    db.commit()
    return {"status": "success", "key": req.key, "value": req.value}

@router.post("/configs/upload-logo")
def upload_company_logo(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    import os
    import time
    upload_dir = os.path.join("uploads", "logo")
    os.makedirs(upload_dir, exist_ok=True)
    
    unique_filename = f"{int(time.time())}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        import shutil
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"/{file_path.replace(os.sep, '/')}"
    
    # Save to configs
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "company_logo").first()
    if not setting:
        setting = models.SystemSetting(key="company_logo", value=file_url)
        db.add(setting)
    else:
        setting.value = file_url
        
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Settings",
        action_type="CHANGED",
        change_diff=json.dumps({"config_key": "company_logo", "new_value": file_url})
    )
    db.add(db_log)
    db.commit()
    
    return {"status": "success", "file_url": file_url}

# --- Holidays ---

class HolidayRequest(BaseModel):
    name: str
    date: str
    type: str = "Mandatory"

@router.get("/holidays")
def get_holidays(db: Session = Depends(database.get_db)):
    holidays = db.query(models.Holiday).all()
    return [{"id": h.id, "name": h.name, "date": h.date, "type": h.type} for h in holidays]

@router.post("/holidays")
def add_holiday(req: HolidayRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    new_holiday = models.Holiday(name=req.name, date=req.date, type=req.type)
    db.add(new_holiday)
    db.commit()
    db.refresh(new_holiday)
    return {"id": new_holiday.id, "name": new_holiday.name, "date": new_holiday.date, "type": new_holiday.type}

@router.put("/holidays/{holiday_id}")
def update_holiday(holiday_id: int, req: HolidayRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    holiday = db.query(models.Holiday).filter(models.Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    holiday.name = req.name
    holiday.date = req.date
    holiday.type = req.type
    db.commit()
    db.refresh(holiday)
    return {"id": holiday.id, "name": holiday.name, "date": holiday.date, "type": holiday.type}

@router.delete("/holidays/{holiday_id}")
def delete_holiday(holiday_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    holiday = db.query(models.Holiday).filter(models.Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(holiday)
    db.commit()
    return {"status": "success"}

# ─── 6. Finance Portal Data & Commands ────────────────────@router.post("/finance/salary-components")
def update_salary_components(req: SalaryStructureListRequest, db: Session = Depends(database.get_db)):
    # Clear existing
    db.query(models.SalaryComponent).delete()
    db.commit()
    # Add new
    for c in req.components:
        comp = models.SalaryComponent(name=c.name, type=c.type, calc=c.calc, value=c.value, tax=c.tax)
        db.add(comp)
    db.commit()
    return {"status": "success"}

from sqlalchemy import func

class SalaryComponentRequest(BaseModel):
    id: int
    name: str
    type: str
    calc: str
    value: float
    tax: bool

class SalaryStructureListRequest(BaseModel):
    components: List[SalaryComponentRequest]



@router.post("/finance/budgets/{id}/approve")
def approve_finance_budget(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)

    budget = db.query(models.DepartmentBudget).filter(models.DepartmentBudget.id == id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget request not found.")
    
    budget.status = "approved"
    
    # Log action
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Finance",
        record_id=id,
        action_type="approve_budget",
        change_diff=json.dumps({"budget_id": id, "status": "approved"})
    )
    db.add(db_log)
    db.commit()
    return {"status": "success"}

@router.post("/finance/budgets/{id}/reject")
def reject_finance_budget(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)

    budget = db.query(models.DepartmentBudget).filter(models.DepartmentBudget.id == id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget request not found.")
    
    budget.status = "rejected"
    
    # Log action
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Finance",
        record_id=id,
        action_type="reject_budget",
        change_diff=json.dumps({"budget_id": id, "status": "rejected"})
    )
    db.add(db_log)
    db.commit()
    return {"status": "success"}



# ─── Projects (CEO Portfolio View) ───────────────────────────────────────────

class ProjectResponseCEO(BaseModel):
    id: int
    name: str
    client: str
    budget: float
    used: float
    status: str
    deadline: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectUpdateCEORequest(BaseModel):
    name: Optional[str] = None
    client: Optional[str] = None
    budget: Optional[float] = None
    used: Optional[float] = None
    status: Optional[str] = None
    deadline: Optional[str] = None


router_get_projects = None  # placeholder


def _get_router():
    return router


@router.get("/projects", response_model=List[ProjectResponseCEO])
def ceo_get_projects(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.Project).order_by(models.Project.id.desc()).offset(skip).limit(limit).all()


@router.patch("/projects/{id}", response_model=ProjectResponseCEO)
def ceo_update_project(id: int, req: ProjectUpdateCEORequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    if req.name is not None:
        project.name = req.name
    if req.client is not None:
        project.client = req.client
    if req.budget is not None:
        project.budget = req.budget
    if req.used is not None:
        project.used = req.used
    if req.status is not None:
        project.status = req.status
    if req.deadline is not None:
        project.deadline = req.deadline
    db.commit()
    db.refresh(project)
    return project


@router.post("/projects/{id}/signoff", response_model=ProjectResponseCEO)
def ceo_signoff_project(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    project.status = "Completed"
    db.commit()
    db.refresh(project)
    return project


# ─── Dashboard Summary & Pending Approvals ──────────────────────────────────

@router.get("/dashboard/summary")
def get_dashboard_summary(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    headcount = db.query(models.User).filter(models.User.status == "active").count()
    active_blockers = db.query(models.Escalation).filter(models.Escalation.resolved == False).count()
    
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").count()
    pending_expenses = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.status == "pending").count()
    pending_payroll = db.query(models.PayrollRun).filter(models.PayrollRun.status.in_(["maker_signed", "draft"])).count()
    pending_loans = db.query(models.Loan).filter(models.Loan.status == "pending").count()
    
    pending_approvals = pending_leaves + pending_expenses + pending_payroll + pending_loans
    
    okrs = db.query(models.Objective).offset(skip).limit(limit).all()
    avg_okr = sum([o.progress for o in okrs]) / len(okrs) if okrs else 75
    
    active_projects = db.query(models.Project).filter(models.Project.status == "Active").count()
    
    run = db.query(models.PayrollRun).order_by(models.PayrollRun.id.desc()).first()
    monthly_payroll = 0
    if run:
        monthly_payroll = db.query(func.sum(models.Payslip.net)).filter(models.Payslip.month == run.month, models.Payslip.year == run.year).scalar() or 0
        
    return {
        "headcount": headcount,
        "activeBlockers": active_blockers,
        "pendingApprovalsCount": pending_approvals,
        "okrProgressAverage": round(avg_okr),
        "riskIndex": "High" if active_blockers > 2 else "Low",
        "monthlyPayroll": monthly_payroll,
        "activeProjects": active_projects
    }


# ─── Reports / Analytics ─────────────────────────────────────────────────────

from collections import defaultdict
from datetime import date as date_obj

@router.get("/reports/analytics")
def get_reports_analytics(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)

    MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # ── 1. HEADCOUNT: group users by creation month ─────────────────────────
    all_users = db.query(models.User).offset(skip).limit(limit).all()
    headcount_by_month = defaultdict(lambda: {"count": 0, "new": 0, "left": 0})
    total = 0
    for u in sorted(all_users, key=lambda x: x.created_at or date_obj.min):
        if u.created_at:
            m = MONTH_NAMES[u.created_at.month - 1]
            total += 1
            headcount_by_month[m]["new"] += 1
        if u.status in ("terminated", "resigned"):
            if u.created_at:
                m = MONTH_NAMES[u.created_at.month - 1]
                headcount_by_month[m]["left"] += 1

    # Build cumulative headcount
    cumulative = 0
    headcount_data = []
    for m in MONTH_NAMES[:7]:
        data = headcount_by_month.get(m, {"new": 0, "left": 0})
        cumulative += data["new"] - data["left"]
        headcount_data.append({
            "month": m,
            "count": max(len(all_users), cumulative),
            "new": data["new"],
            "left": data["left"]
        })

    # ── 2. PAYROLL COST: from PayrollRun or estimate from users ───────────
    payroll_runs = db.query(models.PayrollRun).order_by(models.PayrollRun.year, models.PayrollRun.month).offset(skip).limit(limit).all()
    payroll_data = []
    if payroll_runs:
        for run in payroll_runs[-7:]:
            m = MONTH_NAMES[run.month - 1]
            # Get actual net from payslips
            total_net = db.query(func.sum(models.Payslip.net)).filter(
                models.Payslip.month == run.month,
                models.Payslip.year == run.year
            ).scalar() or 0.0
            cost_m = round(total_net / 1_000_000, 2) if total_net else 0.0
            payroll_data.append({"month": m, "cost": cost_m})

    # ── 3. ATTENDANCE: group by department ───────────────────────────────
    dept_attendance = defaultdict(lambda: {"total": 0, "present": 0, "wfh": 0, "leave": 0})
    all_att = db.query(models.Attendance).offset(skip).limit(limit).all()
    for rec in all_att:
        user = db.query(models.User).filter(models.User.id == rec.user_id).first()
        dept = (user.department or "Engineering") if user else "Engineering"
        dept_attendance[dept]["total"] += 1
        if rec.status in ("present", "late"):
            dept_attendance[dept]["present"] += 1
            if rec.work_mode == "wfh":
                dept_attendance[dept]["wfh"] += 1
        elif rec.status in ("absent", "half-day", "leave"):
            dept_attendance[dept]["leave"] += 1

    attendance_data = []
    for dept, counts in dept_attendance.items():
        if counts["total"] > 0:
            attendance_data.append({
                "dept": dept,
                "present": round(counts["present"] / counts["total"] * 100, 1),
                "wfh": round(counts["wfh"] / counts["total"] * 100, 1),
                "leave": round(counts["leave"] / counts["total"] * 100, 1)
            })

    # ── 4. LEAVE TRENDS: monthly breakdown by type ────────────────────────
    leave_by_month = defaultdict(lambda: {"casual": 0, "sick": 0})
    all_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status != "denied").offset(skip).limit(limit).all()
    for lr in all_leaves:
        m = MONTH_NAMES[lr.from_date.month - 1]
        if lr.leave_type in ("CL", "EL"):
            leave_by_month[m]["casual"] += int(lr.days)
        elif lr.leave_type in ("SL",):
            leave_by_month[m]["sick"] += int(lr.days)

    leave_trends = []
    for m in MONTH_NAMES[:7]:
        data = leave_by_month.get(m, {"casual": 0, "sick": 0})
        leave_trends.append({"month": m, "casual": data["casual"], "sick": data["sick"]})

    # ── 5. PROJECT STATUS: from real Project table ────────────────────────
    projects = db.query(models.Project).offset(skip).limit(limit).all()
    status_counts = defaultdict(int)
    for p in projects:
        status_counts[p.status] += 1

    project_status_data = [
        {"name": "Active", "value": status_counts.get("Active", 0)},
        {"name": "Completed", "value": status_counts.get("Completed", 0)},
        {"name": "At Risk", "value": status_counts.get("At Risk", 0)},
        {"name": "On Hold", "value": status_counts.get("On Hold", 0)},
    ]

    # ── 6. ATTRITION: resignations per month / total headcount ───────────
    all_resignations = db.query(models.Resignation).offset(skip).limit(limit).all()
    resign_by_month = defaultdict(int)
    for r in all_resignations:
        m = MONTH_NAMES[r.resignation_date.month - 1]
        resign_by_month[m] += 1

    headcount_est = max(len(all_users), 1)
    attrition_data = []
    for m in MONTH_NAMES[:7]:
        rate = round((resign_by_month.get(m, 0) / headcount_est) * 100, 2)
        attrition_data.append({"month": m, "rate": rate})

    # Department list for filter
    departments = list(set(u.department for u in all_users if u.department))

    return {
        "headcount": headcount_data,
        "payroll": payroll_data,
        "attendance": attendance_data,
        "leaveTrends": leave_trends,
        "projectStatus": project_status_data,
        "attrition": attrition_data,
        "departments": sorted(departments),
        "totalEmployees": len(all_users),
        "totalProjects": len(projects),
    }


# ─── Corporate OKRs & Strategy ───────────────────────────────────────────────

@router.get("/okrs", response_model=List[ObjectiveResponse])
def get_okrs(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Objective).offset(skip).limit(limit).all()


class KRProgressUpdate(BaseModel):
    current: int


@router.post("/okrs/key-results/{id}/progress")
def update_kr_progress(
    id: int, 
    req: KRProgressUpdate, 
    current_user: models.User = Depends(security.get_current_user), 
    db: Session = Depends(database.get_db)
):
    verify_ceo_role(current_user)
    kr = db.query(models.KeyResult).filter(models.KeyResult.id == id).first()
    if not kr:
        raise HTTPException(status_code=404, detail="Key Result not found.")
    
    old_current = kr.current
    kr.current = req.current
    
    # Recalculate parent objective progress and status
    obj = kr.objective
    if obj and obj.krs:
        total_pct = 0.0
        for k in obj.krs:
            total_pct += min(100.0, (k.current / k.target) * 100)
        obj.progress = int(total_pct / len(obj.krs))
        
        # Threshold-based status transition
        if obj.progress >= 70:
            obj.status = "On Track"
        elif obj.progress >= 40:
            obj.status = "At Risk"
        else:
            obj.status = "Off Track"
            
    # Write to Audit trail
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Strategy & OKRs",
        action_type="update_progress",
        change_diff=json.dumps({
            "key_result_title": kr.title,
            "old_current": old_current,
            "new_current": req.current,
            "new_objective_progress": obj.progress if obj else None
        })
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(kr)
    return {"status": "success", "message": "Key result progress updated successfully."}


# ─── 7. Manual Payroll Processing (CEO Only) ─────────────────────────────────

class ProcessPayrollRequest(BaseModel):
    month: int
    year: int
    basic: float
    hra: float
    allowances: float
    bonus: float
    epf: float
    tds: float
    lop: float
    worked_days: Optional[float] = None
    arrear_days: Optional[float] = 0.0
    lop_days: Optional[float] = 0.0
    lop_days_reversed: Optional[float] = 0.0
    payment_method: str
    transaction_ref: str
    payment_date: Optional[str] = None

@router.get("/payroll/pending")
def get_pending_payrolls(month: int, year: int, current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    # Get all active users
    users = db.query(models.User).filter(models.User.status == "active").offset(skip).limit(limit).all()
    pending = []
    
    for u in users:
        # Check if already paid for this month and year
        existing = db.query(models.Payslip).filter(models.Payslip.user_id == u.id, models.Payslip.month == month, models.Payslip.year == year).first()
        if existing and existing.status == "paid":
            continue
            
        # Extract base salary from documents JSON or default to 0
        base = 0.0
        if u.documents:
            try:
                docs = json.loads(u.documents) if isinstance(u.documents, str) else u.documents
                base = float(docs.get("base_salary", 0.0))
            except Exception:
                pass
        
        hra = base * 0.4
        allowances = base * 0.2
        bonus = 0.0
        
        epf = base * 0.12
        tds = base * 0.1
        
        gross = base + hra + allowances + bonus
        deductions = epf + tds
        net = gross - deductions
        
        pending.append({
            "employee_id": u.id,
            "employee_name": u.name,
            "role": u.role,
            "department": u.department,
            "basic": base,
            "hra": hra,
            "allowances": allowances,
            "bonus": bonus,
            "epf": epf,
            "tds": tds,
            "lop": 0.0,
            "net": net,
            "status": "pending"
        })
        
    return pending

@router.post("/payroll/process/{user_id}")
def process_manual_payroll(user_id: int, req: ProcessPayrollRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    gross = req.basic + req.hra + req.allowances + req.bonus
    deductions = req.epf + req.tds + req.lop
    net = gross - deductions
    
    # Check if exists
    payslip = db.query(models.Payslip).filter(models.Payslip.user_id == user_id, models.Payslip.month == req.month, models.Payslip.year == req.year).first()
    if not payslip:
        payslip = models.Payslip(user_id=user_id, month=req.month, year=req.year)
        db.add(payslip)
        
    payslip.basic = req.basic
    payslip.hra = req.hra
    payslip.allowances = req.allowances + req.bonus
    payslip.da = 0.0
    payslip.epf = req.epf
    payslip.tds = req.tds
    payslip.lop = req.lop
    payslip.net = net
    payslip.status = "paid"
    payslip.payment_method = req.payment_method
    payslip.transaction_ref = req.transaction_ref
    if req.payment_date:
        payslip.payment_date = datetime.strptime(req.payment_date, "%Y-%m-%d")
    else:
        payslip.payment_date = datetime.now()
    payslip.worked_days = req.worked_days
    payslip.arrear_days = req.arrear_days
    payslip.lop_days = req.lop_days
    payslip.lop_days_reversed = req.lop_days_reversed
    payslip.processed_by_id = current_user.id
    
    # Log Action
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Payroll",
        action_type="process_payroll",
        change_diff=json.dumps({"user_id": user_id, "month": req.month, "year": req.year, "net": net})
    )
    db.add(db_log)
    
    # Notification
    db_notify = models.Notification(
        user_id=user_id,
        message=f"Your payroll for month {req.month}/{req.year} has been processed.",
        type="success"
    )
    db.add(db_notify)
    
    db.commit()
    return {"status": "success", "message": "Payroll processed successfully"}

@router.get("/payroll/history")
def get_payroll_history(month: Optional[int] = None, year: Optional[int] = None, current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    query = db.query(models.Payslip).filter(models.Payslip.status == "paid")
    if month:
        query = query.filter(models.Payslip.month == month)
    if year:
        query = query.filter(models.Payslip.year == year)
        
    payslips = query.order_by(models.Payslip.payment_date.desc()).all()
    
    result = []
    for p in payslips:
        emp = p.user
        
        doj = getattr(emp, 'doj', None)
        if hasattr(doj, 'isoformat'):
            doj = doj.isoformat()

        result.append({
            "id": p.id,
            "employee_name": emp.name if emp else "Unknown",
            "department": emp.department if emp else "Unknown",
            "designation": emp.role if emp else "Unknown",
            "location": getattr(emp, "location", "Unknown"),
            "doj": doj,
            "bank_name": emp.bank_name if emp else "Unknown",
            "account_number": emp.account_number if emp else "Unknown",
            "pan_number": getattr(emp, "pan_number", "Unknown"),
            "pf_number": getattr(emp, "pf_number", "Unknown"),
            "uan": getattr(emp, "uan", "Unknown"),
            "esi_number": getattr(emp, "esi_number", "Unknown"),
            "month": p.month,
            "year": p.year,
            "basic": p.basic,
            "hra": p.hra,
            "allowances": p.allowances,
            "epf": p.epf,
            "tds": p.tds,
            "lop": p.lop,
            "worked_days": p.worked_days,
            "arrear_days": p.arrear_days,
            "lop_days": p.lop_days,
            "lop_days_reversed": p.lop_days_reversed,
            "net": p.net,
            "payment_method": p.payment_method,
            "transaction_ref": p.transaction_ref,
            "payment_date": p.payment_date.isoformat() if p.payment_date else None
        })
        
    return result

# ==========================
# VENDOR MANAGEMENT
# ==========================

@router.get("/vendors", response_model=List[VendorResponse])
def get_vendors(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.Vendor).offset(skip).limit(limit).all()

@router.post("/vendors", response_model=VendorResponse)
def create_vendor(vendor: VendorCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    db_vendor = db.query(models.Vendor).filter(models.Vendor.vendor_id == vendor.vendor_id).first()
    if db_vendor:
        raise HTTPException(status_code=400, detail="Vendor ID already exists")
    
    new_vendor = models.Vendor(**vendor.dict())
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

@router.delete("/vendors/{vendor_id}")
def delete_vendor(vendor_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    db_vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    db.delete(db_vendor)
    db.commit()
    return {"status": "success"}

# ==========================
# DOCUMENT VAULT
# ==========================

UPLOAD_DIR = "uploads/vault"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/vault", response_model=List[VaultDocumentResponse])
def get_vault_documents(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.VaultDocument).offset(skip).limit(limit).all()

@router.post("/vault/upload", response_model=VaultDocumentResponse)
def upload_vault_document(
    doc_id: str = Form(...),
    name: str = Form(...),
    type: str = Form(...),
    parties: str = Form(""),
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    verify_ceo_role(current_user)
    
    # Check if doc_id exists
    existing = db.query(models.VaultDocument).filter(models.VaultDocument.doc_id == doc_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Document ID already exists")

    file_path = f"{UPLOAD_DIR}/{doc_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Calculate hash
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        hasher.update(f.read())
    file_hash = hasher.hexdigest()
    
    new_doc = models.VaultDocument(
        doc_id=doc_id,
        name=name,
        type=type,
        sign_status="Pending",
        file_url=f"/{file_path}",
        file_hash=file_hash,
        parties=parties
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.put("/vault/{doc_id}/sign")
def sign_vault_document(doc_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    db_doc = db.query(models.VaultDocument).filter(models.VaultDocument.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db_doc.sign_status = "Signed"
    db.commit()
    return {"status": "success", "message": "Document signed successfully"}

@router.post("/payroll/process/{user_id}")
def process_manual_payroll(user_id: int, req: ProcessPayrollRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    gross = req.basic + req.hra + req.allowances + req.bonus
    deductions = req.epf + req.tds + req.lop
    net = gross - deductions
    
    # Check if exists
    payslip = db.query(models.Payslip).filter(models.Payslip.user_id == user_id, models.Payslip.month == req.month, models.Payslip.year == req.year).first()
    if not payslip:
        payslip = models.Payslip(user_id=user_id, month=req.month, year=req.year)
        db.add(payslip)
        
    payslip.basic = req.basic
    payslip.hra = req.hra
    payslip.allowances = req.allowances + req.bonus
    payslip.da = 0.0
    payslip.epf = req.epf
    payslip.tds = req.tds
    payslip.lop = req.lop
    payslip.net = net
    payslip.status = "paid"
    payslip.payment_method = req.payment_method
    payslip.transaction_ref = req.transaction_ref
    payslip.payment_date = datetime.now()
    payslip.worked_days = req.worked_days
    payslip.arrear_days = req.arrear_days
    payslip.lop_days = req.lop_days
    payslip.lop_days_reversed = req.lop_days_reversed
    payslip.processed_by_id = current_user.id
    
    # Log Action
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Payroll",
        action_type="process_payroll",
        change_diff=json.dumps({"user_id": user_id, "month": req.month, "year": req.year, "net": net})
    )
    db.add(db_log)
    
    # Notification
    db_notify = models.Notification(
        user_id=user_id,
        message=f"Your payroll for month {req.month}/{req.year} has been processed.",
        type="success"
    )
    db.add(db_notify)
    
    db.commit()
    return {"status": "success", "message": "Payroll processed successfully"}

@router.get("/payroll/history")
def get_payroll_history(month: Optional[int] = None, year: Optional[int] = None, current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    query = db.query(models.Payslip).filter(models.Payslip.status == "paid")
    if month:
        query = query.filter(models.Payslip.month == month)
    if year:
        query = query.filter(models.Payslip.year == year)
        
    payslips = query.order_by(models.Payslip.payment_date.desc()).all()
    
    result = []
    for p in payslips:
        emp = p.user
        
        doj = getattr(emp, 'doj', None)
        if hasattr(doj, 'isoformat'):
            doj = doj.isoformat()

        result.append({
            "id": p.id,
            "employee_name": emp.name if emp else "Unknown",
            "department": emp.department if emp else "Unknown",
            "designation": emp.role if emp else "Unknown",
            "location": getattr(emp, "location", "Unknown"),
            "doj": doj,
            "bank_name": emp.bank_name if emp else "Unknown",
            "account_number": emp.account_number if emp else "Unknown",
            "pan_number": getattr(emp, "pan_number", "Unknown"),
            "pf_number": getattr(emp, "pf_number", "Unknown"),
            "uan": getattr(emp, "uan", "Unknown"),
            "esi_number": getattr(emp, "esi_number", "Unknown"),
            "month": p.month,
            "year": p.year,
            "basic": p.basic,
            "hra": p.hra,
            "allowances": p.allowances,
            "epf": p.epf,
            "tds": p.tds,
            "lop": p.lop,
            "worked_days": p.worked_days,
            "arrear_days": p.arrear_days,
            "lop_days": p.lop_days,
            "lop_days_reversed": p.lop_days_reversed,
            "net": p.net,
            "payment_method": p.payment_method,
            "transaction_ref": p.transaction_ref,
            "payment_date": p.payment_date.isoformat() if p.payment_date else None
        })
        
    return result

# ==========================
# VENDOR MANAGEMENT
# ==========================

@router.get("/vendors", response_model=List[VendorResponse])
def get_vendors(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.Vendor).offset(skip).limit(limit).all()

@router.post("/vendors", response_model=VendorResponse)
def create_vendor(vendor: VendorCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    db_vendor = db.query(models.Vendor).filter(models.Vendor.vendor_id == vendor.vendor_id).first()
    if db_vendor:
        raise HTTPException(status_code=400, detail="Vendor ID already exists")
    
    new_vendor = models.Vendor(**vendor.dict())
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

@router.delete("/vendors/{vendor_id}")
def delete_vendor(vendor_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    db_vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    db.delete(db_vendor)
    db.commit()
    return {"status": "success"}

# ==========================
# DOCUMENT VAULT
# ==========================

UPLOAD_DIR = "uploads/vault"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/vault", response_model=List[VaultDocumentResponse])
def get_vault_documents(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.VaultDocument).offset(skip).limit(limit).all()

@router.post("/vault/upload", response_model=VaultDocumentResponse)
def upload_vault_document(
    doc_id: str = Form(...),
    name: str = Form(...),
    type: str = Form(...),
    parties: str = Form(""),
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    verify_ceo_role(current_user)
    
    # Check if doc_id exists
    existing = db.query(models.VaultDocument).filter(models.VaultDocument.doc_id == doc_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Document ID already exists")

    file_path = f"{UPLOAD_DIR}/{doc_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Calculate hash
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        hasher.update(f.read())
    file_hash = hasher.hexdigest()
    
    new_doc = models.VaultDocument(
        doc_id=doc_id,
        name=name,
        type=type,
        sign_status="Pending",
        file_url=f"/{file_path}",
        file_hash=file_hash,
        parties=parties
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.put("/vault/{doc_id}/sign")
def sign_vault_document(doc_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    db_doc = db.query(models.VaultDocument).filter(models.VaultDocument.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db_doc.sign_status = "Signed"
    db.commit()
    return {"status": "success", "message": "Document signed successfully"}

@router.get("/vault/{id}/download")
def download_vault_document(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    db_doc = db.query(models.VaultDocument).filter(models.VaultDocument.id == id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Construct full file path
    # db_doc.file_url is usually "/uploads/vault/..."
    file_path = db_doc.file_url.lstrip("/")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File missing on disk")
        
    return FileResponse(path=file_path, filename=db_doc.name)

# ─── Company Setup (Departments, Designations, Shifts, Holidays) ──────

class DepartmentBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    headcount: Optional[int] = 0

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    headcount: Optional[int] = None

class DesignationBase(BaseModel):
    name: str
    department_id: int
    level: str

class ShiftBase(BaseModel):
    name: str
    start_time: str
    end_time: str
    days: str

class HolidayBase(BaseModel):
    name: str
    date: str
    type: str

@router.get("/departments")
def get_departments(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    depts = db.query(models.Department).offset(skip).limit(limit).all()
    dept_dicts = [{"id": d.id, "name": d.name, "parent_id": d.parent_id, "headcount": 0} for d in depts]
    
    for d in dept_dicts:
        d["direct_count"] = db.query(models.User).filter(func.lower(models.User.department) == str(d["name"]).lower()).count()
        
    def get_total_count(dept_id):
        dept = next((x for x in dept_dicts if x["id"] == dept_id), None)
        if not dept: return 0
        total = dept["direct_count"]
        children = [x for x in dept_dicts if x["parent_id"] == dept_id]
        for child in children:
            total += get_total_count(child["id"])
        return total
        
    for d in dept_dicts:
        d["headcount"] = get_total_count(d["id"])
        
    return dept_dicts

# ─── Finance Module APIs (New) ──────────────────────────────────────────────

class BudgetBase(BaseModel):
    department_id: int
    title: str
    requested_by: str
    variance: str
    amount: str
    status: str = "pending"

class ARInvoiceBase(BaseModel):
    client_name: str
    invoice_number: str
    amount: str
    status: str = "Pending"
    days_overdue: int = 0

class APInvoiceBase(BaseModel):
    vendor_id: int
    ref_number: str
    amount: str
    due_date: str

class StatutoryBase(BaseModel):
    type: str
    amount: str
    due_date: str

class SalaryCompBase(BaseModel):
    name: str
    type: str
    calc: str
    value: float
    tax: bool

@router.get("/finance/kpis")
def get_kpis(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    kpi_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_kpi_data").first()
    if kpi_setting:
        return json.loads(kpi_setting.value)
    return {
        "revenue": { "val": "₹0M", "trend": "0%", "up": True },
        "grossProfit": { "val": "₹0M", "trend": "0%", "up": True },
        "netProfit": { "val": "₹0M", "trend": "0%", "up": True },
        "opex": { "val": "₹0M", "trend": "0%", "up": False },
        "cash": { "val": "₹0M", "trend": "0%", "up": True },
        "burnRate": { "val": "₹0/mo", "trend": "Stable", "up": None }
    }

@router.get("/finance/trends")
def get_finance_trends(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.FinanceTrend).offset(skip).limit(limit).all()

@router.get("/finance/budgets-list")
def get_budgets(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    budgets = db.query(models.DepartmentBudget).offset(skip).limit(limit).all()
    res = []
    for b in budgets:
        dept = db.query(models.Department).filter(models.Department.id == b.department_id).first()
        res.append({
            "id": b.id,
            "dept": dept.name if dept else "Unknown",
            "department_id": b.department_id,
            "title": b.title,
            "reqBy": b.requested_by,
            "variance": b.variance,
            "amount": b.amount,
            "status": b.status
        })
    return res

@router.get("/finance/ar")
def get_ar(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    ars = db.query(models.ARInvoice).offset(skip).limit(limit).all()
    return [{"id": a.id, "client": a.client_name, "invoice": a.invoice_number, "amount": a.amount, "status": a.status, "daysOverdue": a.days_overdue} for a in ars]

@router.get("/finance/ap")
def get_ap(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    aps = db.query(models.APInvoice).offset(skip).limit(limit).all()
    res = []
    for a in aps:
        vendor = db.query(models.Vendor).filter(models.Vendor.id == a.vendor_id).first()
        res.append({"id": a.id, "vendor": vendor.name if vendor else "Unknown", "vendor_id": a.vendor_id, "ref": a.ref_number, "amount": a.amount, "dueDate": a.due_date})
    return res

@router.get("/finance/statutory-list")
def get_statutory(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    stats = db.query(models.StatutoryCompliance).offset(skip).limit(limit).all()
    return [{"id": s.id, "type": s.type, "amount": s.amount, "dueDate": s.due_date} for s in stats]

@router.get("/finance/salary-components")
def get_salary_components(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    comps = db.query(models.SalaryComponent).offset(skip).limit(limit).all()
    return [{"id": c.id, "name": c.name, "type": c.type, "calc": c.calc, "value": c.value, "tax": c.tax} for c in comps]

@router.get("/finance/payroll-register")
def get_payroll_register(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    # Fetch from real PayrollRuns and Payslips
    runs = db.query(models.PayrollRun).offset(skip).limit(limit).all()
    res = []
    for r in runs:
        slips = db.query(models.Payslip).filter(models.Payslip.payroll_run_id == r.id).offset(skip).limit(limit).all()
        for s in slips:
            user = db.query(models.User).filter(models.User.id == s.user_id).first()
            res.append({
                "id": s.id,
                "name": user.name if user else f"User {s.user_id}",
                "dept": user.department if user else "Unknown",
                "gross": f"₹{int(s.gross_pay):,}",
                "net": f"₹{int(s.net_pay):,}",
                "status": r.status.capitalize()
            })
    return res

@router.get("/finance/approvals-list")
def get_finance_approvals(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    db_claims = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.status == "pending").offset(skip).limit(limit).all()
    db_loans = db.query(models.Loan).filter(models.Loan.status == "active", models.Loan.outstanding_balance > 0, models.Loan.disbursed_at.is_(None)).offset(skip).limit(limit).all()

    approvals_list = []
    for c in db_claims:
        emp = db.query(models.User).filter(models.User.id == c.user_id).first()
        approvals_list.append({
            "id": c.id,
            "type": "Expense Claim",
            "title": f"{c.category} Reimbursement - {emp.name if emp else f'User #{c.user_id}'}",
            "amount": f"₹{int(c.amount):,}",
            "status": c.status,
            "risk": "Low" if c.amount < 10000 else "Medium",
            "rawType": "expense"
        })
    for l in db_loans:
        emp = db.query(models.User).filter(models.User.id == l.user_id).first()
        approvals_list.append({
            "id": l.id,
            "type": "Loan Request",
            "title": f"Personal Loan Application for {emp.name if emp else f'User #{l.user_id}'}",
            "amount": f"₹{int(l.loan_amount):,}",
            "status": "pending",
            "risk": "High" if l.loan_amount >= 100000 else "Medium",
            "rawType": "loan"
        })
    return approvals_list


@router.post("/departments")
def create_department(req: DepartmentCreate, db: Session = Depends(database.get_db)):
    dept = models.Department(name=req.name, parent_id=req.parent_id, headcount=req.headcount)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.put("/departments/{id}")
def update_department(id: int, req: DepartmentUpdate, db: Session = Depends(database.get_db)):
    dept = db.query(models.Department).filter(models.Department.id == id).first()
    if dept:
        if req.name is not None: dept.name = req.name
        if req.parent_id is not None: dept.parent_id = req.parent_id
        if req.headcount is not None: dept.headcount = req.headcount
        db.commit()
        db.refresh(dept)
    return dept

@router.delete("/departments/{id}")
def delete_department(id: int, db: Session = Depends(database.get_db)):
    dept = db.query(models.Department).filter(models.Department.id == id).first()
    if dept:
        db.delete(dept)
        db.commit()
    return {"status": "success"}

@router.get("/designations")
def get_designations(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    desigs = db.query(models.Designation).offset(skip).limit(limit).all()
    res = []
    for d in desigs:
        dept = db.query(models.Department).filter(models.Department.id == d.department_id).first()
        count = db.query(models.User).filter(func.lower(models.User.designation) == str(d.name).lower()).count()
        res.append({
            "id": d.id,
            "name": d.name,
            "department_id": d.department_id,
            "dept": dept.name if dept else "Unknown",
            "level": d.level,
            "count": count
        })
    return res

@router.post("/designations")
def create_designation(req: DesignationBase, db: Session = Depends(database.get_db)):
    desig = models.Designation(name=req.name, department_id=req.department_id, level=req.level)
    db.add(desig)
    db.commit()
    db.refresh(desig)
    return desig

@router.put("/designations/{id}")
def update_designation(id: int, req: DesignationBase, db: Session = Depends(database.get_db)):
    desig = db.query(models.Designation).filter(models.Designation.id == id).first()
    if desig:
        desig.name = req.name
        desig.department_id = req.department_id
        desig.level = req.level
        db.commit()
        db.refresh(desig)
    return desig

@router.delete("/designations/{id}")
def delete_designation(id: int, db: Session = Depends(database.get_db)):
    desig = db.query(models.Designation).filter(models.Designation.id == id).first()
    if desig:
        db.delete(desig)
        db.commit()
    return {"status": "success"}

@router.get("/shifts")
def get_shifts(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Shift).offset(skip).limit(limit).all()

@router.post("/shifts")
def create_shift(req: ShiftBase, db: Session = Depends(database.get_db)):
    shift = models.Shift(name=req.name, start_time=req.start_time, end_time=req.end_time, days=req.days)
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift

@router.put("/shifts/{id}")
def update_shift(id: int, req: ShiftBase, db: Session = Depends(database.get_db)):
    shift = db.query(models.Shift).filter(models.Shift.id == id).first()
    if shift:
        shift.name = req.name
        shift.start_time = req.start_time
        shift.end_time = req.end_time
        shift.days = req.days
        db.commit()
        db.refresh(shift)
    return shift

@router.delete("/shifts/{id}")
def delete_shift(id: int, db: Session = Depends(database.get_db)):
    shift = db.query(models.Shift).filter(models.Shift.id == id).first()
    if shift:
        db.delete(shift)
        db.commit()
    return {"status": "success"}

@router.get("/holidays")
def get_holidays(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Holiday).offset(skip).limit(limit).all()

@router.post("/holidays")
def create_holiday(req: HolidayBase, db: Session = Depends(database.get_db)):
    holiday = models.Holiday(name=req.name, date=req.date, type=req.type)
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    return holiday

@router.put("/holidays/{id}")
def update_holiday(id: int, req: HolidayBase, db: Session = Depends(database.get_db)):
    holiday = db.query(models.Holiday).filter(models.Holiday.id == id).first()
    if holiday:
        holiday.name = req.name
        holiday.date = req.date
        holiday.type = req.type
        db.commit()
        db.refresh(holiday)
    return holiday

@router.delete("/holidays/{id}")
def delete_holiday(id: int, db: Session = Depends(database.get_db)):
    holiday = db.query(models.Holiday).filter(models.Holiday.id == id).first()
    if holiday:
        db.delete(holiday)
        db.commit()
    return {"status": "success"}

# ─── Unified Approvals API ─────────────────────────────────────────────────────

@router.get("/approvals/all")
def get_all_approvals(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    approvals = []
    
    # 1. Payroll Runs
    payroll_runs = db.query(models.PayrollRun).filter(models.PayrollRun.status != 'draft').offset(skip).limit(limit).all()
    for run in payroll_runs:
        status_label = 'Pending'
        if run.status in ['bank_transferred', 'checker_signed']:
            status_label = 'Approved'
        elif run.status == 'rejected':
            status_label = 'Denied'
            
        approvals.append({
            "id": f"PAY-{run.id}",
            "type": "Payroll",
            "requestedBy": "HR Department",
            "dept": "HR",
            "urgency": "Critical",
            "submittedAt": str(run.maker_signed_at) if run.maker_signed_at else "Recent",
            "amount": "Computed via HR",
            "status": status_label,
            "payrollRunId": run.id,
            "rawItem": None
        })

    # 2. Budgets
    budgets = db.query(models.DepartmentBudget).offset(skip).limit(limit).all()
    for b in budgets:
        dept = db.query(models.Department).filter(models.Department.id == b.department_id).first()
        status_label = 'Pending'
        if b.status == 'approved': status_label = 'Approved'
        elif b.status == 'rejected': status_label = 'Denied'
        
        approvals.append({
            "id": f"BUD-{b.id}",
            "type": "Budget",
            "requestedBy": b.requested_by,
            "dept": dept.name if dept else "Unknown",
            "urgency": "High",
            "submittedAt": "Recent",
            "amount": b.amount,
            "status": status_label,
            "budgetId": b.id,
            "rawItem": None
        })

    # 3. Resignations
    resignations = db.query(models.Resignation).offset(skip).limit(limit).all()
    for r in resignations:
        emp = db.query(models.User).filter(models.User.id == r.user_id).first()
        status_label = 'Pending'
        if r.status == 'approved': status_label = 'Approved'
        elif r.status == 'rejected': status_label = 'Denied'
        
        approvals.append({
            "id": f"RES-{r.id}",
            "type": "Resignation",
            "requestedBy": emp.name if emp else f"User #{r.user_id}",
            "dept": emp.department if emp else "Unknown",
            "urgency": "High",
            "submittedAt": str(r.resignation_date) if r.resignation_date else "Recent",
            "amount": "-",
            "status": status_label,
            "resignationId": r.id,
            "rawItem": None
        })
        
    # 4. Policies
    policies = db.query(models.CompanyPolicy).offset(skip).limit(limit).all()
    for p in policies:
        status_label = getattr(p, 'status', 'Approved')
        if status_label == 'approved': status_label = 'Approved'
        elif status_label == 'rejected': status_label = 'Denied'
        
        approvals.append({
            "id": f"POL-{p.id}",
            "type": "Policy",
            "requestedBy": getattr(p, 'created_by', 'Admin'),
            "dept": "HR/Admin",
            "urgency": "Normal",
            "submittedAt": str(getattr(p, 'submitted_at', getattr(p, 'updated_at', 'Recent'))),
            "amount": "-",
            "status": status_label,
            "policyId": p.id,
            "rawItem": None
        })

    # 5. Expense Claims
    claims = db.query(models.ExpenseClaim).offset(skip).limit(limit).all()
    for c in claims:
        emp = db.query(models.User).filter(models.User.id == c.user_id).first()
        status_label = 'Pending'
        if c.status in ['reimbursed', 'approved']: status_label = 'Approved'
        elif c.status == 'rejected': status_label = 'Denied'
        
        approvals.append({
            "id": f"EXP-{c.id}",
            "type": "Claim Expenses",
            "requestedBy": emp.name if emp else f"User #{c.user_id}",
            "dept": emp.department if emp else "Unknown",
            "urgency": "Normal",
            "submittedAt": str(c.claim_date) if getattr(c, 'claim_date', None) else "Recent",
            "amount": f"₹{int(c.amount):,}",
            "status": status_label,
            "expenseId": c.id,
            "date": str(c.claim_date) if getattr(c, 'claim_date', None) else "-",
            "category": c.category,
            "description": getattr(c, 'description', '-'),
            "receiptName": getattr(c, 'receipt_url', 'receipt.pdf') or 'receipt.pdf',
            "rawItem": None
        })
        
    # Append Audit Trails to all items
    for item in approvals:
        numeric_id = None
        module_name = item["type"]
        if module_name == "Payroll":
            numeric_id = item["payrollRunId"]
        elif module_name == "Budget":
            numeric_id = item["budgetId"]
            module_name = "Finance"
        elif module_name == "Resignation":
            numeric_id = item["resignationId"]
        elif module_name == "Policy":
            numeric_id = item.get("policyId")
        elif module_name == "Claim Expenses":
            numeric_id = item.get("expenseId")
            
        if numeric_id is not None:
            logs = db.query(models.AuditLog).filter(
                models.AuditLog.record_id == numeric_id,
                models.AuditLog.module == module_name
            ).order_by(models.AuditLog.timestamp.desc()).all()
        else:
            logs = []
        
        if logs:
            item["auditTrail"] = [{
                "action": log.action_type.replace('_', ' ').title(),
                "time": str(log.timestamp),
                "user": log.initiator_id
            } for log in logs]
        else:
            item["auditTrail"] = [{
                "action": "Request Submitted",
                "time": item["submittedAt"],
                "user": item["requestedBy"]
            }]
            
    # Fetch promotions too
    promotions = db.query(models.Promotion).offset(skip).limit(limit).all()
    promo_list = []
    for pr in promotions:
        promo_list.append({
            "id": pr.id,
            "name": pr.name,
            "current": pr.current,
            "proposed": pr.proposed,
            "status": pr.status
        })

    return {"approvals": approvals, "promotions": promo_list}

@router.post("/policies/{id}/approve")
def approve_policy(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    pol = db.query(models.CompanyPolicy).filter(models.CompanyPolicy.id == id).first()
    if pol:
        pol.status = "approved"
        # Audit Log
        db.add(models.AuditLog(
            initiator_id=current_user.name,
            module="Policy",
            record_id=id,
            action_type="approve_policy",
            change_diff="{}"
        ))
        db.commit()
    return {"status": "success"}

@router.post("/policies/{id}/reject")
def reject_policy(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    pol = db.query(models.CompanyPolicy).filter(models.CompanyPolicy.id == id).first()
    if pol:
        pol.status = "rejected"
        # Audit Log
        db.add(models.AuditLog(
            initiator_id=current_user.name,
            module="Policy",
            record_id=id,
            action_type="reject_policy",
            change_diff="{}"
        ))
        db.commit()
    return {"status": "success"}





class KeyResultCreate(BaseModel):
    title: str
    target: int
    unit: str
    sprintLink: Optional[str] = None

class ObjectiveCreate(BaseModel):
    title: str
    owner: str
    quarter: str
    year: str
    krs: List[KeyResultCreate]

@router.post("/okrs")
def create_okr(req: ObjectiveCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    new_obj = models.Objective(
        title=req.title,
        status="On Track",
        progress=0,
        owner=req.owner,
        quarter=req.quarter,
        year=req.year
    )
    db.add(new_obj)
    db.commit()
    db.refresh(new_obj)
    
    for kr in req.krs:
        new_kr = models.KeyResult(
            objective_id=new_obj.id,
            title=kr.title,
            current=0,
            target=kr.target,
            unit=kr.unit,
            sprintLink=kr.sprintLink
        )
        db.add(new_kr)
    
    db.commit()
    return {"status": "success", "id": new_obj.id, "message": "OKR created"}

@router.delete("/okrs/{id}")
def delete_okr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    obj = db.query(models.Objective).filter(models.Objective.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    db.query(models.KeyResult).filter(models.KeyResult.objective_id == id).delete()
    db.delete(obj)
    db.commit()
    return {"status": "success", "message": "OKR deleted"}



class VendorCreate(BaseModel):
    vendor_id: str
    name: str
    category: str
    status: str
    annual_spend: str
    renewal_date: str
    risk_level: str

class VendorResponse(BaseModel):
    id: int
    vendor_id: str
    name: str
    category: str
    status: str
    annual_spend: str
    renewal_date: str
    risk_level: str
    
    class Config:
        from_attributes = True

@router.get("/vendors", response_model=List[VendorResponse])
def get_vendors(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.Vendor).offset(skip).limit(limit).all()

@router.post("/vendors", response_model=VendorResponse)
def create_vendor(req: VendorCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    db_vendor = db.query(models.Vendor).filter(models.Vendor.vendor_id == req.vendor_id).first()
    if db_vendor:
        raise HTTPException(status_code=400, detail="Vendor ID already exists")
    
    new_vendor = models.Vendor(**req.dict())
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

@router.delete("/vendors/{id}")
def delete_vendor(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    vendor = db.query(models.Vendor).filter(models.Vendor.id == id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    db.delete(vendor)
    db.commit()
    return {"status": "success"}



from fastapi import File, UploadFile, Form
import shutil
import hashlib

class VaultDocResponse(BaseModel):
    id: int
    doc_id: str
    name: str
    type: str
    parties: Optional[str] = None
    file_url: str
    file_hash: str
    sign_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/vault", response_model=List[VaultDocResponse])
def get_vault_docs(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.VaultDocument).offset(skip).limit(limit).all()

@router.post("/vault/upload")
def upload_vault_doc(
    doc_id: str = Form(...),
    name: str = Form(...),
    type: str = Form(...),
    parties: str = Form(""),
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    verify_ceo_role(current_user)
    
    # Check if doc_id already exists
    if db.query(models.VaultDocument).filter(models.VaultDocument.doc_id == doc_id).first():
        raise HTTPException(status_code=400, detail="Document ID already exists")

    # Save physical file
    upload_dir = os.path.join("uploads", "vault")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{doc_id}{file_ext}"
    file_path = os.path.join(upload_dir, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Calculate SHA-256 hash for cryptographic security
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    
    file_hash = sha256_hash.hexdigest()
    file_url = f"/uploads/vault/{safe_filename}"
    
    new_doc = models.VaultDocument(
        doc_id=doc_id,
        name=name,
        type=type,
        parties=parties,
        file_url=file_url,
        file_hash=file_hash,
        sign_status="Pending"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Needs to return a standard structure that Pydantic models can parse
    # Or just return a dict
    return {"status": "success", "id": new_doc.id}

@router.put("/vault/{id}/sign")
def sign_vault_doc(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    doc = db.query(models.VaultDocument).filter(models.VaultDocument.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc.sign_status = "Signed"
    db.commit()
    return {"status": "success"}

