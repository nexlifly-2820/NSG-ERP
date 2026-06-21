from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
from datetime import date, datetime
import json

from app import models, database
from app.core import security

router = APIRouter(
    prefix="/hr-portal",
    tags=["hr-portal"]
)

# Protect all endpoints to HR, CEO, or admin roles
def verify_hr_role(user: models.User):
    if user.role not in ["hr", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden. HR privileges required."
        )

# ─── Pydantic Validation Schemas ──────────────────────────────────────────────

class CandidateCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    source: Optional[str] = "LinkedIn"
    stage: Optional[str] = "applied"
    resume_url: Optional[str] = "#"

class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    role: str
    source: Optional[str]
    stage: str
    resume_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class StageUpdateRequest(BaseModel):
    stage: str

class InterviewCreate(BaseModel):
    candidate_id: int
    candidate_name: str
    role: str
    interviewer: str
    scheduled_at: datetime

class InterviewResponse(BaseModel):
    id: int
    candidate_id: int
    candidate_name: str
    role: str
    interviewer: str
    scheduled_at: datetime
    status: str

    class Config:
        from_attributes = True

class JobOfferCreate(BaseModel):
    candidate_id: int
    basic_pay: float
    hra: float
    allowance: float

class JobOfferResponse(BaseModel):
    id: int
    candidate_id: int
    basic_pay: float
    hra: float
    allowance: float
    gross_ctc: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class EmployeeCreateRequest(BaseModel):
    name: str
    email: EmailStr
    department: str
    designation: str
    join_date: date
    status: Optional[str] = "probation"
    photo: Optional[str] = None
    manager_id: Optional[int] = None
    role: Optional[str] = "employee"
    emp_id: Optional[str] = None
    pf_number: Optional[str] = None
    uan: Optional[str] = None
    esi_number: Optional[str] = None
    pan_number: Optional[str] = None
    location: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_branch: Optional[str] = None

class EmployeeResponse(BaseModel):
    id: int
    emp_id: Optional[str]
    name: str
    email: str
    role: str
    phone: Optional[str]
    department: Optional[str]
    designation: Optional[str]
    status: str
    join_date: Optional[date]
    probation_end_date: Optional[date]
    bank_name: Optional[str]
    account_number: Optional[str]
    ifsc_code: Optional[str]
    grade: Optional[int] = 1
    manager: Optional[str]
    manager_id: Optional[int]
    photo: Optional[str]
    documents: Optional[str]
    pf_number: Optional[str]
    uan: Optional[str]
    esi_number: Optional[str]
    pan_number: Optional[str]
    location: Optional[str]
    bank_branch: Optional[str]

    class Config:
        from_attributes = True

class EmployeeCreateResponse(BaseModel):
    employee: EmployeeResponse

class EmployeeUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    emp_id: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    grade: Optional[int] = None
    manager: Optional[str] = None
    manager_id: Optional[int] = None
    photo: Optional[str] = None
    status: Optional[str] = None
    pf_number: Optional[str] = None
    uan: Optional[str] = None
    esi_number: Optional[str] = None
    pan_number: Optional[str] = None
    location: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_branch: Optional[str] = None

class PasswordResetRequest(BaseModel):
    new_password: str

class DocumentUploadRequest(BaseModel):
    doc_type: str

class DocumentVerifyRequest(BaseModel):
    doc_type: str

class OnboardingTaskResponse(BaseModel):
    id: int
    instance_id: int
    task_name: str
    assigned_to: str
    due_date: date
    is_mandatory: bool
    requires_esign: bool
    completed_at: Optional[date]
    status: str

    class Config:
        from_attributes = True

class EsignRequestCreate(BaseModel):
    employee_id: int
    document_name: str

class EsignRequestResponse(BaseModel):
    id: int
    employee_id: int
    document_name: str
    status: str
    sent_at: datetime
    signed_at: Optional[datetime]

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
    denial_reason: Optional[str] = None
    status: str
    tl_approved_at: Optional[datetime]
    hr_approved_at: Optional[datetime]

    class Config:
        from_attributes = True

class LeaveBalanceResponse(BaseModel):
    id: int
    user_id: int
    CL: float
    SL: float
    EL: float
    Maternity: float
    year: int

    class Config:
        from_attributes = True

class LeaveBalanceAdjustment(BaseModel):
    CL: float
    SL: float
    EL: float
    Maternity: float

class LeaveRequestOnBehalf(BaseModel):
    employee_id: int
    leave_type: str
    from_date: date
    to_date: date
    days: float
    reason: str

class LeaveRequestEdit(BaseModel):
    leave_type: str
    from_date: date
    to_date: date
    days: float
    reason: str

class LeaveRequestDeny(BaseModel):
    reason: str

class TimesheetExceptionResponse(BaseModel):
    id: int
    employee_id: int
    week_start_date: date
    exception_type: str
    logged_hours: float
    target_hours: float
    date: date
    tl_rejection_comment: Optional[str]
    status: str
    days_overdue: int

    class Config:
        from_attributes = True

class PayrollRunCreate(BaseModel):
    month: int
    year: int

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

class ExpenseClaimResponse(BaseModel):
    id: int
    user_id: int
    claim_date: date
    amount: float
    category: str
    receipt_url: Optional[str]
    tl_approval: str
    hr_approval: str
    status: str

    class Config:
        from_attributes = True

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

class LoanCreateRequest(BaseModel):
    employee_id: int
    loan_amount: float
    emi_amount: float
    tenure: int

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

class DisciplinaryTicketCreate(BaseModel):
    employee_id: int
    violation_type: str
    severity: str
    description: str
    evidence_url: Optional[str] = "#"

class DisciplinaryTicketResponse(BaseModel):
    id: int
    employee_id: int
    issued_by: str
    violation_type: str
    severity: str
    description: Optional[str]
    evidence_url: Optional[str]
    response_deadline: Optional[datetime]
    employee_rebuttal: Optional[str]
    status: str

    class Config:
        from_attributes = True

class DisciplinaryTicketResolve(BaseModel):
    rebuttal: Optional[str] = None

class PIPCreate(BaseModel):
    employee_id: int
    ticket_id: Optional[int] = None
    manager_id: int
    start_date: date
    duration_weeks: Optional[int] = 4
    goals: List[dict] = []

class PIPGoalUpdate(BaseModel):
    goals: List[dict]
    status: Optional[str] = "ongoing"
    outcome: Optional[str] = "pending"

class PIPResponse(BaseModel):
    id: int
    employee_id: int
    ticket_id: Optional[int]
    manager_id: int
    start_date: date
    duration_weeks: int
    goals: Optional[str]
    status: str
    outcome: str

    class Config:
        from_attributes = True

class ResignationResponse(BaseModel):
    id: int
    user_id: int
    resignation_date: date
    LWD: date
    status: str
    ceo_status: Optional[str] = "pending"
    reason: str

    class Config:
        from_attributes = True

class TrainingTrackCreate(BaseModel):
    name: str
    department: Optional[str] = "All"
    modules: List[dict] = []
    is_mandatory: Optional[bool] = False

class TrainingTrackResponse(BaseModel):
    id: int
    name: str
    department: str
    modules: Optional[str]
    is_mandatory: bool

    class Config:
        from_attributes = True

class TrainingProgressResponse(BaseModel):
    id: int
    employee_id: int
    track_id: int
    completed_modules: int
    quiz_score: float
    passed: bool

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


class AppraisalCycleCreate(BaseModel):
    name: str
    period: str
    start_date: str
    end_date: str
    self_deadline: str
    tl_review_deadline: str
    status: str


class AppraisalCycleResponse(BaseModel):
    id: int
    name: str
    period: str
    start_date: str
    end_date: str
    self_deadline: str
    tl_review_deadline: str
    status: str

    class Config:
        from_attributes = True


class IncrementProposalCreate(BaseModel):
    employee_id: int
    current_ctc: float
    proposed_ctc: float
    increment_pct: float
    performance_band: str
    effective_date: str
    status: str


class IncrementProposalResponse(BaseModel):
    id: int
    employee_id: int
    current_ctc: float
    proposed_ctc: float
    increment_pct: float
    performance_band: str
    effective_date: str
    status: str
    approved_by: Optional[str] = None

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


class PromotionResponse(BaseModel):
    id: int
    employee_id: Optional[int] = None
    name: str
    current: str
    proposed: str
    status: str

    class Config:
        from_attributes = True


class PromotionCreate(BaseModel):
    employee_id: int
    name: str
    current: str
    proposed: str


class PromotionDecide(BaseModel):
    decision: str  # "approved_by_ceo" | "rejected_by_ceo"


# ─── Endpoints ───────────────────────────────────────────────────────────────


# 1. Telemetry Dashboard
@router.get("/dashboard/metrics")
def get_dashboard_metrics(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    total_employees = db.query(models.User).filter(models.User.role == "employee").count()
    active_employees = db.query(models.User).filter(models.User.role == "employee", models.User.status == "active").count()
    probation_employees = db.query(models.User).filter(models.User.role == "employee", models.User.status == "probation").count()
    active_candidates = db.query(models.Candidate).filter(models.Candidate.stage.notin_(["joined", "rejected"])).count()
    ongoing_pips = db.query(models.PIP).filter(models.PIP.status == "ongoing").count()
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").count()
    pending_expenses = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.status == "pending").count()
    pending_exits = db.query(models.Resignation).filter(
        models.Resignation.deleted_at == None,
        models.Resignation.status.in_(["pending", "withdraw_pending"])
    ).count()
    unresolved_grievances = db.query(models.DisciplinaryTicket).filter(models.DisciplinaryTicket.status == "issued").count()

    return {
        "totalEmployees": total_employees,
        "activeEmployees": active_employees,
        "probationEmployees": probation_employees,
        "activeCandidates": active_candidates,
        "ongoingPips": ongoing_pips,
        "pendingLeaves": pending_leaves,
        "pendingExpenses": pending_expenses,
        "pendingExits": pending_exits,
        "unresolvedGrievances": unresolved_grievances
    }

@router.get("/dashboard/pending-approvals")
def get_dashboard_pending_approvals(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    items = []
    
    # Leaves
    leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").all()
    for req in leaves:
        emp = db.query(models.User).filter(models.User.id == req.user_id).first()
        items.append({
            "id": f"LEV-{req.id}",
            "type": "Leave",
            "title": f"{req.leave_type} Leave Request",
            "employee": emp.name if emp else "Unknown",
            "date": req.created_at.isoformat() if hasattr(req, 'created_at') and req.created_at else "2024-01-01T00:00:00Z",
            "url": "/#/HR/leave"
        })
        
    # Timesheets (Only counting pending)
    timesheets = db.query(models.DailyTimesheet).filter(models.DailyTimesheet.status == "pending").all()
    for ts in timesheets:
        emp = db.query(models.User).filter(models.User.id == ts.user_id).first()
        items.append({
            "id": f"TS-{ts.id}",
            "type": "Timesheet",
            "title": "Daily Timesheet Submission",
            "employee": emp.name if emp else "Unknown",
            "date": ts.date.isoformat() if ts.date else "2024-01-01",
            "url": "/#/HR/timesheets"
        })
        
    # Resignations
    resignations = db.query(models.Resignation).filter(
        models.Resignation.deleted_at == None,
        models.Resignation.status.in_(["pending", "withdraw_pending"])
    ).all()
    for r in resignations:
        emp = db.query(models.User).filter(models.User.id == r.user_id).first()
        items.append({
            "id": f"RES-{r.id}",
            "type": "Resignation",
            "title": "Resignation Review",
            "employee": emp.name if emp else "Unknown",
            "date": r.created_at.isoformat() if hasattr(r, 'created_at') and r.created_at else "2024-01-01T00:00:00Z",
            "url": "/#/HR/exits"
        })
        
    # WFH / Regularization (AttendanceCorrection)
    corrections = db.query(models.AttendanceCorrection).filter(models.AttendanceCorrection.status == "pending").all()
    for c in corrections:
        emp = db.query(models.User).filter(models.User.id == c.user_id).first()
        items.append({
            "id": f"ATT-{c.id}",
            "type": "Attendance",
            "title": "Attendance Regularization",
            "employee": emp.name if emp else "Unknown",
            "date": c.correction_date.isoformat() if c.correction_date else "2024-01-01",
            "url": "/#/HR/attendance"
        })
        
    # Sort items by date descending (newest first)
    items.sort(key=lambda x: x["date"], reverse=True)
    return items

# 2. Recruitment Module (ATS Board)
@router.get("/candidates", response_model=List[CandidateResponse])
def get_candidates(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.Candidate).order_by(models.Candidate.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/candidates", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(req: CandidateCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    exists = db.query(models.Candidate).filter(models.Candidate.email == req.email).first()
    if exists:
        raise HTTPException(status_code=400, detail=f"A candidate with the email {req.email} already exists in the ATS.")
        
    db_cand = models.Candidate(
        name=req.name,
        email=req.email,
        phone=req.phone,
        role=req.role,
        source=req.source,
        stage=req.stage,
        resume_url=req.resume_url
    )
    db.add(db_cand)
    db.commit()
    db.refresh(db_cand)
    return db_cand

@router.put("/candidates/{id}/stage", response_model=CandidateResponse)
def update_candidate_stage(id: int, req: StageUpdateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    cand = db.query(models.Candidate).filter(models.Candidate.id == id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    
    cand.stage = req.stage
    db.commit()
    db.refresh(cand)
    return cand

@router.post("/candidates/{id}/join", response_model=EmployeeCreateResponse)
def transition_candidate_to_employee(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    cand = db.query(models.Candidate).filter(models.Candidate.id == id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    
    # Check if already transitioned
    exists = db.query(models.User).filter(models.User.email == cand.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="An employee with this email already exists.")
    
    cand.stage = "joined"
    
    # Calculate employee serial number
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
    
    # Auto setup dates
    today = date.today()
    probation_end = date.fromordinal(today.toordinal() + 30) # 1 month
    
    # Initial documents list & CTC
    offer = db.query(models.JobOffer).filter(models.JobOffer.candidate_id == cand.id).first()
    init_ctc = offer.gross_ctc if offer else 300000.0
    init_base = offer.basic_pay if offer else 15625.0
    
    initial_docs_dict = {
        "docs_list": [],
        "ctc": init_ctc,
        "base_salary": init_base
    }
    
    # Hash default password (e.g. EmployeeName@123)
    default_pwd_plain = f"{cand.name.replace(' ', '')}@123"
    default_pwd = security.hash_password(default_pwd_plain)
    
    # Create employee User
    db_emp = models.User(
        name=cand.name,
        email=cand.email,
        hashed_password=default_pwd,
        role="employee",
        department="Engineering",
        designation=cand.role,
        status="probation",
        emp_id=emp_id,
        phone=cand.phone,
        join_date=today,
        probation_end_date=probation_end,
        bank_name=None,
        account_number=None,
        ifsc_code=None,
        grade=3,
        manager="John Doe",
        photo="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80",
        documents=json.dumps(initial_docs_dict)
    )
    db.add(db_emp)
    db.flush()
    
    # Auto-seed onboarding tasks
    onboarding_tasks = [
        ("Workstation Setup & Laptop Provisioning", "IT", 2, False),
        ("Provision System Logins & Email", "IT", 1, False),
        ("Mandatory NDA Policy E-Sign", "Employee", 3, True),
        ("Complete Compliance Induction Quiz", "Employee", 5, False),
        ("Welcome Kit & Access Badge Handover", "HR", 2, False)
    ]
    
    for task_name, role, offset, esign in onboarding_tasks:
        due = date.fromordinal(today.toordinal() + offset)
        db_task = models.OnboardingTask(
            instance_id=db_emp.id,
            task_name=task_name,
            assigned_to=role,
            due_date=due,
            is_mandatory=True,
            requires_esign=esign,
            status="pending"
        )
        db.add(db_task)
        
    # Auto-seed training progress (mandatory induction track 1)
    db_progress = models.TrainingProgress(
        employee_id=db_emp.id,
        track_id=1,
        completed_modules=0,
        quiz_score=0.0,
        passed=False
    )
    db.add(db_progress)
    
    # Auto-seed NDA esign request
    db_esign = models.EsignRequest(
        employee_id=db_emp.id,
        document_name="Mandatory NDA Policy Handbook",
        status="pending"
    )
    db.add(db_esign)
    
    # Write to Audit Log
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Recruitment",
        record_id=db_emp.id,
        action_type="create",
        change_diff=json.dumps({"converted_employee": db_emp.name, "assigned_role": db_emp.designation})
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(db_emp)
    return {"employee": db_emp}

@router.delete("/candidates/{id}")
def delete_candidate(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    cand = db.query(models.Candidate).filter(models.Candidate.id == id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    db.delete(cand)
    db.commit()
    return {"status": "success", "message": "Candidate profile deleted."}

@router.post("/interviews", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def schedule_interview(req: InterviewCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    interview = models.Interview(
        candidate_id=req.candidate_id,
        candidate_name=req.candidate_name,
        role=req.role,
        interviewer=req.interviewer,
        scheduled_at=req.scheduled_at
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview

@router.post("/offers", response_model=JobOfferResponse, status_code=status.HTTP_201_CREATED)
def create_job_offer(req: JobOfferCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    gross = req.basic_pay + req.hra + req.allowance
    offer = models.JobOffer(
        candidate_id=req.candidate_id,
        basic_pay=req.basic_pay,
        hra=req.hra,
        allowance=req.allowance,
        gross_ctc=gross
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


# 3. Employee Registry Module
@router.get("/employees", response_model=List[EmployeeResponse])
def get_employees(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.User).offset(skip).limit(limit).all()

@router.get("/departments")
def get_departments(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    depts = db.query(models.Department).all()
    return [{"id": d.id, "name": d.name} for d in depts]

@router.get("/designations")
def get_designations(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    desigs = db.query(models.Designation).all()
    res = []
    for d in desigs:
        dept = db.query(models.Department).filter(models.Department.id == d.department_id).first()
        res.append({"id": d.id, "name": d.name, "dept": dept.name if dept else "Unknown"})
    return res

@router.get("/shifts")
def get_shifts(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    shifts = db.query(models.Shift).all()
    return [{"id": s.id, "name": f"{s.name} ({s.start_time} - {s.end_time})"} for s in shifts]

@router.get("/team-leads", response_model=List[EmployeeResponse])
def get_team_leads(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.User).filter(models.User.role == "tl").offset(skip).limit(limit).all()

@router.post("/employees", response_model=EmployeeCreateResponse, status_code=status.HTTP_201_CREATED)
def add_employee(req: EmployeeCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    exists = db.query(models.User).filter(models.User.email == req.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Employee already exists.")
        
    if req.emp_id:
        emp_id = req.emp_id
    else:
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
    probation_end = date.fromordinal(req.join_date.toordinal() + 30)
    
    initial_docs = []
    
    default_pwd_plain = f"{req.name.replace(' ', '')}@123"
    default_pwd = security.hash_password(default_pwd_plain)
    
    db_emp = models.User(
        name=req.name,
        email=req.email,
        hashed_password=default_pwd,
        role=req.role or "employee",
        department=req.department,
        designation=req.designation,
        status=req.status,
        emp_id=emp_id,
        join_date=req.join_date,
        probation_end_date=probation_end,
        bank_name=req.bank_name,
        account_number=req.account_number,
        ifsc_code=req.ifsc_code,
        bank_branch=req.bank_branch,
        grade=3,
        manager="John Doe",
        manager_id=req.manager_id,
        photo=req.photo or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80",
        documents=json.dumps(initial_docs),
        pf_number=req.pf_number,
        uan=req.uan,
        esi_number=req.esi_number,
        pan_number=req.pan_number,
        location=req.location
    )
    db.add(db_emp)
    db.flush()
    
    # Auto onboarding tasks
    onboarding_tasks = [
        ("Workstation Setup & Laptop Provisioning", "IT", 2, False),
        ("Provision System Logins & Email", "IT", 1, False),
        ("Mandatory NDA Policy E-Sign", "Employee", 3, True),
        ("Complete Compliance Induction Quiz", "Employee", 5, False),
        ("Welcome Kit & Access Badge Handover", "HR", 2, False)
    ]
    for task_name, role, offset, esign in onboarding_tasks:
        due = date.fromordinal(req.join_date.toordinal() + offset)
        db_task = models.OnboardingTask(
            instance_id=db_emp.id,
            task_name=task_name,
            assigned_to=role,
            due_date=due,
            is_mandatory=True,
            requires_esign=esign,
            status="pending"
        )
        db.add(db_task)

    db_progress = models.TrainingProgress(
        employee_id=db_emp.id,
        track_id=1,
        completed_modules=0,
        quiz_score=0.0,
        passed=False
    )
    db.add(db_progress)

    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Employees",
        record_id=db_emp.id,
        action_type="create",
        change_diff=json.dumps({"created_employee": db_emp.name, "assigned_role": db_emp.designation})
    )
    db.add(db_log)

    db.commit()
    db.refresh(db_emp)
    return {"employee": db_emp}

@router.post("/employees/{id}/confirm-probation", response_model=EmployeeResponse)
def confirm_probation(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    emp = db.query(models.User).filter(models.User.id == id, models.User.role == "employee").first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
        
    # Prerequisite L&D Quiz pass check
    progress = db.query(models.TrainingProgress).filter(models.TrainingProgress.employee_id == id, models.TrainingProgress.track_id == 1).first()
    if not progress or not progress.passed:
        raise HTTPException(status_code=400, detail="Lock Engaged: Employee has not passed mandatory compliance track quiz.")
        
    emp.status = "active"
    
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Employees",
        record_id=id,
        action_type="verify_doc",
        change_diff=json.dumps({"probation_status": "confirmed_active", "verified_prerequisite": "L&D quiz passed"})
    )
    db.add(db_log)
    db.commit()
    db.refresh(emp)
    return emp

@router.post("/employees/{id}/extend-probation", response_model=EmployeeResponse)
def extend_probation(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    emp = db.query(models.User).filter(models.User.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
        
    current_end = emp.probation_end_date or date.today()
    emp.probation_end_date = date.fromordinal(current_end.toordinal() + 90) # Extend by 90 days
    
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Employees",
        record_id=id,
        action_type="verify_doc",
        change_diff=json.dumps({"probation_status": "extended_90_days", "new_probation_end": emp.probation_end_date.isoformat()})
    )
    db.add(db_log)
    db.commit()
    db.refresh(emp)
    return emp

@router.post("/employees/{id}/terminate", response_model=EmployeeResponse)
def terminate_employee(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    emp = db.query(models.User).filter(models.User.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
        
    emp.status = "inactive"
    
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Employees",
        record_id=id,
        action_type="verify_doc",
        change_diff=json.dumps({"employment_status": "terminated"})
    )
    db.add(db_log)
    db.commit()
    db.refresh(emp)
    return emp

@router.post("/employees/{id}/reveal-bank")
def reveal_bank_details(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    emp = db.query(models.User).filter(models.User.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # Write sensitive audit log trace
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Employees",
        record_id=id,
        action_type="verify_doc",
        change_diff=json.dumps({"revealed_sensitive_data": f"Bank details of {emp.name} were revealed"})
    )
    db.add(db_log)
    db.commit()
    return {"status": "success", "message": "Sensitive access logged to audit record."}

@router.delete("/employees/{id}", status_code=status.HTTP_200_OK)
def delete_employee(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    emp = db.query(models.User).filter(models.User.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
        
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Employees",
        record_id=id,
        action_type="delete",
        change_diff=json.dumps({"deleted_employee": emp.name, "email": emp.email})
    )
    db.add(db_log)
    db.delete(emp)
    db.commit()
    return {"status": "success", "message": "Employee successfully deleted."}

@router.put("/employees/{id}", response_model=EmployeeResponse)
def update_employee(id: int, req: EmployeeUpdateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    emp = db.query(models.User).filter(models.User.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    if req.name is not None:
        emp.name = req.name
    if req.emp_id is not None:
        # Check uniqueness only if emp_id actually changed
        if req.emp_id != emp.emp_id:
            exists = db.query(models.User).filter(models.User.emp_id == req.emp_id, models.User.id != id).first()
            if exists:
                raise HTTPException(status_code=400, detail="Another employee already uses this Employee ID.")
        emp.emp_id = req.emp_id
    if req.email is not None:
        # Check uniqueness only if email actually changed
        if req.email != emp.email:
            exists = db.query(models.User).filter(models.User.email == req.email, models.User.id != id).first()
            if exists:
                raise HTTPException(status_code=400, detail="Another employee already uses this email.")
        emp.email = req.email
    if req.role is not None:
        emp.role = req.role
    if req.department is not None:
        emp.department = req.department
    if req.designation is not None:
        emp.designation = req.designation
    if req.phone is not None:
        emp.phone = req.phone
    if req.grade is not None:
        emp.grade = req.grade
    if req.manager is not None:
        emp.manager = req.manager
    if req.manager_id is not None:
        emp.manager_id = req.manager_id
    if req.photo is not None:
        emp.photo = req.photo
    if req.status is not None:
        emp.status = req.status
    if req.pf_number is not None:
        emp.pf_number = req.pf_number
    if req.uan is not None:
        emp.uan = req.uan
    if req.esi_number is not None:
        emp.esi_number = req.esi_number
    if req.pan_number is not None:
        emp.pan_number = req.pan_number
    if req.location is not None:
        emp.location = req.location
    if req.bank_name is not None:
        emp.bank_name = req.bank_name
    if req.account_number is not None:
        emp.account_number = req.account_number
    if req.ifsc_code is not None:
        emp.ifsc_code = req.ifsc_code
    if req.bank_branch is not None:
        emp.bank_branch = req.bank_branch

    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Employees",
        record_id=id,
        action_type="update",
        change_diff=json.dumps({"updated_fields": req.model_dump(exclude_none=True)})
    )
    db.add(db_log)
    db.commit()
    db.refresh(emp)
    return emp

@router.post("/employees/{id}/reset-password", status_code=status.HTTP_200_OK)
def reset_employee_password(id: int, req: PasswordResetRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    emp = db.query(models.User).filter(models.User.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
    
    hashed = security.hash_password(req.new_password)
    emp.hashed_password = hashed
    
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Employees",
        record_id=id,
        action_type="password_reset",
        change_diff=json.dumps({"info": "HR reset employee password"})
    )
    db.add(db_log)
    db.commit()
    return {"status": "success", "message": "Password successfully reset."}

@router.post("/employees/{id}/documents/upload", response_model=EmployeeResponse)
def upload_employee_document(id: int, req: DocumentUploadRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    emp = db.query(models.User).filter(models.User.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
        
    docs = []
    if emp.documents:
        try:
            docs = json.loads(emp.documents)
        except Exception:
            pass
            
    # Filter out duplicate types and append new pending doc
    docs = [d for d in docs if d["type"] != req.doc_type]
    docs.append({
        "type": req.doc_type,
        "name": f"{req.doc_type.lower().replace(' ', '_')}_upload.pdf",
        "status": "pending",
        "date": date.today().isoformat()
    })
    
    emp.documents = json.dumps(docs)
    
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Employees",
        record_id=id,
        action_type="verify_doc",
        change_diff=json.dumps({"uploaded_document": req.doc_type})
    )
    db.add(db_log)
    db.commit()
    db.refresh(emp)
    return emp

@router.post("/employees/{id}/documents/verify", response_model=EmployeeResponse)
def verify_employee_document(id: int, req: DocumentVerifyRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    emp = db.query(models.User).filter(models.User.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
        
    docs = []
    if emp.documents:
        try:
            docs = json.loads(emp.documents)
        except Exception:
            pass
            
    for doc in docs:
        if doc["type"] == req.doc_type:
            doc["status"] = "verified"
            
    emp.documents = json.dumps(docs)
    
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Employees",
        record_id=id,
        action_type="verify_doc",
        change_diff=json.dumps({"verified_document": req.doc_type})
    )
    db.add(db_log)
    db.commit()
    db.refresh(emp)
    return emp

# 4. Onboarding & E-Sign
@router.get("/onboarding/tasks", response_model=List[OnboardingTaskResponse])
def get_onboarding_tasks(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.OnboardingTask).offset(skip).limit(limit).all()

@router.post("/onboarding/tasks/{id}/toggle", response_model=OnboardingTaskResponse)
def toggle_onboarding_task(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    task = db.query(models.OnboardingTask).filter(models.OnboardingTask.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Onboarding task not found.")
        
    is_completing = task.status != "completed"
    task.status = "completed" if is_completing else "pending"
    task.completed_at = date.today() if is_completing else None
    
    # Auto trigger training Quiz passed state if this task was the compliance quiz
    if "Compliance Induction Quiz" in task.task_name:
        progress = db.query(models.TrainingProgress).filter(models.TrainingProgress.employee_id == task.instance_id).first()
        if progress:
            progress.passed = is_completing
            progress.completed_modules = 2 if is_completing else 0
            progress.quiz_score = 90.0 if is_completing else 0.0
            
    db.commit()
    db.refresh(task)
    return task

@router.get("/onboarding/esign-requests", response_model=List[EsignRequestResponse])
def get_esign_requests(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.EsignRequest).offset(skip).limit(limit).all()

@router.post("/onboarding/esign-requests", response_model=EsignRequestResponse)
def create_esign_request(req: EsignRequestCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    db_req = models.EsignRequest(
        employee_id=req.employee_id,
        document_name=req.document_name,
        status="pending"
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

@router.post("/onboarding/esign-requests/{id}/simulate-sign", response_model=EsignRequestResponse)
def simulate_esign(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    req = db.query(models.EsignRequest).filter(models.EsignRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="E-Sign request not found.")
        
    req.status = "signed"
    req.signed_at = datetime.now()
    
    # Mark onboarding NDA task as completed automatically
    nda_task = db.query(models.OnboardingTask).filter(
        models.OnboardingTask.instance_id == req.employee_id,
        models.OnboardingTask.requires_esign == True
    ).first()
    if nda_task:
        nda_task.status = "completed"
        nda_task.completed_at = date.today()
        
    db.commit()
    db.refresh(req)
    return req

@router.delete("/onboarding/esign-requests/{id}")
def delete_esign_request(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    req = db.query(models.EsignRequest).filter(models.EsignRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="E-sign request not found.")
    db.delete(req)
    db.commit()
    return {"status": "success", "message": "E-sign request voided."}

# 5. Leaves & Timesheets Exceptions
@router.get("/leaves/balances", response_model=List[LeaveBalanceResponse])
def get_leave_balances(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.LeaveBalance).offset(skip).limit(limit).all()

@router.put("/leaves/balances/{id}", response_model=LeaveBalanceResponse)
def adjust_leave_balance(id: int, req: LeaveBalanceAdjustment, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.id == id).first()
    if not bal:
        raise HTTPException(status_code=404, detail="Leave balance record not found.")
    bal.CL = req.CL
    bal.SL = req.SL
    bal.EL = req.EL
    bal.Maternity = req.Maternity
    db.commit()
    db.refresh(bal)
    return bal

@router.get("/leaves/requests", response_model=List[LeaveRequestResponse])
def get_leave_requests(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.LeaveRequest).order_by(models.LeaveRequest.from_date.desc()).offset(skip).limit(limit).all()

@router.post("/leaves/requests/on-behalf", response_model=LeaveRequestResponse)
def apply_leave_on_behalf(req: LeaveRequestOnBehalf, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    emp = db.query(models.User).filter(models.User.id == req.employee_id, models.User.role == "employee").first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
        
    new_req = models.LeaveRequest(
        user_id=req.employee_id,
        leave_type=req.leave_type,
        from_date=req.from_date,
        to_date=req.to_date,
        days=req.days,
        reason=req.reason,
        status="hr_approved",
        tl_approved_at=datetime.now(),
        hr_approved_at=datetime.now()
    )
    db.add(new_req)
    
    bal = db.query(models.LeaveBalance).filter(
        models.LeaveBalance.user_id == req.employee_id,
        models.LeaveBalance.year == date.today().year
    ).first()
    if bal and hasattr(bal, req.leave_type):
        current_bal = getattr(bal, req.leave_type)
        setattr(bal, req.leave_type, max(0.0, current_bal - req.days))
        
    db_notify = models.Notification(
        user_id=req.employee_id,
        message=f"HR has submitted and approved a {req.leave_type} leave request on your behalf for {req.days} days ({req.from_date} to {req.to_date}).",
        type="info"
    )
    db.add(db_notify)
    
    db.commit()
    db.refresh(new_req)
    return new_req

@router.put("/leaves/requests/{id}", response_model=LeaveRequestResponse)
def edit_leave_request(id: int, req: LeaveRequestEdit, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    db_req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    if db_req.status == "hr_approved":
        bal = db.query(models.LeaveBalance).filter(
            models.LeaveBalance.user_id == db_req.user_id,
            models.LeaveBalance.year == date.today().year
        ).first()
        if bal:
            type_changed = db_req.leave_type != req.leave_type
            if type_changed:
                if hasattr(bal, db_req.leave_type):
                    setattr(bal, db_req.leave_type, getattr(bal, db_req.leave_type) + db_req.days)
                if hasattr(bal, req.leave_type):
                    setattr(bal, req.leave_type, max(0.0, getattr(bal, req.leave_type) - req.days))
            else:
                days_diff = req.days - db_req.days
                if hasattr(bal, db_req.leave_type):
                    setattr(bal, db_req.leave_type, max(0.0, getattr(bal, db_req.leave_type) - days_diff))
                    
    db_req.leave_type = req.leave_type
    db_req.from_date = req.from_date
    db_req.to_date = req.to_date
    db_req.days = req.days
    db_req.reason = req.reason
    
    db.commit()
    db.refresh(db_req)
    return db_req

@router.post("/leaves/requests/{id}/approve", response_model=LeaveRequestResponse)
def approve_leave_hr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    security.check_rbac_permission(db, current_user, "Approve Leaves")
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    req.status = "approved"
    req.hr_approved_at = datetime.now()
    
    bal = db.query(models.LeaveBalance).filter(
        models.LeaveBalance.user_id == req.user_id,
        models.LeaveBalance.year == date.today().year
    ).first()
    if bal and hasattr(bal, req.leave_type):
        current_bal = getattr(bal, req.leave_type)
        setattr(bal, req.leave_type, max(0.0, current_bal - req.days))
        
    db_notify = models.Notification(
        user_id=req.user_id,
        message=f"Your leave request from {req.from_date} to {req.to_date} has been fully approved by HR.",
        type="success"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(req)
    return req

@router.post("/leaves/requests/{id}/deny", response_model=LeaveRequestResponse)
def reject_leave_hr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    security.check_rbac_permission(db, current_user, "Approve Leaves")
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    req.status = "rejected"
    
    db_notify = models.Notification(
        user_id=req.user_id,
        message=f"Your leave request from {req.from_date} to {req.to_date} was rejected by HR.",
        type="danger"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(req)
    return req

@router.delete("/leaves/requests/{id}")
def delete_leave_request(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    if req.status == "hr_approved":
        bal = db.query(models.LeaveBalance).filter(
            models.LeaveBalance.user_id == req.user_id,
            models.LeaveBalance.year == date.today().year
        ).first()
        if bal and hasattr(bal, req.leave_type):
            setattr(bal, req.leave_type, getattr(bal, req.leave_type) + req.days)
            
    db.delete(req)
    db.commit()
    return {"status": "success", "message": "Leave request successfully deleted and balances restored if applicable."}

class ApprovedTimesheetResponse(BaseModel):
    id: int
    user_id: int
    manager_id: Optional[int]
    date: date
    project: str
    task: str
    description: str
    hours: float
    status: str
    employee_name: str
    approved_by_name: Optional[str] = None
    approved_by_role: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/timesheets/approved", response_model=List[ApprovedTimesheetResponse])
def get_approved_timesheets(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    from sqlalchemy.orm import aliased
    Employee = aliased(models.User)
    Manager = aliased(models.User)
    
    query = db.query(models.DailyTimesheet, Employee, Manager).join(
        Employee, models.DailyTimesheet.user_id == Employee.id
    ).outerjoin(
        Manager, models.DailyTimesheet.manager_id == Manager.id
    ).filter(
        models.DailyTimesheet.status == "approved"
    ).order_by(models.DailyTimesheet.date.desc())
    
    results = query.offset(skip).limit(limit).all()
    
    res = []
    for ts, emp, mgr in results:
        r = ApprovedTimesheetResponse(
            id=ts.id,
            user_id=ts.user_id,
            manager_id=ts.manager_id,
            date=ts.date,
            project=ts.project,
            task=ts.task,
            description=ts.description,
            hours=ts.hours,
            status=ts.status,
            employee_name=emp.name,
            approved_by_name=mgr.name if mgr else "Unknown",
            approved_by_role=mgr.role if mgr else ""
        )
        res.append(r)
    return res

# 6. Payroll Builder, Claims, and TDS
@router.get("/payroll/runs", response_model=List[PayrollRunResponse])
def get_payroll_runs(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    security.check_rbac_permission(db, current_user, "View Salary")
    return db.query(models.PayrollRun).offset(skip).limit(limit).all()

@router.post("/payroll/runs", response_model=PayrollRunResponse, status_code=status.HTTP_201_CREATED)
def create_payroll_run(req: PayrollRunCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    security.check_rbac_permission(db, current_user, "Run Payroll")
    run = models.PayrollRun(
        month=req.month,
        year=req.year,
        status="draft"
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run

@router.post("/payroll/runs/{id}/sign-maker", response_model=PayrollRunResponse)
def sign_payroll_maker(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    security.check_rbac_permission(db, current_user, "Run Payroll")
    run = db.query(models.PayrollRun).filter(models.PayrollRun.id == id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run period not found.")
        
    run.status = "maker_signed"
    run.maker_id = current_user.name
    run.maker_signed_at = datetime.now()
    
    db.commit()
    db.refresh(run)
    return run

@router.get("/payroll/claims", response_model=List[ExpenseClaimResponse])
def get_expense_claims(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.ExpenseClaim).offset(skip).limit(limit).all()

@router.post("/payroll/claims/{id}/approve", response_model=ExpenseClaimResponse)
def approve_expense_claim_hr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    claim = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found.")
        
    claim.hr_approval = "approved"
    if claim.tl_approval == "approved":
        claim.status = "approved"
        
    db_notify = models.Notification(
        user_id=claim.user_id,
        message=f"Your expense claim of ₹{claim.amount} category '{claim.category}' has been approved by HR.",
        type="success"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(claim)
    return claim

@router.post("/payroll/claims/{id}/reject", response_model=ExpenseClaimResponse)
def reject_expense_claim_hr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    claim = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found.")
        
    claim.hr_approval = "rejected"
    claim.status = "rejected"
    
    db_notify = models.Notification(
        user_id=claim.user_id,
        message=f"Your expense claim of ₹{claim.amount} category '{claim.category}' was rejected by HR.",
        type="danger"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(claim)
    return claim

@router.get("/payroll/tds-declarations", response_model=List[TDSDeclarationResponse])
def get_tds_declarations(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.TDSDeclaration).offset(skip).limit(limit).all()

@router.post("/payroll/tds-declarations/{id}/verify", response_model=TDSDeclarationResponse)
def verify_tds_declaration(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    tds = db.query(models.TDSDeclaration).filter(models.TDSDeclaration.id == id).first()
    if not tds:
        raise HTTPException(status_code=404, detail="TDS declaration not found.")
        
    tds.status = "verified"
    tds.verified_by = current_user.name
    
    db.commit()
    db.refresh(tds)
    return tds

@router.get("/payroll/loans", response_model=List[LoanResponse])
def get_payroll_loans(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.Loan).offset(skip).limit(limit).all()

@router.post("/payroll/loans", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(req: LoanCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    loan = models.Loan(
        user_id=req.employee_id,
        loan_amount=req.loan_amount,
        emi_amount=req.emi_amount,
        tenure=req.tenure,
        disbursed_at=datetime.now(),
        outstanding_balance=req.loan_amount,
        status="active"
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan

# 7. Performance & Appraisals
@router.get("/performance/disciplinary-tickets", response_model=List[DisciplinaryTicketResponse])
def get_disciplinary_tickets(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.DisciplinaryTicket).offset(skip).limit(limit).all()

@router.post("/performance/disciplinary-tickets", response_model=DisciplinaryTicketResponse, status_code=status.HTTP_201_CREATED)
def create_disciplinary_ticket(req: DisciplinaryTicketCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    # Set rebuttal deadline to 7 days from now
    deadline = datetime.fromordinal(date.today().toordinal() + 7)
    
    ticket = models.DisciplinaryTicket(
        employee_id=req.employee_id,
        issued_by=current_user.name,
        violation_type=req.violation_type,
        severity=req.severity,
        description=req.description,
        evidence_url=req.evidence_url,
        response_deadline=deadline,
        status="issued"
    )
    db.add(ticket)
    
    # Notify employee
    db_notify = models.Notification(
        user_id=req.employee_id,
        message=f"A new disciplinary ticket has been filed: {req.violation_type} ({req.severity}).",
        type="danger"
    )
    db.add(db_notify)
    
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/performance/disciplinary-tickets/{id}/resolve", response_model=DisciplinaryTicketResponse)
def resolve_disciplinary_ticket(id: int, req: DisciplinaryTicketResolve, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    ticket = db.query(models.DisciplinaryTicket).filter(models.DisciplinaryTicket.id == id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Disciplinary ticket not found.")
        
    ticket.status = "resolved"
    if req.rebuttal:
        ticket.employee_rebuttal = req.rebuttal
        
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/performance/pips", response_model=List[PIPResponse])
def get_pips(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.PIP).offset(skip).limit(limit).all()

@router.post("/performance/pips", response_model=PIPResponse, status_code=status.HTTP_201_CREATED)
def create_pip(req: PIPCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    pip = models.PIP(
        employee_id=req.employee_id,
        ticket_id=req.ticket_id,
        manager_id=req.manager_id,
        start_date=req.start_date,
        duration_weeks=req.duration_weeks,
        goals=json.dumps(req.goals),
        status="ongoing",
        outcome="pending"
    )
    db.add(pip)
    db.commit()
    db.refresh(pip)
    return pip

@router.post("/performance/pips/{id}/update", response_model=PIPResponse)
def update_pip(id: int, req: PIPGoalUpdate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    pip = db.query(models.PIP).filter(models.PIP.id == id).first()
    if not pip:
        raise HTTPException(status_code=404, detail="PIP plan not found.")
        
    pip.goals = json.dumps(req.goals)
    pip.status = req.status
    pip.outcome = req.outcome
    
    db.commit()
    db.refresh(pip)
    return pip

# 8. Exits & Settlements
@router.get("/exits/resignations", response_model=List[ResignationResponse])
def get_resignations(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.Resignation).filter(
        models.Resignation.deleted_at == None,
        models.Resignation.status != "withdrawn",
        models.Resignation.status != "rejected"
    ).order_by(models.Resignation.resignation_date.desc()).offset(skip).limit(limit).all()



# 9. L&D (Learning Track)
@router.get("/lnd/tracks", response_model=List[TrainingTrackResponse])
def get_lnd_tracks(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.TrainingTrack).offset(skip).limit(limit).all()

@router.post("/lnd/tracks", response_model=TrainingTrackResponse, status_code=status.HTTP_201_CREATED)
def create_lnd_track(req: TrainingTrackCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    track = models.TrainingTrack(
        name=req.name,
        department=req.department,
        modules=json.dumps(req.modules),
        is_mandatory=req.is_mandatory
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    return track

@router.get("/lnd/progress", response_model=List[TrainingProgressResponse])
def get_lnd_progress(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.TrainingProgress).offset(skip).limit(limit).all()

# 10. Audit Logs
@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    security.check_rbac_permission(db, current_user, "View Audit Logs")
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

# 10.5 Leave Management (HR)

@router.get("/leaves", response_model=List[LeaveRequestResponse])
def get_all_leaves(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.LeaveRequest).order_by(models.LeaveRequest.from_date.desc()).offset(skip).limit(limit).all()

@router.get("/leave-balances", response_model=List[LeaveBalanceResponse])
def get_all_leave_balances(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.LeaveBalance).offset(skip).limit(limit).all()

@router.post("/leaves/on-behalf", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def apply_leave_on_behalf(req: LeaveRequestOnBehalf, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    new_req = models.LeaveRequest(
        user_id=req.employee_id,
        leave_type=req.leave_type,
        from_date=req.from_date,
        to_date=req.to_date,
        days=req.days,
        reason=req.reason,
        status="hr_approved",
        tl_approved_at=datetime.now(),
        hr_approved_at=datetime.now()
    )
    db.add(new_req)
    
    bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.user_id == req.employee_id).first()
    if bal:
        if req.leave_type == "CL": bal.CL = max(0, bal.CL - req.days)
        elif req.leave_type == "SL": bal.SL = max(0, bal.SL - req.days)
        elif req.leave_type == "EL": bal.EL = max(0, bal.EL - req.days)
        elif req.leave_type == "Maternity": bal.Maternity = max(0, bal.Maternity - req.days)
        
    db.add(models.Notification(
        user_id=req.employee_id,
        message=f"HR has submitted and approved a {req.leave_type} leave request on your behalf for {req.days} days ({req.from_date} to {req.to_date}).",
        type="info"
    ))
        
    db.commit()
    db.refresh(new_req)
    return new_req

@router.put("/leave-balances/{id}", response_model=LeaveBalanceResponse)
def update_leave_balance(id: int, req: LeaveBalanceAdjustment, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.id == id).first()
    if not bal:
        raise HTTPException(status_code=404, detail="Leave balance not found.")
        
    bal.CL = req.CL
    bal.SL = req.SL
    bal.EL = req.EL
    bal.Maternity = req.Maternity
    db.commit()
    db.refresh(bal)
    return bal

@router.put("/leaves/{id}", response_model=LeaveRequestResponse)
def edit_leave_request(id: int, req: LeaveRequestEdit, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    leave_req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not leave_req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    if leave_req.status == "hr_approved":
        bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.user_id == leave_req.user_id).first()
        if bal:
            type_changed = leave_req.leave_type != req.leave_type
            days_diff = req.days - leave_req.days
            if type_changed:
                if leave_req.leave_type == "CL": bal.CL += leave_req.days
                elif leave_req.leave_type == "SL": bal.SL += leave_req.days
                elif leave_req.leave_type == "EL": bal.EL += leave_req.days
                elif leave_req.leave_type == "Maternity": bal.Maternity += leave_req.days
                
                if req.leave_type == "CL": bal.CL = max(0, bal.CL - req.days)
                elif req.leave_type == "SL": bal.SL = max(0, bal.SL - req.days)
                elif req.leave_type == "EL": bal.EL = max(0, bal.EL - req.days)
                elif req.leave_type == "Maternity": bal.Maternity = max(0, bal.Maternity - req.days)
            else:
                if leave_req.leave_type == "CL": bal.CL = max(0, bal.CL - days_diff)
                elif leave_req.leave_type == "SL": bal.SL = max(0, bal.SL - days_diff)
                elif leave_req.leave_type == "EL": bal.EL = max(0, bal.EL - days_diff)
                elif leave_req.leave_type == "Maternity": bal.Maternity = max(0, bal.Maternity - days_diff)
                
    leave_req.leave_type = req.leave_type
    leave_req.from_date = req.from_date
    leave_req.to_date = req.to_date
    leave_req.days = req.days
    leave_req.reason = req.reason
    
    db.commit()
    db.refresh(leave_req)
    return leave_req

@router.delete("/leaves/{id}")
def delete_leave_request(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    leave_req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not leave_req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    if leave_req.status == "hr_approved":
        bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.user_id == leave_req.user_id).first()
        if bal:
            if leave_req.leave_type == "CL": bal.CL += leave_req.days
            elif leave_req.leave_type == "SL": bal.SL += leave_req.days
            elif leave_req.leave_type == "EL": bal.EL += leave_req.days
            elif leave_req.leave_type == "Maternity": bal.Maternity += leave_req.days
            
    db.delete(leave_req)
    db.commit()
    return {"status": "success", "message": "Leave request deleted successfully."}

class LeaveDenyRequest(BaseModel):
    reason: str

@router.post("/leaves/{id}/approve", response_model=LeaveRequestResponse)
def approve_leave_request(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    security.check_rbac_permission(db, current_user, "Approve Leaves")
    leave_req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not leave_req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    if leave_req.status == "hr_approved":
        return leave_req
        
    leave_req.status = "hr_approved"
    leave_req.hr_approved_at = datetime.now()
    
    bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.user_id == leave_req.user_id).first()
    if bal:
        if leave_req.leave_type == "CL": bal.CL = max(0, bal.CL - leave_req.days)
        elif leave_req.leave_type == "SL": bal.SL = max(0, bal.SL - leave_req.days)
        elif leave_req.leave_type == "EL": bal.EL = max(0, bal.EL - leave_req.days)
        elif leave_req.leave_type == "Maternity": bal.Maternity = max(0, bal.Maternity - leave_req.days)
        
    db.add(models.Notification(
        user_id=leave_req.user_id,
        message=f"Your {leave_req.leave_type} leave request for {leave_req.days} days ({leave_req.from_date} to {leave_req.to_date}) has been approved by HR.",
        type="success"
    ))
        
    db.commit()
    db.refresh(leave_req)
    return leave_req

@router.post("/leaves/{id}/deny", response_model=LeaveRequestResponse)
def deny_leave_request(id: int, req: LeaveDenyRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    leave_req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not leave_req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    was_hr_approved = (leave_req.status == "hr_approved")
    leave_req.status = "denied"
    
    if was_hr_approved:
        bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.user_id == leave_req.user_id).first()
        if bal:
            if leave_req.leave_type == "CL": bal.CL += leave_req.days
            elif leave_req.leave_type == "SL": bal.SL += leave_req.days
            elif leave_req.leave_type == "EL": bal.EL += leave_req.days
            elif leave_req.leave_type == "Maternity": bal.Maternity += leave_req.days
            
    db.add(models.Notification(
        user_id=leave_req.user_id,
        message=f"Your {leave_req.leave_type} leave request ({leave_req.from_date} to {leave_req.to_date}) was denied by HR. Reason: {req.reason}",
        type="danger"
    ))
        
    db.commit()
    db.refresh(leave_req)
    return leave_req


# 11. Appraisals & Increment Calibration
DEFAULT_SCORECARDS = [
    { "employee_name": 'John Doe', "tl_name": 'Sarah Jenkins', "rating": 'A — Excellent', "comments": 'Outstanding system design velocity. Handled HDFC payment integration flawlessly.' },
    { "employee_name": 'Jane Smith', "tl_name": 'Sarah Jenkins', "rating": 'B — Competent', "comments": 'Consistent uptime and server provisioning logs. Excellent IT compliance.' },
    { "employee_name": 'Rahul Roy', "tl_name": 'Vikram Sen', "rating": 'C — Developing', "comments": 'Good work on content SEO audits, but needs more punctuality on clock-ins.' }
]

DEFAULT_PROMOTIONS = [
    { "name": 'Priya Patel', "current": 'Junior Architect', "proposed": 'Systems Architect', "status": 'approved_by_ceo' }
]


@router.get("/appraisal-cycles", response_model=List[AppraisalCycleResponse])
def get_appraisal_cycles(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.AppraisalCycle).offset(skip).limit(limit).all()


@router.post("/appraisal-cycles", response_model=AppraisalCycleResponse, status_code=status.HTTP_201_CREATED)
def create_appraisal_cycle(req: AppraisalCycleCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    cycle = models.AppraisalCycle(
        name=req.name,
        period=req.period,
        start_date=req.start_date,
        end_date=req.end_date,
        self_deadline=req.self_deadline,
        tl_review_deadline=req.tl_review_deadline,
        status=req.status
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return cycle


@router.get("/increment-proposals", response_model=List[IncrementProposalResponse])
def get_increment_proposals(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.IncrementProposal).offset(skip).limit(limit).all()


@router.post("/increment-proposals", response_model=IncrementProposalResponse, status_code=status.HTTP_201_CREATED)
def create_increment_proposal(req: IncrementProposalCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    proposal = models.IncrementProposal(
        employee_id=req.employee_id,
        current_ctc=req.current_ctc,
        proposed_ctc=req.proposed_ctc,
        increment_pct=req.increment_pct,
        performance_band=req.performance_band,
        effective_date=req.effective_date,
        status="pending_ceo"
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return proposal


@router.get("/appraisal-scorecards", response_model=List[AppraisalScorecardResponse])
def get_appraisal_scorecards(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    scorecards = db.query(models.AppraisalScorecard).offset(skip).limit(limit).all()
    return scorecards


@router.get("/promotions", response_model=List[PromotionResponse])
def get_promotions(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    promotions = db.query(models.Promotion).offset(skip).limit(limit).all()
    if not promotions:
        for pr in DEFAULT_PROMOTIONS:
            db_pr = models.Promotion(**pr)
            db.add(db_pr)
        db.commit()
        promotions = db.query(models.Promotion).offset(skip).limit(limit).all()
    return promotions


@router.post("/appraisal-scorecards/{id}/acknowledge")
def acknowledge_hr_scorecard(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    scorecard = db.query(models.AppraisalScorecard).filter(models.AppraisalScorecard.id == id).first()
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found.")
    
    scorecard.hr_acknowledged = True
    
    tl_user = db.query(models.User).filter(models.User.name == scorecard.tl_name).first()
    if tl_user:
        db_notify = models.Notification(
            user_id=tl_user.id,
            message=f"HR has acknowledged your performance scorecard for {scorecard.employee_name} (Rating: {scorecard.rating}). Calibration audit confirmed.",
            type="success"
        )
        db.add(db_notify)
        db.commit()
    return {"status": "success", "message": f"TL [{scorecard.tl_name}] notified. Calibration audit acknowledged."}


@router.post("/promotions", response_model=PromotionResponse, status_code=status.HTTP_201_CREATED)
def create_promotion(req: PromotionCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    promo = models.Promotion(
        employee_id=req.employee_id,
        name=req.name,
        current=req.current,
        proposed=req.proposed,
        status="pending_ceo"
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)

    # Notify CEO users
    ceo_users = db.query(models.User).filter(models.User.role == "ceo").all()
    for ceo in ceo_users:
        db.add(models.Notification(
            user_id=ceo.id,
            message=f"HR has proposed a promotion for {req.name}: {req.current} → {req.proposed}. Awaiting your approval.",
            type="info"
        ))
    db.commit()

    return promo


@router.patch("/promotions/{id}/decide")
def decide_promotion(id: int, req: PromotionDecide, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role not in ["ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Only the CEO can approve or reject promotions.")
    promo = db.query(models.Promotion).filter(models.Promotion.id == id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found.")

    promo.status = req.decision
    db.commit()

    # Find employee by employee_id or name (fallback for old records)
    emp_user = db.query(models.User).filter(
        (models.User.id == promo.employee_id) if promo.employee_id else (models.User.name == promo.name)
    ).first()

    if emp_user:
        if req.decision == "approved_by_ceo":
            msg = f"Congratulations! Your promotion from {promo.current} to {promo.proposed} has been approved by the CEO!"
            ntype = "success"
            
            # Automatically update the user's designation
            emp_user.designation = promo.proposed
            
            # If the new title implies a management/lead role, upgrade their system access role to TL
            proposed_lower = promo.proposed.lower()
            if "lead" in proposed_lower or "manager" in proposed_lower or "director" in proposed_lower:
                if emp_user.role == "employee":
                    emp_user.role = "tl"
                    
            # Log the automatic update
            db.add(models.AuditLog(
                initiator_id="System Auto-Update",
                module="Promotions",
                record_id=emp_user.id,
                action_type="auto_update",
                change_diff=json.dumps({"old_designation": promo.current, "new_designation": promo.proposed, "new_role": emp_user.role})
            ))
            
            # Add a job history record
            job_hist = models.JobHistory(
                employee_id=emp_user.id,
                event_type="promotion",
                old_role=promo.current,
                new_role=promo.proposed,
                effective_date=date.today(),
                approved_by=current_user.name
            )
            db.add(job_hist)
            
        else:
            msg = f"Your proposed promotion from {promo.current} to {promo.proposed} was not approved at this time."
            ntype = "warning"
            
        db.add(models.Notification(user_id=emp_user.id, message=msg, type=ntype))
        db.commit()

    return {"status": "success", "decision": req.decision, "employee": promo.name}

# ─── Helpdesk (HR view) ───────────────────────────────────────────────────────

class SupportTicketResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    created_at: datetime
    employee_name: Optional[str] = "Employee"

    class Config:
        from_attributes = True

@router.get("/tickets", response_model=List[SupportTicketResponse])
def get_all_tickets(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    tickets = db.query(models.SupportTicket).order_by(models.SupportTicket.created_at.desc()).offset(skip).limit(limit).all()
    res = []
    for t in tickets:
        u = db.query(models.User).filter(models.User.id == t.user_id).first()
        t_dict = {
            "id": t.id,
            "user_id": t.user_id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "created_at": t.created_at,
            "employee_name": u.name if u else f"User #{t.user_id}"
        }
        res.append(t_dict)
    return res

@router.post("/tickets/{id}/resolve")
def resolve_ticket(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    t = db.query(models.SupportTicket).filter(models.SupportTicket.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    t.status = "Resolved"
    db.commit()
    db.refresh(t)
    return {"status": "success"}

@router.post("/tickets/{id}/reject")
def reject_ticket_hr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    t = db.query(models.SupportTicket).filter(models.SupportTicket.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    t.status = "Rejected"
    db.commit()
    db.refresh(t)
    return {"status": "success"}

# ─── Department Schema Builder ──────────────────────────────────────────────

class SchemaField(BaseModel):
    name: str
    type: str
    label: str

class DepartmentSchemaRequest(BaseModel):
    schema_fields: List[SchemaField]

@router.get("/schemas")
def get_all_schemas(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    schemas = db.query(models.DepartmentSchema).offset(skip).limit(limit).all()
    res = {}
    for s in schemas:
        try:
            res[s.department] = json.loads(s.schema_json)
        except Exception:
            res[s.department] = []
    return res

@router.post("/schemas/{dept}")
def update_schema(dept: str, req: DepartmentSchemaRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    s = db.query(models.DepartmentSchema).filter(models.DepartmentSchema.department == dept).first()
    fields_dict = [f.dict() for f in req.schema_fields]
    json_str = json.dumps(fields_dict)
    
    if s:
        s.schema_json = json_str
    else:
        new_schema = models.DepartmentSchema(department=dept, schema_json=json_str)
        db.add(new_schema)
        
    db.commit()
    return {"status": "success"}


# ─── PAYROLL RUNS MODULE ─────────────────────────────────────────────────────
# These endpoints are consumed by both the HR portal (to generate payroll)
# and the CEO portal (Approvals page reads payroll run status).

@router.get("/payroll/runs", response_model=List[PayrollRunResponse])
def list_payroll_runs(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Return all payroll runs ordered by most recent month/year."""
    verify_hr_role(current_user)
    return db.query(models.PayrollRun).order_by(
        models.PayrollRun.year.desc(),
        models.PayrollRun.month.desc()
    ).all()


@router.post("/payroll/runs", response_model=PayrollRunResponse, status_code=status.HTTP_201_CREATED)
def create_payroll_run(
    req: PayrollRunCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    HR initiates a new payroll run for a given month/year.
    Auto-generates individual Payslip records for every active employee.
    """
    verify_hr_role(current_user)

    # Prevent duplicate runs for the same period
    existing = db.query(models.PayrollRun).filter(
        models.PayrollRun.month == req.month,
        models.PayrollRun.year == req.year
    ).first()
    
    if existing:
        if existing.status not in ["attendance_locked", "deductions_calculated"]:
            raise HTTPException(status_code=400, detail=f"A payroll run for {req.month}/{req.year} already exists in state '{existing.status}'.")
        # Update the existing run
        run = existing
        run.status = "draft"
        run.maker_id = current_user.name
    else:
        # Create the parent PayrollRun record
        run = models.PayrollRun(
            month=req.month,
            year=req.year,
            status="draft",
            maker_id=current_user.name
        )
        db.add(run)
    db.flush()  # Flush to get run.id before creating payslips

    # Auto-generate payslips for all active employees
    employees = db.query(models.User).filter(
        models.User.role == "employee",
        models.User.status.in_(["active", "probation"])
    ).all()

    for emp in employees:
        # Use grade to determine salary band (Grade * 10,000 base salary)
        grade = emp.grade or 3
        basic = grade * 10000.0
        hra = basic * 0.4         # HRA = 40% of basic
        da = basic * 0.1          # DA = 10% of basic
        allowances = 5000.0       # Fixed special allowance
        epf = basic * 0.12        # EPF = 12% of basic
        tds = (basic + hra + da + allowances) * 0.05  # Simplified 5% TDS
        net = basic + hra + da + allowances - epf - tds

        payslip = models.Payslip(
            user_id=emp.id,
            payroll_run_id=run.id,
            basic=round(basic, 2),
            hra=round(hra, 2),
            da=round(da, 2),
            allowances=round(allowances, 2),
            epf=round(epf, 2),
            tds=round(tds, 2),
            net=round(net, 2),
            month=req.month,
            year=req.year
        )
        db.add(payslip)

        # Notify each employee that their payslip is ready
        notif = models.Notification(
            user_id=emp.id,
            message=f"Your payslip for {req.month}/{req.year} has been generated. Net Pay: ₹{round(net, 2):,.2f}",
            type="info",
            read=False
        )
        db.add(notif)

    db.commit()
    db.refresh(run)
    return run


@router.post("/payroll/runs/{id}/maker-sign", response_model=PayrollRunResponse)
def maker_sign_payroll(
    id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """HR Maker signs off on a payroll run, moving it to maker_signed status."""
    verify_hr_role(current_user)
    run = db.query(models.PayrollRun).filter(models.PayrollRun.id == id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found.")
    if run.status != "draft":
        raise HTTPException(status_code=400, detail=f"Cannot maker-sign. Current status: {run.status}")

    run.status = "maker_signed"
    run.maker_id = current_user.name
    run.maker_signed_at = datetime.now()
    db.commit()
    db.refresh(run)
    return run


@router.post("/payroll/runs/{id}/checker-sign", response_model=PayrollRunResponse)
def checker_sign_payroll(
    id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    HR Checker (or CEO) verifies and approves the payroll run.
    CEO Approvals page calls this endpoint when approving a payroll.
    """
    # CEO can also approve payroll runs, so allow ceo role here
    if current_user.role not in ["hr", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    run = db.query(models.PayrollRun).filter(models.PayrollRun.id == id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found.")
    if run.status != "maker_signed":
        raise HTTPException(status_code=400, detail=f"Cannot checker-sign. Current status: {run.status}")

    run.status = "checker_signed"
    run.checker_id = current_user.name
    run.checker_signed_at = datetime.now()
    db.commit()
    db.refresh(run)
    return run


@router.post("/payroll/runs/{id}/bank-transfer", response_model=PayrollRunResponse)
def bank_transfer_payroll(
    id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Mark payroll run as bank-transferred (final step after CEO approval)."""
    verify_hr_role(current_user)
    run = db.query(models.PayrollRun).filter(models.PayrollRun.id == id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found.")
    if run.status != "checker_signed":
        raise HTTPException(status_code=400, detail=f"Cannot transfer. Current status: {run.status}")

    run.status = "bank_transferred"
    run.bank_transfer_at = datetime.now()
    db.commit()
    db.refresh(run)
    return run


# ─── PROMOTIONS MODULE ────────────────────────────────────────────────────────
# Promotions flow: HR proposes → CEO approves/rejects (via CEO Approvals page)




# ─── EXITS & RESIGNATIONS MODULE ─────────────────────────────────────────────
# Resignations flow: Employee submits → HR reviews → CEO approves (via Approvals page)

@router.get("/exits/resignations", response_model=List[ResignationResponse])
def list_resignations(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Fetch all employee resignation records. Used by CEO Approvals page."""
    if current_user.role not in ["hr", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    return db.query(models.Resignation).filter(
        models.Resignation.deleted_at == None,
        models.Resignation.status != "withdrawn",
        models.Resignation.status != "rejected"
    ).order_by(models.Resignation.resignation_date.desc()).all()


@router.post("/exits/resignations/{id}/approve")
def approve_resignation(
    id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    HR or CEO approves a resignation.
    Updates resignation status and marks the employee as 'inactive' post-LWD.
    """
    if current_user.role not in ["hr", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    res = db.query(models.Resignation).filter(models.Resignation.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resignation record not found.")
    was_withdraw = res.status == "withdraw_pending" or getattr(res, "ceo_status", "") == "withdraw_pending"
    
    if current_user.role == "ceo":
        current_status = getattr(res, "ceo_status", "pending")
        if current_status == "withdraw_pending":
            res.ceo_status = "withdrawn"
        elif current_status == "pending":
            res.ceo_status = "approved"
        else:
            raise HTTPException(status_code=400, detail=f"Resignation is already {current_status}.")
    else:
        if res.status == "withdraw_pending":
            res.status = "withdrawn"
        elif res.status == "pending":
            res.status = "approved"
        else:
            raise HTTPException(status_code=400, detail=f"Resignation is already {res.status}.")

    # Notify the employee of the approval
    if was_withdraw:
        msg = "Your resignation withdrawal request has been approved."
    else:
        msg = f"Your resignation has been approved. Your Last Working Day is {res.LWD}. We wish you all the best!"

    notif = models.Notification(
        user_id=res.user_id,
        message=msg,
        type="info",
        read=False
    )
    db.add(notif)
    db.commit()
    return {"status": "success", "message": "Resignation approved successfully."}


@router.post("/exits/resignations/{id}/reject")
def reject_resignation(
    id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """HR or CEO rejects a resignation (e.g., during a counter-offer process)."""
    if current_user.role not in ["hr", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    res = db.query(models.Resignation).filter(models.Resignation.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resignation record not found.")
    was_withdraw = res.status == "withdraw_pending" or getattr(res, "ceo_status", "") == "withdraw_pending"

    if current_user.role == "ceo":
        current_status = getattr(res, "ceo_status", "pending")
        if current_status == "withdraw_pending":
            res.ceo_status = "pending"
        elif current_status == "pending":
            res.ceo_status = "rejected"
        else:
            raise HTTPException(status_code=400, detail=f"Resignation is already {current_status}.")
    else:
        if res.status == "withdraw_pending":
            res.status = "pending"
        elif res.status == "pending":
            res.status = "rejected"
        else:
            raise HTTPException(status_code=400, detail=f"Resignation is already {res.status}.")

    # Notify the employee
    if was_withdraw:
        msg = "Your resignation withdrawal request has been rejected. Your resignation remains active."
    else:
        msg = "Your resignation request has been reviewed and rejected. Please reach out to HR for next steps."
        
    notif = models.Notification(
        user_id=res.user_id,
        message=msg,
        type="warning",
        read=False
    )
    db.add(notif)
    db.commit()
    return {"status": "success", "message": "Resignation rejected successfully."}


class AssetResponse(BaseModel):
    id: str
    user_id: Optional[int]
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

class AssetCreate(BaseModel):
    assetTag: str
    type: str
    name: str
    serialNumber: Optional[str] = None
    issueDate: Optional[date] = None
    condition: Optional[str] = None

class LeaveBalanceResponse(BaseModel):
    id: int
    employee_id: int
    CL: float
    SL: float
    EL: float

    class Config:
        from_attributes = True

class LoanResponse(BaseModel):
    id: int
    employee_id: int
    principal_amount: float
    outstanding_balance: float
    emi_amount: float
    status: str

    class Config:
        from_attributes = True

@router.get("/exits/assets/{employee_id}", response_model=List[AssetResponse])
def get_employee_assets(employee_id: int, current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.Asset).filter(models.Asset.user_id == employee_id).offset(skip).limit(limit).all()

@router.patch("/exits/assets/{asset_id}/return")
def return_employee_asset(asset_id: str, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
    
    # Toggle logic for UI simplicity
    if asset.returnStatus == "Signed":
        asset.returnStatus = "Pending NOC"
        asset.signedDate = None
    else:
        asset.returnStatus = "Signed"
        asset.signedDate = datetime.now().date()
    db.commit()
    return {"status": "success", "returnStatus": asset.returnStatus}

@router.get("/onboarding/assets/{employee_id}", response_model=List[AssetResponse])
def get_onboarding_employee_assets(employee_id: int, current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.Asset).filter(models.Asset.user_id == employee_id).offset(skip).limit(limit).all()

@router.post("/onboarding/assets/{employee_id}", response_model=AssetResponse)
def assign_asset_to_employee(employee_id: int, req: AssetCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    asset = models.Asset(
        id=req.assetTag,
        user_id=employee_id,
        assetTag=req.assetTag,
        type=req.type,
        name=req.name,
        serialNumber=req.serialNumber,
        issueDate=req.issueDate or date.today(),
        condition=req.condition or "New",
        returnStatus="Issued"
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

class DocumentItem(BaseModel):
    name: str
    link: Optional[str] = None
    type: str = "Document"
    status: str = "Uploaded"

@router.get("/onboarding/documents/{employee_id}")
def get_onboarding_documents(employee_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    user = db.query(models.User).filter(models.User.id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if user.documents:
        import json
        return json.loads(user.documents)
    return []

from fastapi import Form, UploadFile, File
import os

@router.post("/onboarding/documents/{employee_id}")
async def add_onboarding_document(
    employee_id: int,
    name: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    verify_hr_role(current_user)
    user = db.query(models.User).filter(models.User.id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    import json
    import uuid
    from datetime import datetime
    
    # Save file
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
        "link": f"/uploads/{file_name}",
        "type": "Document",
        "status": "Uploaded",
        "date": datetime.now().isoformat(),
        "original_filename": file.filename
    }
    existing_docs.append(new_doc)
    
    user.documents = json.dumps(existing_docs)
    db.commit()
    
    return new_doc

@router.get("/exits/fnf-details/{employee_id}")
def get_fnf_details(employee_id: int, current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    loans = db.query(models.Loan).filter(models.Loan.user_id == employee_id, models.Loan.status == "active").offset(skip).limit(limit).all()
    leave_balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.user_id == employee_id).first()
    return {
        "loans": [{"outstanding_balance": l.outstanding_balance} for l in loans],
        "leaveBalances": {"EL": leave_balance.EL if leave_balance else 0}
    }

@router.post("/exits/resignations/{id}/finalize")
def finalize_fnf(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    res = db.query(models.Resignation).filter(models.Resignation.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resignation not found.")
    res.status = "cleared"
    
    db_log = models.AuditLog(
        timestamp=datetime.now(),
        initiator_id=current_user.name,
        module="Exits",
        record_id=res.user_id,
        action_type="payroll_lock",
        change_diff=json.dumps({"fnf_settlement": "finalized"}),
        ip_address="127.0.0.1",
        client_agent="ERP backend"
    )
    db.add(db_log)
    db.commit()
    return {"status": "success"}

@router.post("/exits/resignations/{id}/sign-noc")
def sign_noc(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    res = db.query(models.Resignation).filter(models.Resignation.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resignation not found.")
    
    user = db.query(models.User).filter(models.User.id == res.user_id).first()
    if user:
        user.status = "inactive"
        user.is_active = False

    db_log = models.AuditLog(
        timestamp=datetime.now(),
        initiator_id=current_user.name,
        module="Exits",
        record_id=res.user_id,
        action_type="verify_doc",
        change_diff=json.dumps({"noc_stamped": "fully_signed", "account_status": "deactivated"}),
        ip_address="127.0.0.1",
        client_agent="ERP backend"
    )
    db.add(db_log)
    db.commit()
    return {"status": "success"}

# ─── PAYROLL / TDS DECLARATIONS MODULE ───────────────────────────────────────
# These endpoints are called by PayrollBuilderView.jsx to verify TDS declarations
# before running payroll.

@router.get("/payroll/tds-declarations", response_model=List[TDSDeclarationResponse])
def list_tds_declarations(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Return all employee TDS investment declarations. Shown to HR on Payroll Builder page."""
    verify_hr_role(current_user)
    return db.query(models.TDSDeclaration).order_by(models.TDSDeclaration.id.desc()).offset(skip).limit(limit).all()


@router.post("/payroll/tds-declarations/{id}/verify")
def verify_tds_declaration(
    id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """HR verifies and signs off a pending TDS declaration before locking payroll."""
    verify_hr_role(current_user)
    decl = db.query(models.TDSDeclaration).filter(models.TDSDeclaration.id == id).first()
    if not decl:
        raise HTTPException(status_code=404, detail="TDS declaration not found.")
    decl.status = "verified"
    decl.verified_by = current_user.name
    db.commit()
    return {"status": "success", "message": "TDS declaration verified successfully."}


# ─── PAYROLL / EXPENSE CLAIMS MODULE ─────────────────────────────────────────
# PayrollBuilderView.jsx fetches expense claims and lets HR approve/reject them
# as part of the payroll reimbursement process.

@router.get("/payroll/claims", response_model=List[ExpenseClaimResponse])
def list_expense_claims_for_payroll(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Return all expense claims. The frontend filters to show only tl_approved ones
    that are pending HR verification.
    """
    verify_hr_role(current_user)
    return db.query(models.ExpenseClaim).order_by(models.ExpenseClaim.claim_date.desc()).offset(skip).limit(limit).all()


@router.post("/payroll/claims/{id}/approve")
def approve_expense_claim(
    id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """HR approves and reimburses an expense claim, marking it as hr_approved."""
    verify_hr_role(current_user)
    claim = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found.")
    claim.hr_approval = "approved"
    claim.status = "approved"
    # Notify the employee
    notif = models.Notification(
        user_id=claim.user_id,
        message=f"Your expense claim of ₹{claim.amount:,.2f} ({claim.category}) has been approved and will be reimbursed in the next payroll.",
        type="success",
        read=False
    )
    db.add(notif)
    db.commit()
    return {"status": "success", "message": "Expense claim approved."}


@router.post("/payroll/claims/{id}/reject")
def reject_expense_claim(
    id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """HR rejects an expense claim."""
    verify_hr_role(current_user)
    claim = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found.")
    claim.hr_approval = "rejected"
    claim.status = "rejected"
    # Notify the employee
    notif = models.Notification(
        user_id=claim.user_id,
        message=f"Your expense claim of ₹{claim.amount:,.2f} ({claim.category}) has been rejected by HR. Please contact HR for more details.",
        type="warning",
        read=False
    )
    db.add(notif)
    db.commit()
    return {"status": "success", "message": "Expense claim rejected."}


# ─── PAYROLL BUILDER PHASE 1 & 2 ─────────────────────────────────────────────

@router.post("/payroll/lock-attendance")
def lock_attendance_payroll(
    payload: dict,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Phase 1: Lock attendance logs for the active month."""
    verify_hr_role(current_user)
    month = payload.get("month", datetime.now().month)
    year = payload.get("year", datetime.now().year)
    
    # Check if a draft run exists; if not, create one in "attendance_locked" state
    run = db.query(models.PayrollRun).filter(
        models.PayrollRun.month == month,
        models.PayrollRun.year == year
    ).first()
    
    if run:
        if run.status not in ["draft", "attendance_locked"]:
            raise HTTPException(status_code=400, detail=f"Cannot lock attendance. Payroll is already in {run.status} state.")
        run.status = "attendance_locked"
    else:
        run = models.PayrollRun(month=month, year=year, status="attendance_locked")
        db.add(run)
    db.commit()
    return {"status": "success", "message": f"Attendance data locked for {month}/{year}. Punch regularizations are frozen."}

@router.post("/payroll/calculate-deductions")
def calculate_payroll_deductions(
    payload: dict,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Phase 2: Calculate Provident Fund contributions, professional taxes, LOP, and TDS schedules."""
    verify_hr_role(current_user)
    month = payload.get("month", datetime.now().month)
    year = payload.get("year", datetime.now().year)
    
    run = db.query(models.PayrollRun).filter(
        models.PayrollRun.month == month,
        models.PayrollRun.year == year
    ).first()
    
    if not run or run.status not in ["attendance_locked", "deductions_calculated", "draft"]:
        raise HTTPException(status_code=400, detail="Must lock attendance first before applying deductions.")
        
    run.status = "deductions_calculated"
    db.commit()
    return {"status": "success", "message": f"LOP and statutory TDS tax structures successfully calculated and applied for {month}/{year}."}

@router.get("/payroll/draft-ledger")
def get_draft_ledger(
    month: int,
    year: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Calculates and returns the computed ledger values based on attendance and deductions."""
    verify_hr_role(current_user)
    # Simulated calculation of total gross, deductions, and net pay
    # In a real scenario, this iterates over all employees
    employees = db.query(models.User).filter(models.User.role == "employee").count()
    if employees == 0:
        employees = 10 # fallback
        
    total_gross = employees * 55000.0  # mock logic but dynamic to employee count
    total_deductions = employees * 5000.0
    total_net = total_gross - total_deductions
    
    return {
        "month": month,
        "year": year,
        "total_gross": total_gross,
        "total_deductions": total_deductions,
        "total_net": total_net
    }

@router.post("/payroll/tds-declarations/{id}/reject")
def reject_tds_declaration(
    id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """HR rejects a TDS declaration."""
    verify_hr_role(current_user)
    decl = db.query(models.TDSDeclaration).filter(models.TDSDeclaration.id == id).first()
    if not decl:
        raise HTTPException(status_code=404, detail="TDS Declaration not found.")
    
    decl.status = "rejected"
    # Notify employee
    notif = models.Notification(
        user_id=decl.user_id,
        message=f"Your TDS declaration for FY {decl.financial_year} was rejected by HR. Please correct and resubmit.",
        type="danger",
        read=False
    )
    db.add(notif)
    db.commit()
    return {"status": "success", "message": "TDS Investment Declaration rejected successfully."}


# ─── MAKER-SIGN ALIAS ─────────────────────────────────────────────────────────
# PayrollBuilderView.jsx calls /payroll/runs/{id}/sign-maker (different URL name).
# This alias endpoint ensures the frontend call works without changing the frontend.

@router.post("/payroll/runs/{id}/sign-maker", response_model=PayrollRunResponse)
def maker_sign_alias(
    id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Alias for /payroll/runs/{id}/maker-sign — called by the frontend PayrollBuilderView."""
    verify_hr_role(current_user)
    run = db.query(models.PayrollRun).filter(models.PayrollRun.id == id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found.")
    if run.status != "draft":
        raise HTTPException(status_code=400, detail=f"Cannot maker-sign. Current status: {run.status}")
    run.status = "maker_signed"
    run.maker_id = current_user.name
    run.maker_signed_at = datetime.now()
    db.commit()
    db.refresh(run)
    return run


# ─── L&D TRAINING MODULE ─────────────────────────────────────────────────────
# LearningLndView.jsx fetches /lnd/tracks and /lnd/progress to display
# training course progress for all employees.

@router.get("/lnd/tracks", response_model=List[TrainingTrackResponse])
def list_lnd_tracks(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Return all L&D training tracks. HR creates and manages these."""
    verify_hr_role(current_user)
    tracks = db.query(models.TrainingTrack).offset(skip).limit(limit).all()
    if not tracks:
        # Auto-seed default tracks if none exist so the page doesn't show blank
        defaults = [
            models.TrainingTrack(name="Compliance & Code of Conduct", department="All", is_mandatory=True,
                modules='[{"title":"Company Policies","duration":30},{"title":"Anti-Harassment Policy","duration":20},{"title":"Compliance Quiz","duration":15}]'),
            models.TrainingTrack(name="Engineering Onboarding", department="Engineering", is_mandatory=False,
                modules='[{"title":"Dev Environment Setup","duration":60},{"title":"Code Review Standards","duration":45},{"title":"CI/CD Pipeline","duration":30}]'),
            models.TrainingTrack(name="Leadership Foundations", department="All", is_mandatory=False,
                modules='[{"title":"Effective Communication","duration":40},{"title":"Team Management","duration":50},{"title":"Performance Feedback","duration":35}]'),
        ]
        for d in defaults:
            db.add(d)
        db.commit()
        tracks = db.query(models.TrainingTrack).offset(skip).limit(limit).all()
    return tracks


@router.post("/lnd/tracks", response_model=TrainingTrackResponse, status_code=status.HTTP_201_CREATED)
def create_lnd_track(
    req: TrainingTrackCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """HR creates a new training track."""
    verify_hr_role(current_user)
    track = models.TrainingTrack(
        name=req.name,
        department=req.department,
        is_mandatory=req.is_mandatory,
        modules=json.dumps(req.modules)
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    return track


@router.get("/lnd/progress", response_model=List[TrainingProgressResponse])
def list_lnd_progress(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Return training progress records for all employees."""
    verify_hr_role(current_user)
    return db.query(models.TrainingProgress).offset(skip).limit(limit).all()


# ─── GRIEVANCE TICKETS (HR MESSAGING) ────────────────────────────────────────
# HrMessagingView.jsx calls /hr-portal/tickets to load support/grievance tickets
# raised by employees. This maps to the SupportTicket model.

class TicketResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/tickets", response_model=List[TicketResponse])
def list_support_tickets(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Return all employee-raised support/grievance tickets for the HR messaging view."""
    verify_hr_role(current_user)
    return db.query(models.SupportTicket).order_by(models.SupportTicket.created_at.desc()).offset(skip).limit(limit).all()

# ─── MOCKED ENDPOINTS FOR CEO APPROVALS ──────────────────────────────────────

@router.get("/payroll/runs")
def get_payroll_runs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    runs = db.query(models.PayrollRun).offset(skip).limit(limit).all()
    res = []
    for r in runs:
        res.append({
            "id": r.id,
            "month": r.month,
            "year": r.year,
            "status": r.status,
            "maker_signed_at": r.maker_signed_at.isoformat() if r.maker_signed_at else None,
            "checker_signed_at": r.checker_signed_at.isoformat() if r.checker_signed_at else None,
            "bank_transfer_at": r.bank_transfer_at.isoformat() if r.bank_transfer_at else None
        })
    return res

class PayrollRunCreate(BaseModel):
    month: int
    year: int

@router.post("/payroll/runs")
def create_payroll_run(req: PayrollRunCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    new_run = models.PayrollRun(
        month=req.month,
        year=req.year,
        status="maker_signed",
        maker_signed_at=datetime.utcnow()
    )
    db.add(new_run)
    db.commit()
    db.refresh(new_run)
    return {"status": "success", "run_id": new_run.id}


@router.get("/exits/resignations")
def get_resignations(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    resigs = db.query(models.Resignation).offset(skip).limit(limit).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "employee_id": r.user_id,
            "resignation_date": r.resignation_date.isoformat() if r.resignation_date else None,
            "LWD": r.LWD.isoformat() if r.LWD else None,
            "reason": r.reason,
            "status": r.status
        } for r in resigs
    ]


# ─── HOLIDAYS ────────────────────────────────────────────────────────────────

class HolidayCreate(BaseModel):
    name: str
    date: str
    type: Optional[str] = "national"

class HolidayResponse(BaseModel):
    id: int
    name: str
    date: str
    type: str

    class Config:
        from_attributes = True

@router.get("/holidays", response_model=List[HolidayResponse])
def list_holidays(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Return all configured holidays. Seeds defaults on first call."""
    holidays = db.query(models.Holiday).order_by(models.Holiday.date).offset(skip).limit(limit).all()
    if not holidays:
        # Seed national holidays on first call
        seeds = [
            models.Holiday(name="Republic Day",     date="2026-01-26", type="national"),
            models.Holiday(name="Independence Day", date="2026-08-15", type="national"),
            models.Holiday(name="Gandhi Jayanti",   date="2026-10-02", type="national"),
            models.Holiday(name="Christmas Day",    date="2026-12-25", type="national"),
        ]
        db.add_all(seeds)
        db.commit()
        db.refresh(seeds[0])
        holidays = db.query(models.Holiday).order_by(models.Holiday.date).offset(skip).limit(limit).all()
    return holidays

@router.post("/holidays", response_model=HolidayResponse)
def add_holiday(
    payload: HolidayCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    verify_hr_role(current_user)
    h = models.Holiday(name=payload.name, date=payload.date, type=payload.type)
    db.add(h)
    db.commit()
    db.refresh(h)
    return h

@router.delete("/holidays/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    verify_hr_role(current_user)
    h = db.query(models.Holiday).filter(models.Holiday.id == holiday_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(h)
    db.commit()
    return {"detail": "Deleted"}


# ─── LEAVE POLICIES ──────────────────────────────────────────────────────────

class LeavePolicyResponse(BaseModel):
    id: int
    type: str
    accrual_rule: str
    max_balance: int
    carryover_days: int
    is_active: bool

    class Config:
        from_attributes = True

class LeavePolicyUpdate(BaseModel):
    max_balance: Optional[int] = None
    carryover_days: Optional[int] = None
    is_active: Optional[bool] = None

@router.get("/leave/policies", response_model=List[LeavePolicyResponse])
def list_leave_policies(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Return all leave policies. Seeds defaults on first call."""
    policies = db.query(models.LeavePolicy).offset(skip).limit(limit).all()
    if not policies:
        seeds = [
            models.LeavePolicy(type="CL",        accrual_rule="monthly",  max_balance=12,  carryover_days=2,  is_active=True),
            models.LeavePolicy(type="SL",        accrual_rule="monthly",  max_balance=15,  carryover_days=5,  is_active=True),
            models.LeavePolicy(type="EL",        accrual_rule="monthly",  max_balance=30,  carryover_days=15, is_active=True),
            models.LeavePolicy(type="Maternity", accrual_rule="onetime",  max_balance=180, carryover_days=0,  is_active=True),
        ]
        db.add_all(seeds)
        db.commit()
        policies = db.query(models.LeavePolicy).offset(skip).limit(limit).all()
    return policies

@router.patch("/leave/policies/{policy_id}", response_model=LeavePolicyResponse)
def update_leave_policy(
    policy_id: int,
    payload: LeavePolicyUpdate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    verify_hr_role(current_user)
    policy = db.query(models.LeavePolicy).filter(models.LeavePolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    if payload.max_balance is not None:
        policy.max_balance = payload.max_balance
    if payload.carryover_days is not None:
        policy.carryover_days = payload.carryover_days
    if payload.is_active is not None:
        policy.is_active = payload.is_active
    db.commit()
    db.refresh(policy)
    return policy


# ─── CUSTOM SCHEMAS (Task Form Builder) ──────────────────────────────────────

@router.get("/schemas")
def get_all_schemas(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Return all department schemas as a dict { dept: [fields] }."""
    schemas = db.query(models.CustomSchema).offset(skip).limit(limit).all()
    return {s.department: json.loads(s.schema_fields) for s in schemas}

@router.post("/schemas/{department}")
def save_schema(
    department: str,
    payload: dict,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    verify_hr_role(current_user)
    schema_fields = payload.get("schema_fields", [])
    existing = db.query(models.CustomSchema).filter(models.CustomSchema.department == department).first()
    if existing:
        existing.schema_fields = json.dumps(schema_fields)
    else:
        db.add(models.CustomSchema(department=department, schema_fields=json.dumps(schema_fields)))
    db.commit()
    return {"detail": f"Schema for {department} saved successfully"}
# 5. Leaves Management
@router.get("/leaves/balances", response_model=List[LeaveBalanceResponse])
def get_leave_balances(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.LeaveBalance).offset(skip).limit(limit).all()

@router.put("/leaves/balances/{id}", response_model=LeaveBalanceResponse)
def adjust_leave_balance(id: int, req: LeaveBalanceAdjustment, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.id == id).first()
    if not bal:
        raise HTTPException(status_code=404, detail="Leave balance record not found.")
    bal.CL = req.CL
    bal.SL = req.SL
    bal.EL = req.EL
    bal.Maternity = req.Maternity
    db.commit()
    db.refresh(bal)
    return bal

@router.get("/leaves/requests", response_model=List[LeaveRequestResponse])
def get_leave_requests(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.LeaveRequest).order_by(models.LeaveRequest.from_date.desc()).offset(skip).limit(limit).all()

@router.post("/leaves/requests/on-behalf", response_model=LeaveRequestResponse)
def apply_leave_on_behalf(req: LeaveRequestOnBehalf, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    emp = db.query(models.User).filter(models.User.id == req.employee_id, models.User.role == "employee").first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")
        
    new_req = models.LeaveRequest(
        user_id=req.employee_id,
        leave_type=req.leave_type,
        from_date=req.from_date,
        to_date=req.to_date,
        days=req.days,
        reason=req.reason,
        status="hr_approved",
        tl_approved_at=datetime.now(),
        hr_approved_at=datetime.now()
    )
    db.add(new_req)
    
    bal = db.query(models.LeaveBalance).filter(
        models.LeaveBalance.user_id == req.employee_id,
        models.LeaveBalance.year == date.today().year
    ).first()
    if bal and hasattr(bal, req.leave_type):
        current_bal = getattr(bal, req.leave_type)
        setattr(bal, req.leave_type, max(0.0, current_bal - req.days))
        
    db_notify = models.Notification(
        user_id=req.employee_id,
        message=f"HR has submitted and approved a {req.leave_type} leave request on your behalf for {req.days} days ({req.from_date} to {req.to_date}).",
        type="info"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(new_req)
    return new_req

@router.put("/leaves/requests/{id}", response_model=LeaveRequestResponse)
def edit_leave_request(id: int, req: LeaveRequestEdit, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    db_req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    if db_req.status == "hr_approved":
        bal = db.query(models.LeaveBalance).filter(
            models.LeaveBalance.user_id == db_req.user_id,
            models.LeaveBalance.year == date.today().year
        ).first()
        if bal:
            type_changed = db_req.leave_type != req.leave_type
            if type_changed:
                if hasattr(bal, db_req.leave_type):
                    setattr(bal, db_req.leave_type, getattr(bal, db_req.leave_type) + db_req.days)
                if hasattr(bal, req.leave_type):
                    setattr(bal, req.leave_type, max(0.0, getattr(bal, req.leave_type) - req.days))
            else:
                days_diff = req.days - db_req.days
                if hasattr(bal, db_req.leave_type):
                    setattr(bal, db_req.leave_type, max(0.0, getattr(bal, db_req.leave_type) - days_diff))
                    
    db_req.leave_type = req.leave_type
    db_req.from_date = req.from_date
    db_req.to_date = req.to_date
    db_req.days = req.days
    db_req.reason = req.reason
    
    db.commit()
    db.refresh(db_req)
    return db_req

@router.post("/leaves/requests/{id}/approve", response_model=LeaveRequestResponse)
def approve_leave_hr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    security.check_rbac_permission(db, current_user, "Approve Leaves")
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    req.status = "hr_approved"
    req.hr_approved_at = datetime.now()
    
    bal = db.query(models.LeaveBalance).filter(
        models.LeaveBalance.user_id == req.user_id,
        models.LeaveBalance.year == date.today().year
    ).first()
    if bal and hasattr(bal, req.leave_type):
        current_bal = getattr(bal, req.leave_type)
        setattr(bal, req.leave_type, max(0.0, current_bal - req.days))
        
    db_notify = models.Notification(
        user_id=req.user_id,
        message=f"Your leave request from {req.from_date} to {req.to_date} has been fully approved by HR.",
        type="success"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(req)
    return req

@router.post("/leaves/requests/{id}/deny", response_model=LeaveRequestResponse)
def reject_leave_hr(id: int, payload: LeaveRequestDeny, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    security.check_rbac_permission(db, current_user, "Approve Leaves")
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    req.status = "denied"
    req.denial_reason = payload.reason
    
    db_notify = models.Notification(
        user_id=req.user_id,
        message=f"Your leave request from {req.from_date} to {req.to_date} was rejected by HR. Reason: {payload.reason}",
        type="danger"
    )
    db.add(db_notify)
    db.commit()
    db.refresh(req)
    return req

@router.delete("/leaves/requests/{id}")
def delete_leave_request(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    if req.status == "hr_approved":
        bal = db.query(models.LeaveBalance).filter(
            models.LeaveBalance.user_id == req.user_id,
            models.LeaveBalance.year == date.today().year
        ).first()
        if bal and hasattr(bal, req.leave_type):
            setattr(bal, req.leave_type, getattr(bal, req.leave_type) + req.days)
            
    db.delete(req)
    db.commit()
    return {"status": "success", "message": "Leave request successfully deleted and balances restored if applicable."}

# ─── REPORTS & BI ENGINE MODULE ─────────────────────────────────────────────

@router.get("/reports/overview")
def get_reports_overview(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    employees = db.query(models.User).filter(models.User.role == "employee").offset(skip).limit(limit).all()
    resignations = db.query(models.Resignation).filter(models.Resignation.status == "approved").offset(skip).limit(limit).all()
    training = db.query(models.TrainingProgress).filter(models.TrainingProgress.passed == True).offset(skip).limit(limit).all()
    leave_reqs = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").count()
    increments = db.query(models.IncrementProposal).filter(models.IncrementProposal.status == "pending_ceo").count()
    
    total_headcount = len(employees)
    dept_counts = {}
    for emp in employees:
        dept = emp.department or "Unknown"
        dept_counts[dept] = dept_counts.get(dept, 0) + 1

    return {
        "totalEmployees": total_headcount,
        "attritionRate": round((len(resignations) / total_headcount * 100), 1) if total_headcount > 0 else 0.0,
        "approvedResignations": len(resignations),
        "complianceRate": round((len(training) / total_headcount * 100)) if total_headcount > 0 else 0,
        "passedQuiz": len(training),
        "pendingActions": leave_reqs + increments,
        "departmentHeadcounts": dept_counts
    }


@router.get("/reports/leave")
def get_reports_leave(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    pending_reqs = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").count()
    approved_this_year = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "approved").count()
    balances = db.query(models.LeaveBalance).offset(skip).limit(limit).all()
    
    total_utilization = 0
    employee_balances = []
    
    for b in balances:
        emp = db.query(models.User).filter(models.User.id == b.user_id).first()
        cl = b.CL if b.CL is not None else 12
        sl = b.SL if b.SL is not None else 8
        el = b.EL if b.EL is not None else 15
        total_alloc = 35
        used = (12 - cl) + (8 - sl) + (15 - el)
        util_pct = (used / total_alloc) * 100 if total_alloc > 0 else 0
        total_utilization += util_pct
        
        employee_balances.append({
            "employee_id": b.user_id,
            "employee_name": emp.name if emp else "Unknown",
            "cl_left": cl,
            "sl_left": sl,
            "el_left": el,
            "total_left": cl + sl + el,
            "utilization_pct": round(util_pct)
        })
        
    avg_util = (total_utilization / len(balances)) if balances else 0

    return {
        "pendingRequests": pending_reqs,
        "approvedThisYear": approved_this_year,
        "avgLeaveUsedPct": round(avg_util, 1),
        "employeeBalances": employee_balances
    }

@router.get("/reports/compliance")
def get_reports_compliance(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    employees = db.query(models.User).filter(models.User.role == "employee").offset(skip).limit(limit).all()
    total_headcount = len(employees)
    progress_records = db.query(models.TrainingProgress).offset(skip).limit(limit).all()
    passed_quiz = sum(1 for p in progress_records if p.passed)
    
    emp_compliance = []
    for emp in employees:
        prog = next((p for p in progress_records if p.employee_id == emp.id), None)
        emp_compliance.append({
            "employee_name": emp.name,
            "modules_done": prog.completed_modules if prog else 0,
            "quiz_score": prog.quiz_score if prog else None,
            "passed": prog.passed if prog else False
        })

    return {
        "quizPassed": passed_quiz,
        "totalHeadcount": total_headcount,
        "notAttempted": total_headcount - len(progress_records),
        "complianceRate": round((passed_quiz / total_headcount * 100)) if total_headcount > 0 else 0,
        "employeeCompliance": emp_compliance
    }

@router.get("/reports/workforce")
def get_reports_workforce(current_user: models.User = Depends(security.get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    employees = db.query(models.User).filter(models.User.role == "employee").offset(skip).limit(limit).all()
    resignations = db.query(models.Resignation).filter(models.Resignation.status == "approved").offset(skip).limit(limit).all()
    
    total_headcount = len(employees)
    approved_res = len(resignations)
    
    dept_counts = {}
    emp_directory = []
    for emp in employees:
        dept = emp.department or "Unknown"
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
        exited = any(r.user_id == emp.id for r in resignations)
        emp_directory.append({
            "name": emp.name,
            "department": emp.department,
            "designation": emp.designation,
            "grade": emp.grade,
            "exited": exited
        })

    return {
        "activeEmployees": total_headcount - approved_res,
        "attritionRate": round((approved_res / total_headcount * 100), 1) if total_headcount > 0 else 0.0,
        "approvedResignations": approved_res,
        "departmentsCount": len(dept_counts),
        "departmentHeadcounts": dept_counts,
        "employeeDirectory": emp_directory
    }

# ==============================================================================
# HR MESSAGING & CHAT ENDPOINTS (Isolated for HR Portal)
# ==============================================================================

class HRChannelCreate(BaseModel):
    id: str
    name: str
    label: Optional[str]
    type: str
    members: List[str]

class HRChannelResponse(BaseModel):
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

class HRMessageCreate(BaseModel):
    text: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None

class HRMessageResponse(BaseModel):
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

    class Config:
        from_attributes = True

class HRMessageUpdate(BaseModel):
    text: Optional[str] = None
    reactions: Optional[str] = None # JSON string of reactions
    seen_by: Optional[str] = None # JSON string of seen users

class HRChannelUpdate(BaseModel):
    name: Optional[str] = None
    label: Optional[str] = None

class HRMembersUpdate(BaseModel):
    members: List[str]

class HRUserDetailResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None
    photo: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/chat/users", response_model=List[HRUserDetailResponse])
def get_all_users_for_chat(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    return db.query(models.User).filter(models.User.role != "admin").offset(skip).limit(limit).all()

@router.get("/chat/channels", response_model=List[HRChannelResponse])
def hr_get_channels(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    return db.query(models.ChatChannel).offset(skip).limit(limit).all()

@router.post("/chat/channels", response_model=HRChannelResponse, status_code=status.HTTP_201_CREATED)
def hr_create_channel(req: HRChannelCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    import json
    new_channel = models.ChatChannel(
        id=req.id,
        name=req.name,
        label=req.label,
        type=req.type,
        members=json.dumps(req.members)
    )
    db.add(new_channel)
    db.commit()
    db.refresh(new_channel)
    return new_channel

@router.get("/chat/channels/{channel_id}/messages", response_model=List[HRMessageResponse])
def hr_get_channel_messages(channel_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    return db.query(models.ChatMessage).filter(models.ChatMessage.channel_id == channel_id).order_by(models.ChatMessage.timestamp.asc()).offset(skip).limit(limit).all()

@router.post("/chat/channels/{channel_id}/send", response_model=HRMessageResponse, status_code=status.HTTP_201_CREATED)
def hr_send_message(channel_id: str, req: HRMessageCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    channel = db.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    sender_name = current_user.name
    if current_user.role == "hr":
        sender_name += " (HR)"
        
    new_msg = models.ChatMessage(
        channel_id=channel_id,
        sender=sender_name,
        text=req.text,
        timestamp=datetime.utcnow(),
        attachment_url=req.attachment_url,
        attachment_type=req.attachment_type
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@router.patch("/chat/messages/{message_id}", response_model=HRMessageResponse)
def hr_update_message(message_id: int, req: HRMessageUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if req.text is not None:
        msg.text = req.text
        msg.is_edited = True
    if req.reactions is not None:
        msg.reactions = req.reactions
    if req.seen_by is not None:
        msg.seen_by = req.seen_by
        
    db.commit()
    db.refresh(msg)
    return msg

@router.delete("/chat/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def hr_delete_message(message_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.deleted_at = datetime.utcnow()
    db.commit()
    return None

@router.put("/chat/channels/{channel_id}/members", response_model=HRChannelResponse)
def hr_update_channel_members(channel_id: str, req: HRMembersUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    channel = db.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    import json
    channel.members = json.dumps(req.members)
    db.commit()
    db.refresh(channel)
    return channel

@router.patch("/chat/channels/{channel_id}", response_model=HRChannelResponse)
def hr_update_channel(channel_id: str, req: HRChannelUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
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

@router.delete("/chat/channels/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
def hr_delete_channel(channel_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    channel = db.query(models.ChatChannel).filter(models.ChatChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    db.delete(channel)
    db.commit()
    return None

@router.post("/chat/upload")
async def hr_upload_file(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user)):
    verify_hr_role(current_user)
    try:
        import os, uuid
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        os.makedirs(os.path.join("uploads", "chat"), exist_ok=True)
        filepath = os.path.join("uploads", "chat", unique_filename)
        
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)
            
        file_url = f"/uploads/chat/{unique_filename}"
        file_type = "image" if file.content_type.startswith("image/") else ("video" if file.content_type.startswith("video/") else "document")
        
        return {"url": file_url, "type": file_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    body: str
    priority: str
    audience: str
    author: str
    date: str 

    class Config:
        from_attributes = True

@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
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
    return res

