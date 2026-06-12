from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any
from datetime import date, datetime
import json

from app import models, database
from app.core import security

router = APIRouter(
    prefix="/employee-portal",
    tags=["employee-portal"]
)

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

# ─── 1.5 TASKS SCHEMAS & ROUTES ────────────────────────────────────────────────

class SubtaskResponse(BaseModel):
    id: int
    title: str
    done: bool

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

@router.get("/tasks/my-tasks", response_model=List[TaskResponse])
def get_my_tasks(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()
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
            subtasks=[SubtaskResponse(id=st.id, title=st.title, done=st.done) for st in t.subtasks]
        ))
    return resp_tasks

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
    task.status = "done"  # Automatically mark task as done or keep as in-progress pending approval
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
        subtasks=[SubtaskResponse(id=st.id, title=st.title, done=st.done) for st in task.subtasks]
    )

@router.get("/tasks/schema")
def get_task_schema(db: Session = Depends(database.get_db), current_user: models.User = Depends(security.get_current_user)):
    user_dept = current_user.department if current_user.department else "IT"
    
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
# ─── 2. LEAVE SCHEMAS & ROUTES ────────────────────────────────────────────────

class LeaveBalanceResponse(BaseModel):
    id: int
    CL: float
    SL: float
    EL: float
    Maternity: float
    Paternity: float
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
        # Seed default balances if none found
        bal = models.LeaveBalance(user_id=current_user.id, CL=6.0, SL=8.0, EL=12.0, year=2026)
        db.add(bal)
        db.commit()
        db.refresh(bal)
    return bal

@router.get("/leave/my-requests", response_model=List[LeaveRequestResponse])
def get_my_leave_requests(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.LeaveRequest).filter(models.LeaveRequest.user_id == current_user.id).order_by(models.LeaveRequest.from_date.desc()).all()

@router.post("/leave/request", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def request_leave(req: LeaveRequestCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
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
    db.commit()
    db.refresh(new_req)
    return new_req
    
@router.post("/leave/request/{id}/cancel", response_model=LeaveRequestResponse)
def cancel_leave(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id, models.LeaveRequest.user_id == current_user.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")
    
    if req.status not in ["pending", "tl_approved", "hr_approved"]:
        raise HTTPException(status_code=400, detail="Cannot cancel a leave request in its current state.")
        
    was_hr_approved = (req.status == "hr_approved")
    req.status = "cancelled"
    
    # Revert leave balance if it was already HR approved
    if was_hr_approved:
        bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.user_id == current_user.id).first()
        if bal:
            if req.leave_type == "CL": bal.CL += req.days
            elif req.leave_type == "SL": bal.SL += req.days
            elif req.leave_type == "EL": bal.EL += req.days
            elif req.leave_type == "Maternity": bal.Maternity += req.days
            elif req.leave_type == "Paternity": bal.Paternity += req.days
            
    db.commit()
    db.refresh(req)
    return req


# ─── 3. EXPENSES SCHEMAS & ROUTES ─────────────────────────────────────────────

class ExpenseClaimCreate(BaseModel):
    amount: float
    category: str
    receipt_url: Optional[str] = "#"

class ExpenseClaimResponse(BaseModel):
    id: int
    claim_date: date
    amount: float
    category: str
    receipt_url: Optional[str]
    tl_approval: str
    hr_approval: str
    status: str

    class Config:
        from_attributes = True

@router.get("/expenses/my-claims", response_model=List[ExpenseClaimResponse])
def get_my_expense_claims(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.ExpenseClaim).filter(models.ExpenseClaim.user_id == current_user.id).order_by(models.ExpenseClaim.claim_date.desc()).all()

@router.post("/expenses/claim", response_model=ExpenseClaimResponse, status_code=status.HTTP_201_CREATED)
def claim_expense(req: ExpenseClaimCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    claim = models.ExpenseClaim(
        user_id=current_user.id,
        claim_date=date.today(),
        amount=req.amount,
        category=req.category,
        receipt_url=req.receipt_url,
        tl_approval="pending",
        hr_approval="pending",
        status="pending"
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


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

@router.get("/payroll/my-payslips", response_model=List[PayslipResponse])
def get_my_payslips(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Payslip).filter(models.Payslip.user_id == current_user.id).order_by(models.Payslip.year.desc(), models.Payslip.month.desc()).all()

@router.get("/payroll/my-loans", response_model=List[LoanResponse])
def get_my_loans(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Loan).filter(models.Loan.user_id == current_user.id).all()

class CTCResponse(BaseModel):
    earnings: List[dict]
    deductions: List[dict]
    total_earnings: float
    total_deductions: float
    net_take_home: float

@router.get("/payroll/ctc", response_model=CTCResponse)
def get_my_ctc(current_user: models.User = Depends(security.get_current_user)):
    base_annual = 500000 + (current_user.grade or 1) * 200000
    monthly_gross = base_annual / 12
    basic = monthly_gross * 0.5
    hra = monthly_gross * 0.2
    sa = monthly_gross * 0.3
    pf = basic * 0.12
    pt = 200
    tds = monthly_gross * 0.1
    
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
    # Simple implementation: log 80C and HRA
    if req.sec80c > 0:
        db.add(models.TDSDeclaration(employee_id=current_user.id, financial_year="2026-27", declaration_type="80C", declared_amount=req.sec80c, status="pending"))
    if req.hra_rent > 0:
        db.add(models.TDSDeclaration(employee_id=current_user.id, financial_year="2026-27", declaration_type="HRA", declared_amount=req.hra_rent, status="pending"))
    db.commit()
    return {"status": "success", "message": "TDS Declaration submitted successfully."}


# ─── 5. PROFILE SCHEMAS & ROUTES ──────────────────────────────────────────────

class BankUpdate(BaseModel):
    bank_name: str
    account_number: str
    ifsc_code: str

class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True

@router.get("/profile/details", response_model=UserProfileResponse)
def get_profile_details(current_user: models.User = Depends(security.get_current_user)):
    return current_user

@router.post("/profile/update-bank")
def update_bank_details(req: BankUpdate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    # Assuming bank fields could exist in User model or related details.
    # For now, return a success message simulating bank record update.
    return {"status": "success", "message": "Bank details submitted for verification."}


# ─── 6. RESIGNATION & ASSETS SCHEMAS & ROUTES ─────────────────────────────────

class ResignationCreate(BaseModel):
    reason: str

class ResignationResponse(BaseModel):
    id: int
    resignation_date: date
    LWD: date
    status: str
    reason: str

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
    return db.query(models.Resignation).filter(models.Resignation.user_id == current_user.id).first()

@router.post("/resignation/submit", response_model=ResignationResponse)
def submit_resignation(req: ResignationCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    existing = db.query(models.Resignation).filter(models.Resignation.user_id == current_user.id).first()
    if existing:
         raise HTTPException(status_code=400, detail="Resignation already submitted.")
    
    # Auto compute Last Working Day as 30 days from now
    res_date = date.today()
    lwd_date = res_date + int(30) # simply add days logic or offset
    lwd_calculated = date.fromordinal(res_date.toordinal() + 30)
    
    res = models.Resignation(
        user_id=current_user.id,
        resignation_date=res_date,
        LWD=lwd_calculated,
        reason=req.reason,
        status="pending"
    )
    db.add(res)
    db.commit()
    db.refresh(res)
    return res

@router.post("/resignation/withdraw")
def withdraw_resignation(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    res = db.query(models.Resignation).filter(
        models.Resignation.user_id == current_user.id,
        models.Resignation.status == "pending"
    ).first()
    if not res:
        raise HTTPException(status_code=404, detail="No active resignation request found.")
        
    db.delete(res)
    db.commit()
    return {"status": "success", "message": "Resignation request withdrawn successfully."}

@router.get("/resignation/my-assets", response_model=List[AssetResponse])
def get_my_assets(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Asset).filter(models.Asset.user_id == current_user.id).all()


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
def get_my_tickets(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.SupportTicket).filter(models.SupportTicket.user_id == current_user.id).order_by(models.SupportTicket.created_at.desc()).all()

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

class MessageResponse(BaseModel):
    id: int
    channel_id: str
    sender: str
    text: str
    timestamp: datetime

    class Config:
        from_attributes = True

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
        text=req.text
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


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

    def disconnect(self, client_id: str, websocket: WebSocket):
        if client_id in self.active_connections:
            self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]

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
                channel_id = msg_data.get("channel_id")
                text = msg_data.get("text")
                sender = msg_data.get("sender", client_id)

                if channel_id and text:
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
                            text=text
                        )
                        db_session.add(db_msg)
                        db_session.commit()
                        db_session.refresh(db_msg)
                        
                        # Broadcast
                        broadcast_data = {
                            "id": db_msg.id,
                            "channel_id": db_msg.channel_id,
                            "sender": db_msg.sender,
                            "text": db_msg.text,
                            "timestamp": db_msg.timestamp.isoformat()
                        }
                        await manager.broadcast_message(broadcast_data)
                    finally:
                        db_session.close()
            except Exception as e:
                print(f"Error parsing websocket payload: {e}")
    except WebSocketDisconnect:
        manager.disconnect(client_id, websocket)
