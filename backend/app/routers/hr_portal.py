from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
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

class EmployeeCreateRequest(BaseModel):
    name: str
    email: EmailStr
    department: str
    designation: str
    join_date: date
    status: Optional[str] = "probation"
    photo: Optional[str] = None

class EmployeeResponse(BaseModel):
    id: int
    emp_id: Optional[str]
    name: str
    email: str
    phone: Optional[str]
    department: Optional[str]
    designation: Optional[str]
    status: str
    join_date: Optional[date]
    probation_end_date: Optional[date]
    bank_name: Optional[str]
    account_number: Optional[str]
    ifsc_code: Optional[str]
    grade: int
    manager: Optional[str]
    photo: Optional[str]
    documents: Optional[str]

    class Config:
        from_attributes = True

class EmployeeCreateResponse(BaseModel):
    employee: EmployeeResponse
    temporary_password: str

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
    Paternity: float
    year: int

    class Config:
        from_attributes = True

class LeaveBalanceAdjustment(BaseModel):
    CL: float
    SL: float
    EL: float
    Maternity: float
    Paternity: float

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

# ─── Endpoints ───────────────────────────────────────────────────────────────

# 1. Telemetry Dashboard
@router.get("/dashboard/metrics")
def get_dashboard_metrics(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    
    total_employees = db.query(models.User).filter(models.User.role == "employee").count()
    active_employees = db.query(models.User).filter(models.User.role == "employee", models.User.status == "active").count()
    probation_employees = db.query(models.User).filter(models.User.role == "employee", models.User.status == "probation").count()
    active_candidates = db.query(models.Candidate).filter(models.Candidate.stage.notin_(["joined", "rejected"])).count()
    ongoing_pips = db.query(models.PIP).filter(models.PIP.status == "ongoing").count()
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").count()
    pending_expenses = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.status == "pending").count()

    return {
        "totalEmployees": total_employees,
        "activeEmployees": active_employees,
        "probationEmployees": probation_employees,
        "activeCandidates": active_candidates,
        "ongoingPips": ongoing_pips,
        "pendingLeaves": pending_leaves,
        "pendingExpenses": pending_expenses
    }

# 2. Recruitment Module (ATS Board)
@router.get("/candidates", response_model=List[CandidateResponse])
def get_candidates(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.Candidate).order_by(models.Candidate.created_at.desc()).all()

@router.post("/candidates", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(req: CandidateCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
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
    total_emp = db.query(models.User).filter(models.User.role == "employee").count()
    emp_serial = total_emp + 101
    emp_id = f"NSG-0{emp_serial}"
    
    # Auto setup dates
    today = date.today()
    probation_end = date.fromordinal(today.toordinal() + 180) # 6 months
    
    # Initial documents list
    initial_docs = [
        {"type": "Aadhaar Card", "name": "aadhaar_verify.pdf", "status": "verified", "date": today.isoformat()},
        {"type": "Degree Certificate", "name": "bachelors_degree.pdf", "status": "pending", "date": today.isoformat()}
    ]
    
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
        bank_name="HDFC Bank",
        account_number=f"50100{security.hash_password(cand.name)[:9]}", # Simulate account creation
        ifsc_code="HDFC0000012",
        grade=3,
        manager="John Doe",
        photo="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80",
        documents=json.dumps(initial_docs)
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
    return {"employee": db_emp, "temporary_password": default_pwd_plain}

@router.delete("/candidates/{id}")
def delete_candidate(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    cand = db.query(models.Candidate).filter(models.Candidate.id == id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    db.delete(cand)
    db.commit()
    return {"status": "success", "message": "Candidate profile deleted."}

# 3. Employee Registry Module
@router.get("/employees", response_model=List[EmployeeResponse])
def get_employees(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.User).filter(models.User.role == "employee").all()

@router.post("/employees", response_model=EmployeeCreateResponse, status_code=status.HTTP_201_CREATED)
def add_employee(req: EmployeeCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    exists = db.query(models.User).filter(models.User.email == req.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Employee already exists.")
        
    total_emp = db.query(models.User).filter(models.User.role == "employee").count()
    emp_id = f"NSG-0{total_emp + 101}"
    probation_end = date.fromordinal(req.join_date.toordinal() + 180)
    
    initial_docs = [
        {"type": "Aadhaar Card", "name": "aadhaar_verify.pdf", "status": "verified", "date": req.join_date.isoformat()},
        {"type": "Degree Certificate", "name": "bachelors_degree.pdf", "status": "pending", "date": req.join_date.isoformat()}
    ]
    
    default_pwd_plain = f"{req.name.replace(' ', '')}@123"
    default_pwd = security.hash_password(default_pwd_plain)
    
    db_emp = models.User(
        name=req.name,
        email=req.email,
        hashed_password=default_pwd,
        role="employee",
        department=req.department,
        designation=req.designation,
        status=req.status,
        emp_id=emp_id,
        join_date=req.join_date,
        probation_end_date=probation_end,
        bank_name="HDFC Bank",
        account_number=f"50100{security.hash_password(req.name)[:9]}",
        ifsc_code="HDFC0000012",
        grade=3,
        manager="John Doe",
        photo=req.photo or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80",
        documents=json.dumps(initial_docs)
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
    return {"employee": db_emp, "temporary_password": default_pwd_plain}

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
    emp = db.query(models.User).filter(models.User.id == id, models.User.role == "employee").first()
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
    emp = db.query(models.User).filter(models.User.id == id, models.User.role == "employee").first()
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
def get_onboarding_tasks(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.OnboardingTask).all()

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
def get_esign_requests(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.EsignRequest).all()

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
def get_leave_balances(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.LeaveBalance).all()

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
    bal.Paternity = req.Paternity
    db.commit()
    db.refresh(bal)
    return bal

@router.get("/leaves/requests", response_model=List[LeaveRequestResponse])
def get_leave_requests(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.LeaveRequest).order_by(models.LeaveRequest.from_date.desc()).all()

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

@router.post("/leaves/requests/{id}/reject", response_model=LeaveRequestResponse)
def reject_leave_hr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    req.status = "denied"
    
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

@router.get("/timesheets/exceptions", response_model=List[TimesheetExceptionResponse])
def get_timesheet_exceptions(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.TimesheetException).all()

@router.post("/timesheets/exceptions/{id}/resolve", response_model=TimesheetExceptionResponse)
def resolve_timesheet_exception(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    exc = db.query(models.TimesheetException).filter(models.TimesheetException.id == id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Timesheet exception record not found.")
        
    exc.status = "resolved"
    db.commit()
    db.refresh(exc)
    return exc

# 6. Payroll Builder, Claims, and TDS
@router.get("/payroll/runs", response_model=List[PayrollRunResponse])
def get_payroll_runs(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.PayrollRun).all()

@router.post("/payroll/runs", response_model=PayrollRunResponse, status_code=status.HTTP_201_CREATED)
def create_payroll_run(req: PayrollRunCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
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
def get_expense_claims(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.ExpenseClaim).all()

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
def get_tds_declarations(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.TDSDeclaration).all()

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
def get_payroll_loans(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.Loan).all()

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
def get_disciplinary_tickets(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.DisciplinaryTicket).all()

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
def get_pips(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.PIP).all()

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
def get_resignations(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.Resignation).all()

@router.post("/exits/resignations/{id}/approve", response_model=ResignationResponse)
def approve_resignation_hr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    res = db.query(models.Resignation).filter(models.Resignation.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resignation request not found.")
        
    res.status = "approved"
    db.commit()
    db.refresh(res)
    return res

@router.post("/exits/resignations/{id}/reject", response_model=ResignationResponse)
def reject_resignation_hr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    res = db.query(models.Resignation).filter(models.Resignation.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resignation request not found.")
        
    res.status = "rejected"
    db.commit()
    db.refresh(res)
    return res

# 9. L&D (Learning Track)
@router.get("/lnd/tracks", response_model=List[TrainingTrackResponse])
def get_lnd_tracks(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.TrainingTrack).all()

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
def get_lnd_progress(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.TrainingProgress).all()

# 10. Audit Logs
@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_hr_role(current_user)
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()
