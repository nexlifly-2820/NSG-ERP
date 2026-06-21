from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
import json
import os
import uuid
import shutil
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
    join_date: Optional[date] = None
    phone: Optional[str] = None
    photo: Optional[str] = None
    status: Optional[str] = None
    manager: Optional[str] = None
    shift_timing: Optional[str] = None
    presence_status: Optional[str] = "offline"

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
    attachments: Optional[List[TaskAttachmentRequest]] = []

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
    created_at: Optional[datetime] = None

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
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AttendanceCorrectionResponse(BaseModel):
    id: int
    user_id: int
    correction_date: date
    requested_clock_in: datetime
    requested_clock_out: datetime
    reason: str
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
    rejected: bool = False
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
    emp_acknowledged: bool
    hr_acknowledged: bool

    class Config:
        from_attributes = True

class EmployeeSkillResponse(BaseModel):
    id: int
    user_id: int
    skill_name: str
    proficiency_level: int

    class Config:
        from_attributes = True

class MilestoneResponse(BaseModel):
    id: int
    project_id: int
    name: str
    due_date: str
    status: str
    progress: int
    tasks_count: int

    class Config:
        from_attributes = True

class TaskBatchUpdateRequest(BaseModel):
    task_ids: List[int]
    sprint: str
    status: str

class TaskStatusUpdateRequest(BaseModel):
    status: str
    custom_data: Optional[str] = None


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/team-members", response_model=List[UserProfileResponse])
def get_team_members(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    users = db.query(models.User).filter(models.User.manager_id == current_user.id).all()
    today = date.today()
    for u in users:
        u.manager = current_user.name
        u.presence_status = "offline"
        
        # Check leave requests
        leave = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.user_id == u.id,
            models.LeaveRequest.status == "approved",
            models.LeaveRequest.from_date <= today,
            models.LeaveRequest.to_date >= today
        ).first()
        
        if leave:
            if leave.leave_type == "WFH":
                u.presence_status = "wfh"
            else:
                u.presence_status = "on_leave"
        else:
            # Check attendance
            att = db.query(models.Attendance).filter(
                models.Attendance.user_id == u.id, 
                models.Attendance.date == today
            ).first()
            if att:
                if att.work_mode == "wfh":
                    u.presence_status = "wfh"
                elif att.status == "leave":
                    u.presence_status = "on_leave"
                elif att.status == "absent":
                    u.presence_status = "absent"
                elif att.clock_out is not None:
                    u.presence_status = "offline"
                else:
                    u.presence_status = "online"
                    
    return users

@router.get("/team-availability", response_model=List[LeaveRequestResponse])
def get_team_availability(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.manager_id == current_user.id).all()]
    if not emp_ids:
        return []
    leaves = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.user_id.in_(emp_ids),
        models.LeaveRequest.status == "approved"
    ).all()
    return leaves

@router.get("/team-skills", response_model=List[EmployeeSkillResponse])
def get_team_skills(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.manager_id == current_user.id).all()]
    if not emp_ids:
        return []
    skills = db.query(models.EmployeeSkill).filter(
        models.EmployeeSkill.user_id.in_(emp_ids)
    ).all()
    return skills

# 2. Task Management
@router.get("/tasks", response_model=List[TaskResponse])
def get_team_tasks(skip: int = 0, limit: int = 100, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    if current_user.role == "tl":
        emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.manager_id == current_user.id).all()]
        tasks = db.query(models.Task).filter(models.Task.user_id.in_(emp_ids)).offset(skip).limit(limit).all()
    else:
        tasks = db.query(models.Task).offset(skip).limit(limit).all()
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
        status="assignee",
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
            
    if req.attachments:
        for att in req.attachments:
            db_att = models.TaskAttachment(
                task_id=db_task.id,
                filename=att.filename,
                file_url=att.file_url
            )
            db.add(db_att)
            
    db.commit()
    db.refresh(db_task)
    return db_task

@router.patch("/tasks/batch-update", response_model=dict)
def update_tasks_batch(req: TaskBatchUpdateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    db.query(models.Task).filter(models.Task.id.in_(req.task_ids)).update({
        "sprint": req.sprint,
        "status": req.status
    }, synchronize_session=False)
    db.commit()
    return {"status": "success", "updated_count": len(req.task_ids)}

@router.patch("/tasks/{task_id}/status", response_model=TaskResponse)
def update_task_status(task_id: int, req: TaskStatusUpdateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    task.status = req.status
    if req.custom_data is not None:
        task.custom_data = req.custom_data
    db.commit()
    if task.milestone_id:
        update_milestone_progress(db, task.milestone_id)
    db.refresh(task)
    return task

@router.get("/projects/{project_id}/backlog", response_model=List[TaskResponse])
def get_project_backlog(project_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return []
    tasks = db.query(models.Task).filter(
        models.Task.project == project.name,
        (models.Task.sprint == None) | (models.Task.sprint == "") | (models.Task.sprint == "Backlog")
    ).all()
    return tasks

def update_milestone_progress(db: Session, milestone_id: int) -> models.Milestone:
    milestone = db.query(models.Milestone).filter(models.Milestone.id == milestone_id).first()
    if not milestone:
        return None
    linked_tasks = db.query(models.Task).filter(models.Task.milestone_id == milestone.id).all()
    milestone.tasks_count = len(linked_tasks)
    if milestone.tasks_count > 0:
        total_progress = 0
        for t in linked_tasks:
            s = (t.status or '').lower()
            if s in ['done', 'completed']:
                total_progress += 100
            elif s == 'pr':
                total_progress += 90
            elif s == 'testing':
                total_progress += 70
            elif s in ['in-progress', 'inprogress']:
                total_progress += 50
        milestone.progress = int(total_progress / milestone.tasks_count)
        if milestone.progress == 100:
            milestone.status = "completed"
        elif milestone.progress > 0:
            milestone.status = "in-progress"
        else:
            milestone.status = "pending"
    else:
        milestone.progress = 0
        milestone.status = "pending"
    db.commit()
    db.refresh(milestone)
    return milestone

@router.get("/projects/{project_id}/milestones", response_model=List[MilestoneResponse])
def get_project_milestones(project_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    milestones = db.query(models.Milestone).filter(models.Milestone.project_id == project_id).all()
    for m in milestones:
        update_milestone_progress(db, m.id)
    return db.query(models.Milestone).filter(models.Milestone.project_id == project_id).all()


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
    if task.milestone_id:
        update_milestone_progress(db, task.milestone_id)
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
    if task.milestone_id:
        update_milestone_progress(db, task.milestone_id)
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
    task.acceptance = json.dumps(req.acceptance) if req.acceptance else None
    
    # Update Subtasks
    db.query(models.TaskSubtask).filter(models.TaskSubtask.task_id == id).delete()
    for st_title in req.subtasks:
        if st_title.strip():
            db_sub = models.TaskSubtask(
                task_id=task.id,
                title=st_title,
                done=False
            )
            db.add(db_sub)
            
    # Update Attachments
    db.query(models.TaskAttachment).filter(models.TaskAttachment.task_id == id).delete()
    if req.attachments:
        for att in req.attachments:
            db_att = models.TaskAttachment(
                task_id=task.id,
                filename=att.filename,
                file_url=att.file_url
            )
            db.add(db_att)
            
    db.commit()
    if task.milestone_id:
        update_milestone_progress(db, task.milestone_id)
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

@router.get("/tasks/schema")
def get_task_schema(department: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    verify_manager_role(current_user)
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

# 3. Approvals (Leaves)
@router.get("/leaves/pending", response_model=List[LeaveRequestResponse])
def get_pending_leaves(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    if current_user.role == "tl":
        emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.manager_id == current_user.id).all()]
        if not emp_ids:
            return []
        leaves = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.status == "pending",
            models.LeaveRequest.leave_type != "WFH",
            models.LeaveRequest.user_id.in_(emp_ids)
        ).all()
    else:
        leaves = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.status == "pending",
            models.LeaveRequest.leave_type != "WFH"
        ).all()
    return leaves

@router.post("/leaves/{id}/approve", response_model=LeaveRequestResponse)
def approve_leave(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    security.check_rbac_permission(db, current_user, "Approve Leaves")
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
    
    if req.status != "pending":
         raise HTTPException(status_code=400, detail=f"Request is already {req.status}")
         
    req.status = "approved"
    req.tl_approved_at = datetime.now()
    
    # Deduct leave balance upon approval
    bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.user_id == req.user_id).first()
    if bal:
        if req.leave_type == "CL": bal.CL -= req.days
        elif req.leave_type == "SL": bal.SL -= req.days
        elif req.leave_type == "EL": bal.EL -= req.days
        elif req.leave_type == "Maternity": bal.Maternity -= req.days
    
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

# 3.1 Approvals (WFH)
@router.get("/wfh/pending", response_model=List[LeaveRequestResponse])
def get_pending_wfh(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    if current_user.role == "tl":
        emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.manager_id == current_user.id).all()]
        if not emp_ids:
            return []
        wfh = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.status == "pending",
            models.LeaveRequest.leave_type == "WFH",
            models.LeaveRequest.user_id.in_(emp_ids)
        ).all()
    else:
        wfh = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.status == "pending",
            models.LeaveRequest.leave_type == "WFH"
        ).all()
    return wfh

@router.post("/wfh/{id}/approve", response_model=LeaveRequestResponse)
def approve_wfh(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return approve_leave(id, current_user, db)

@router.post("/wfh/{id}/reject", response_model=LeaveRequestResponse)
def reject_wfh(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return reject_leave(id, current_user, db)

# 3.2 Alerts Dismissal
@router.post("/attendance/{id}/dismiss-late")
def dismiss_late_alert(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    att = db.query(models.Attendance).filter(models.Attendance.id == id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found.")
    att.late_alert_dismissed = True
    db.commit()
    return {"status": "success", "message": "Late alert dismissed"}

@router.post("/attendance/{id}/dismiss-missed-punch")
def dismiss_missed_punch_alert(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    att = db.query(models.Attendance).filter(models.Attendance.id == id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found.")
    att.missed_punch_alert_dismissed = True
    db.commit()
    return {"status": "success", "message": "Missed punch alert dismissed"}

# 3.3 Approvals (Attendance Corrections)
@router.get("/attendance-corrections/pending", response_model=List[AttendanceCorrectionResponse])
def get_pending_corrections(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    if current_user.role == "tl":
        emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.manager_id == current_user.id).all()]
        if not emp_ids:
            return []
        corrections = db.query(models.AttendanceCorrection).filter(
            models.AttendanceCorrection.status == "pending",
            models.AttendanceCorrection.user_id.in_(emp_ids)
        ).all()
    else:
        corrections = db.query(models.AttendanceCorrection).filter(models.AttendanceCorrection.status == "pending").all()
    return corrections

@router.post("/attendance-corrections/{id}/approve", response_model=AttendanceCorrectionResponse)
def approve_correction(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    corr = db.query(models.AttendanceCorrection).filter(models.AttendanceCorrection.id == id).first()
    if not corr:
        raise HTTPException(status_code=404, detail="Correction not found.")
    
    if corr.status != "pending":
         raise HTTPException(status_code=400, detail=f"Request is already {corr.status}")
         
    corr.status = "approved"
    
    notification = models.Notification(
        user_id=corr.user_id,
        message=f"Your attendance correction for {corr.correction_date} has been approved.",
        type="success",
        read=False
    )
    db.add(notification)
    
    attendance = db.query(models.Attendance).filter(
        models.Attendance.user_id == corr.user_id, 
        models.Attendance.date == corr.correction_date
    ).first()
    if attendance:
        attendance.clock_in = corr.requested_clock_in
        attendance.clock_out = corr.requested_clock_out
    else:
        attendance = models.Attendance(
            user_id=corr.user_id,
            date=corr.correction_date,
            clock_in=corr.requested_clock_in,
            clock_out=corr.requested_clock_out,
            status="present"
        )
        db.add(attendance)
        
    db.commit()
    db.refresh(corr)
    return corr

@router.post("/attendance-corrections/{id}/reject", response_model=AttendanceCorrectionResponse)
def reject_correction(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    corr = db.query(models.AttendanceCorrection).filter(models.AttendanceCorrection.id == id).first()
    if not corr:
        raise HTTPException(status_code=404, detail="Correction not found.")
    
    if corr.status != "pending":
         raise HTTPException(status_code=400, detail=f"Request is already {corr.status}")
         
    corr.status = "denied"
    
    notification = models.Notification(
        user_id=corr.user_id,
        message=f"Your attendance correction for {corr.correction_date} was rejected.",
        type="danger",
        read=False
    )
    db.add(notification)
    
    db.commit()
    db.refresh(corr)
    return corr
# 4. Approvals (Expenses)
@router.get("/expenses/pending", response_model=List[ExpenseClaimResponse])
def get_pending_expenses(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    if current_user.role == "tl":
        emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.manager_id == current_user.id).all()]
        if not emp_ids:
            return []
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
    try:
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
    except Exception as e:
        db.rollback()
        print(f"Error submitting scorecard: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit scorecard: {str(e)}")


# ─── 7. Projects ─────────────────────────────────────────────────────────────

class ProjectResponse(BaseModel):
    id: int
    name: str
    client: str
    budget: float
    used: float
    status: str
    deadline: Optional[str] = None
    checklist: Optional[str] = None
    department: Optional[str] = None
    attachments: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectCreateRequest(BaseModel):
    name: str
    client: str
    budget: float
    used: float = 0.0
    status: str = "Active"
    deadline: Optional[str] = None
    checklist: Optional[str] = None
    department: Optional[str] = None


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    client: Optional[str] = None
    budget: Optional[float] = None
    used: Optional[float] = None
    status: Optional[str] = None
    deadline: Optional[str] = None
    checklist: Optional[str] = None
    department: Optional[str] = None


@router.get("/projects", response_model=List[ProjectResponse])
def get_projects(skip: int = 0, limit: int = 100, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    query = db.query(models.Project)
    if current_user.role == "tl" and current_user.department:
        query = query.filter(models.Project.department == current_user.department)
    return query.order_by(models.Project.id.desc()).offset(skip).limit(limit).all()


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(req: ProjectCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    project = models.Project(
        name=req.name,
        client=req.client,
        budget=req.budget,
        used=req.used,
        status=req.status,
        deadline=req.deadline,
        checklist=req.checklist,
        department=req.department
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
    if req.checklist is not None:
        project.checklist = req.checklist
    if req.department is not None:
        project.department = req.department
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


@router.get('/reports', response_model=dict)
def get_team_reports(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    velocityData = []
    team_members = db.query(models.User).filter(models.User.manager_id == current_user.id).all()
    productivityData = []
    total_completed = 0
    total_in_progress = 0
    total_blocked = 0
    total_overdue = 0
    for member in team_members:
        member_tasks = db.query(models.Task).filter(models.Task.assigned_to == member.id).all()
        assigned = len(member_tasks)
        completed = sum(1 for t in member_tasks if t.status == 'Done')
        total_completed += completed
        total_in_progress += sum(1 for t in member_tasks if t.status == 'In Progress')
        total_blocked += sum(1 for t in member_tasks if t.status == 'Blocked')
        total_overdue += sum(1 for t in member_tasks if t.status == 'To Do')
        comp_rate = f'{int((completed / assigned * 100))}%' if assigned > 0 else '0%'
        productivityData.append({
            'name': member.name,
            'avatar': ''.join(word[0] for word in member.name.split()[:2]).upper() if member.name else '?',
            'assigned': assigned,
            'completed': completed,
            'compRate': comp_rate
        })
    total_tasks = total_completed + total_in_progress + total_blocked + total_overdue
    if total_tasks == 0:
        donutData = {'completed': 0, 'inProgress': 0, 'blocked': 0, 'overdue': 0}
    else:
        donutData = {
            'completed': int(total_completed / total_tasks * 100),
            'inProgress': int(total_in_progress / total_tasks * 100),
            'blocked': int(total_blocked / total_tasks * 100),
            'overdue': int(total_overdue / total_tasks * 100)
        }
    member_ids = [m.id for m in team_members]
    if member_ids:
        approved_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.employee_id.in_(member_ids), models.LeaveRequest.status == 'approved').all()
    else:
        approved_leaves = []
    leaveCalendar = []
    leavesDetailData = []
    for leave in approved_leaves:
        emp = next((m for m in team_members if m.id == leave.employee_id), None)
        emp_name = f'{emp.first_name} {emp.last_name}' if emp else f'Employee {leave.employee_id}'
        leaveCalendar.append({'day': leave.start_date.day, 'name': emp_name})
        leavesDetailData.append({
            'name': emp_name,
            'date': f'{leave.start_date} to {leave.end_date}',
            'type': leave.leave_type,
            'duration': f'{(leave.end_date - leave.start_date).days + 1} Days',
            'status': 'Approved'
        })
    return {
        'velocityData': velocityData,
        'productivityData': productivityData,
        'donutData': donutData,
        'leaveCalendar': leaveCalendar,
        'leavesDetailData': leavesDetailData
    }

@router.get("/attendance")
def get_team_attendance(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    verify_manager_role(current_user)
    
    # Get all employees assigned to this TL via manager_id
    team_members = db.query(models.User).filter(models.User.manager_id == current_user.id).all()
    member_ids = [m.id for m in team_members]
    
    if not member_ids:
        return []
        
    logs = db.query(models.Attendance).filter(models.Attendance.user_id.in_(member_ids)).all()
    
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "employee_id": log.user_id,
            "date": log.date.strftime("%Y-%m-%d") if log.date else None,
            "clock_in": log.clock_in.isoformat() if log.clock_in else None,
            "clock_out": log.clock_out.isoformat() if log.clock_out else None,
            "status": log.status,
            "work_mode": log.work_mode if hasattr(log, 'work_mode') else "office",
            "exception_flag": log.exception_flag if hasattr(log, 'exception_flag') else None,
            "is_late": log.is_late if hasattr(log, 'is_late') else False,
            "late_alert_dismissed": log.late_alert_dismissed if hasattr(log, 'late_alert_dismissed') else False,
            "missed_punch_alert_dismissed": log.missed_punch_alert_dismissed if hasattr(log, 'missed_punch_alert_dismissed') else False
        })
    return result


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
def get_announcements(db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    anns = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()
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

@router.get("/dashboard/pending-approvals")
def get_pending_approvals_count(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    
    emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.manager_id == current_user.id).all()]
    if not emp_ids and current_user.role == "tl":
        return {"leaveRequests": 0, "timesheetCorrections": 0, "wfhRequests": 0}
        
    leaves_query = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending", models.LeaveRequest.leave_type != "WFH")
    wfh_query = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending", models.LeaveRequest.leave_type == "WFH")
    corrections_query = db.query(models.AttendanceCorrection).filter(models.AttendanceCorrection.status == "pending")
    
    if current_user.role == "tl":
        leaves_query = leaves_query.filter(models.LeaveRequest.user_id.in_(emp_ids))
        wfh_query = wfh_query.filter(models.LeaveRequest.user_id.in_(emp_ids))
        corrections_query = corrections_query.filter(models.AttendanceCorrection.user_id.in_(emp_ids))
        
    return {
        "leaveRequests": leaves_query.count(),
        "timesheetCorrections": corrections_query.count(),
        "wfhRequests": wfh_query.count()
    }

@router.get("/dashboard/absent-alerts")
def get_absent_alerts(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    today = date.today()
    emp_ids = [u.id for u in db.query(models.User.id).filter(models.User.manager_id == current_user.id).all()]
    if not emp_ids and current_user.role == "tl":
        return []
        
    att_query = db.query(models.Attendance).filter(models.Attendance.date == today)
    if current_user.role == "tl":
        att_query = att_query.filter(models.Attendance.user_id.in_(emp_ids))
        
    absent_records = att_query.filter(models.Attendance.status == "absent").all()
    
    alerts = []
    for record in absent_records:
        user = db.query(models.User).filter(models.User.id == record.user_id).first()
        initials = "".join([n[0] for n in user.name.split()[:2]]).upper() if user and user.name else "??"
        alerts.append({
            "id": record.id,
            "user_id": record.user_id,
            "name": user.name if user else "Unknown",
            "initials": initials,
            "desc": f"Date: Today - Unexplained Absence",
            "employeeNote": "No leave request filed. Requires follow-up."
        })
    return alerts


class NotificationCreateRequest(BaseModel):
    employee_id: int
    message: str
    type: str = "warning"

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    type: str
    read: bool
    created_at: str

    class Config:
        from_attributes = True

@router.post("/notifications", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def send_notification_to_employee(req: NotificationCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    
    # Ensure the employee belongs to this TL
    if current_user.role == "tl":
        emp = db.query(models.User).filter(models.User.id == req.employee_id, models.User.manager_id == current_user.id).first()
        if not emp:
            raise HTTPException(status_code=403, detail="Employee not assigned to you")

    notification = models.Notification(
        user_id=req.employee_id,
        message=req.message,
        type=req.type,
        read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return NotificationResponse(
        id=notification.id,
        user_id=notification.user_id,
        message=notification.message,
        type=notification.type,
        read=notification.read,
        created_at=notification.created_at.isoformat() if notification.created_at else ""
    )


class SprintCreateRequest(BaseModel):
    name: str
    goal: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    sp_target: Optional[int] = 40
    project_id: Optional[int] = None


class SprintResponse(BaseModel):
    id: int
    sprintId: str
    name: str
    goal: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    sp: int
    status: str
    project_id: Optional[int] = None

    class Config:
        from_attributes = True


@router.get("/sprints", response_model=List[SprintResponse])
def get_sprints(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    return db.query(models.Sprint).all()


@router.post("/sprints", response_model=SprintResponse, status_code=status.HTTP_201_CREATED)
def create_sprint(req: SprintCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    import time
    generated_id = f"SPR-{str(int(time.time()))[-6:]}"
    sprint = models.Sprint(
        sprintId=generated_id,
        name=req.name,
        goal=req.goal,
        start=req.start_date,
        end=req.end_date,
        sp=req.sp_target or 40,
        status="Planning",
        project_id=req.project_id
    )
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    return sprint


class MilestoneCreateRequest(BaseModel):
    name: str
    due_date: str
    task_ids: List[int] = []


@router.post("/projects/{project_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_project_milestone(project_id: int, req: MilestoneCreateRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    
    # Create milestone in DB
    milestone = models.Milestone(
        project_id=project_id,
        name=req.name,
        due_date=req.due_date,
        status="pending",
        progress=0,
        tasks_count=len(req.task_ids)
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    
    # Link selected tasks to this milestone
    if req.task_ids:
        db.query(models.Task).filter(models.Task.id.in_(req.task_ids)).update(
            {models.Task.milestone_id: milestone.id}, synchronize_session=False
        )
        db.commit()
        
    # Calculate status and progress dynamically
    updated_milestone = update_milestone_progress(db, milestone.id)
    return updated_milestone


# ─── Task Attachment Endpoints ───────────────────────────────────────────────

@router.post("/tasks/upload")
async def upload_task_file(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user)):
    verify_manager_role(current_user)
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
    verify_manager_role(current_user)
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
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
    verify_manager_role(current_user)
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


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.query(models.Subtask).filter(models.Subtask.task_id == task_id).delete()
    db.query(models.TaskAttachment).filter(models.TaskAttachment.task_id == task_id).delete()
    db.delete(task)
    db.commit()
    return {"status": "success", "message": f"Task {task_id} deleted"}


@router.delete("/tasks")
def delete_all_tasks(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_manager_role(current_user)
    task_ids = [t.id for t in db.query(models.Task).all()]
    if not task_ids:
        return {"status": "success", "message": "No tasks to delete", "deleted": 0}
    db.query(models.Subtask).filter(models.Subtask.task_id.in_(task_ids)).delete(synchronize_session=False)
    db.query(models.TaskAttachment).filter(models.TaskAttachment.task_id.in_(task_ids)).delete(synchronize_session=False)
    count = db.query(models.Task).delete(synchronize_session=False)
    db.commit()
    return {"status": "success", "message": f"Deleted {count} tasks", "deleted": count}




