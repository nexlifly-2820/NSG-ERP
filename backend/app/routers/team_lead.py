from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
import json
from typing import List, Optional
from datetime import date, datetime

from app import models, database
from app.core import security

router = APIRouter(
    prefix="/team-lead",
    tags=["team-lead"]
)

# Helper to verify manager/tl roles
def verify_manager_role(user: models.User):
    if user.role not in ["tl", "hr", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden. Higher privileges required."
        )

# ─── Pydantic Validation Schemas ──────────────────────────────────────────────

class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True

class TaskCreateRequest(BaseModel):
    project: str
    sprint: str
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    sp: int = 1
    due: Optional[date] = None
    assignee_id: int
    custom_data: Optional[str] = None
    subtasks: List[str] = []
    acceptance: Optional[List[str]] = []

class SubtaskResponse(BaseModel):
    id: int
    title: str
    done: bool

    class Config:
        from_attributes = True

class TaskResponse(BaseModel):
    id: int
    user_id: int
    project: str
    sprint: str
    title: str
    description: Optional[str]
    priority: str
    status: str
    sp: int
    due: Optional[date]
    pr_status: Optional[str] = None
    pr_url: Optional[str] = None
    rejected_reason: Optional[str] = None
    custom_data: Optional[str] = None
    subtasks: List[SubtaskResponse]
    acceptance: Optional[List[str]] = []

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

class PRRejectRequest(BaseModel):
    reason: str

class LeaveRequestResponse(BaseModel):
    id: int
    user_id: int
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

class EscalationCreateRequest(BaseModel):
    title: str
    task_link: str
    severity: str = "Medium"
    dependencies: Optional[str] = None
    description: Optional[str] = None

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


class ScorecardCreateRequest(BaseModel):
    employee_name: str
    rating: str
    comments: str


class ScorecardResponse(BaseModel):
    id: int
    employee_name: str
    tl_name: str
    rating: str
    comments: str

    class Config:
        from_attributes = True


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/team-members", response_model=List[UserProfileResponse])
def get_team_members(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    query = db.query(models.User).filter(models.User.role == "employee")
    if current_user.department:
        query = query.filter(models.User.department == current_user.department)
    return query.all()

# 2. Task Management
@router.get("/tasks", response_model=List[TaskResponse])
def get_team_tasks(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    if current_user.role == "tl" and current_user.department:
        emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.department == current_user.department).all()]
        tasks = db.query(models.Task).filter(models.Task.user_id.in_(emp_ids)).all()
    else:
        tasks = db.query(models.Task).all()
    return tasks

@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_team_task(req: TaskCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    assignee = db.query(models.User).filter(models.User.id == req.assignee_id).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Assignee user not found.")
        
    db_task = models.Task(
        user_id=req.assignee_id,
        project=req.project,
        sprint=req.sprint,
        title=req.title,
        description=req.description,
        priority=req.priority.lower(),
        status="pending",
        sp=req.sp,
        due=req.due,
        custom_data=req.custom_data,
        acceptance=json.dumps(req.acceptance) if req.acceptance else None
    )
    db.add(db_task)
    db.flush()
    
    for st_title in req.subtasks:
        if st_title.strip():
            db_sub = models.TaskSubtask(
                task_id=db_task.id,
                title=st_title,
                done=False
            )
            db.add(db_sub)
            
    db.commit()
    db.refresh(db_task)
    return db_task

@router.post("/tasks/{id}/approve-pr", response_model=TaskResponse)
def approve_task_pr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    task = db.query(models.Task).filter(models.Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    task.pr_status = "approved"
    task.status = "done"
    task.rejected_reason = None
    
    notification = models.Notification(
        user_id=task.user_id,
        message=f"Your PR for task '{task.title}' has been approved.",
        type="success",
        read=False
    )
    db.add(notification)
    
    db.commit()
    db.refresh(task)
    return task

@router.post("/tasks/{id}/reject-pr", response_model=TaskResponse)
def reject_task_pr(id: int, req: PRRejectRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    task = db.query(models.Task).filter(models.Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    task.pr_status = "rejected"
    task.status = "blocked"
    task.rejected_reason = req.reason
    
    notification = models.Notification(
        user_id=task.user_id,
        message=f"Your PR for task '{task.title}' was rejected. Reason: {req.reason}",
        type="danger",
        read=False
    )
    db.add(notification)
    
    db.commit()
    db.refresh(task)
    return task

@router.patch("/tasks/{id}", response_model=TaskResponse)
def update_task(id: int, req: TaskCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    task = db.query(models.Task).filter(models.Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    
    task.title = req.title
    task.project = req.project
    task.sprint = req.sprint
    task.description = req.description
    task.priority = req.priority.lower()
    task.sp = req.sp
    task.due = req.due
    task.custom_data = req.custom_data
    
    db.commit()
    db.refresh(task)
    return task

class ReassignRequest(BaseModel):
    new_assignee_id: int

@router.post("/tasks/{id}/reassign", response_model=TaskResponse)
def reassign_task(id: int, req: ReassignRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    task = db.query(models.Task).filter(models.Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    assignee = db.query(models.User).filter(models.User.id == req.new_assignee_id).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="New assignee not found.")
        
    task.user_id = req.new_assignee_id
    
    notification = models.Notification(
        user_id=task.user_id,
        message=f"You have been assigned a new task: '{task.title}'.",
        type="info",
        read=False
    )
    db.add(notification)
    
    db.commit()
    db.refresh(task)
    return task

# 3. Approvals (Leaves)
@router.get("/leaves/pending", response_model=List[LeaveRequestResponse])
def get_pending_leaves(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    if current_user.role == "tl" and current_user.department:
        emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.department == current_user.department).all()]
        leaves = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.status == "pending",
            models.LeaveRequest.user_id.in_(emp_ids)
        ).all()
    else:
        leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").all()
    return leaves

@router.post("/leaves/{id}/approve", response_model=LeaveRequestResponse)
def approve_leave(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
    
    if req.status != "pending":
         raise HTTPException(status_code=400, detail=f"Request is already {req.status}")
         
    req.status = "tl_approved"
    req.tl_approved_at = datetime.now()
    
    notification = models.Notification(
        user_id=req.user_id,
        message=f"Your leave request from {req.from_date} to {req.to_date} has been approved by your Team Lead.",
        type="success",
        read=False
    )
    db.add(notification)
    
    db.commit()
    db.refresh(req)
    return req

@router.post("/leaves/{id}/reject", response_model=LeaveRequestResponse)
def reject_leave(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
    
    if req.status != "pending":
         raise HTTPException(status_code=400, detail=f"Request is already {req.status}")
         
    req.status = "rejected"
    
    notification = models.Notification(
        user_id=req.user_id,
        message=f"Your leave request from {req.from_date} to {req.to_date} was rejected by your Team Lead.",
        type="danger",
        read=False
    )
    db.add(notification)
    
    db.commit()
    db.refresh(req)
    return req

# 4. Approvals (Expenses)
@router.get("/expenses/pending", response_model=List[ExpenseClaimResponse])
def get_pending_expenses(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    if current_user.role == "tl" and current_user.department:
        emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.department == current_user.department).all()]
        expenses = db.query(models.ExpenseClaim).filter(
            models.ExpenseClaim.tl_approval == "pending",
            models.ExpenseClaim.user_id.in_(emp_ids)
        ).all()
    else:
        expenses = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.tl_approval == "pending").all()
    return expenses

@router.post("/expenses/{id}/approve", response_model=ExpenseClaimResponse)
def approve_expense(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    claim = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found.")
        
    if claim.tl_approval != "pending":
         raise HTTPException(status_code=400, detail=f"Expense is already {claim.tl_approval}")
         
    claim.tl_approval = "approved"
    
    notification = models.Notification(
        user_id=claim.user_id,
        message=f"Your expense claim of ₹{claim.amount} for '{claim.category}' has been approved by your Team Lead.",
        type="success",
        read=False
    )
    db.add(notification)
    
    db.commit()
    db.refresh(claim)
    return claim

@router.post("/expenses/{id}/reject", response_model=ExpenseClaimResponse)
def reject_expense(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    claim = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found.")
        
    if claim.tl_approval != "pending":
         raise HTTPException(status_code=400, detail=f"Expense is already {claim.tl_approval}")
         
    claim.tl_approval = "rejected"
    claim.status = "rejected"
    
    notification = models.Notification(
        user_id=claim.user_id,
        message=f"Your expense claim of ₹{claim.amount} for '{claim.category}' was rejected by your Team Lead.",
        type="danger",
        read=False
    )
    db.add(notification)
    
    db.commit()
    db.refresh(claim)
    return claim

# 5. Escalations / Blockers
@router.get("/escalations", response_model=List[EscalationResponse])
def get_escalations(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    if current_user.role == "tl":
        return db.query(models.Escalation).filter(models.Escalation.user_id == current_user.id).order_by(models.Escalation.submitted_at.desc()).all()
    return db.query(models.Escalation).order_by(models.Escalation.submitted_at.desc()).all()

@router.post("/escalations", response_model=EscalationResponse, status_code=status.HTTP_201_CREATED)
def raise_escalation(req: EscalationCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    
    db_esc = models.Escalation(
        user_id=current_user.id,
        title=req.title,
        task_link=req.task_link,
        severity=req.severity,
        ceo_viewed=False,
        resolved=False,
        dependencies=req.dependencies,
        description=req.description
    )
    db.add(db_esc)
    
    if req.severity in ["Critical", "High"]:
        ceos = db.query(models.User).filter(models.User.role == "ceo").all()
        for ceo in ceos:
            notification = models.Notification(
                user_id=ceo.id,
                message=f"NEW {req.severity.upper()} BLOCKER raised by {current_user.name}: {req.title}",
                type="danger" if req.severity == "Critical" else "warning",
                read=False
            )
            db.add(notification)
            
    db.commit()
    db.refresh(db_esc)
    return db_esc

@router.post("/escalations/{id}/resolve", response_model=EscalationResponse)
def resolve_escalation(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    esc = db.query(models.Escalation).filter(models.Escalation.id == id).first()
    if not esc:
         raise HTTPException(status_code=404, detail="Escalation blocker not found.")
         
    esc.resolved = True
    
    db.commit()
    db.refresh(esc)
    return esc


# 6. Performance Scorecards
@router.get("/scorecards", response_model=List[ScorecardResponse])
def get_submitted_scorecards(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    return db.query(models.AppraisalScorecard).filter(models.AppraisalScorecard.tl_name == current_user.name).all()


@router.post("/scorecards", response_model=ScorecardResponse, status_code=status.HTTP_201_CREATED)
def submit_scorecard(req: ScorecardCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    scorecard = models.AppraisalScorecard(
        employee_name=req.employee_name,
        tl_name=current_user.name,
        rating=req.rating,
        comments=req.comments
    )
    db.add(scorecard)
    db.commit()
    db.refresh(scorecard)
    return scorecard


# ─── 7. Projects ─────────────────────────────────────────────────────────────

class ProjectResponse(BaseModel):
    id: int
    name: str
    client: str
    budget: float
    used: float
    status: str
    deadline: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectCreateRequest(BaseModel):
    name: str
    client: str
    budget: float
    used: float = 0.0
    status: str = "Active"
    deadline: Optional[str] = None


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    client: Optional[str] = None
    budget: Optional[float] = None
    used: Optional[float] = None
    status: Optional[str] = None
    deadline: Optional[str] = None


@router.get("/projects", response_model=List[ProjectResponse])
def get_projects(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    return db.query(models.Project).order_by(models.Project.id.desc()).all()


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(req: ProjectCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    project = models.Project(
        name=req.name,
        client=req.client,
        budget=req.budget,
        used=req.used,
        status=req.status,
        deadline=req.deadline
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.patch("/projects/{id}", response_model=ProjectResponse)
def update_project(id: int, req: ProjectUpdateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
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


@router.post("/projects/{id}/signoff", response_model=ProjectResponse)
def signoff_project(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    project.status = "Completed"
    db.commit()
    db.refresh(project)
    return project

