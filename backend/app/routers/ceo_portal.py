from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import json

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

class AnnouncementCreate(BaseModel):
    title: str
    body: str
    priority: Optional[str] = "Normal"  # Urgent, Normal, Low
    audience: Optional[str] = "All Employees"

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    body: str
    priority: str
    audience: str
    created_at: datetime
    author: str
    read_count: int
    read_pct: float

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
def get_dashboard_summary(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)

    total_headcount = db.query(models.User).filter(models.User.role == "employee", models.User.status == "active").count()
    active_blockers = db.query(models.Escalation).filter(models.Escalation.resolved == False).count()
    
    # Pendings count
    pending_payroll = db.query(models.PayrollRun).filter(models.PayrollRun.status == "maker_signed").count()
    pending_loans = db.query(models.Loan).filter(models.Loan.status == "active", models.Loan.outstanding_balance > 0).count() # Simply active loans
    pending_claims = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.status == "pending").count()
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "tl_approved").count() # ready for final sign-off
    
    total_approvals = pending_payroll + pending_claims + pending_leaves
    
    return {
        "headcount": total_headcount,
        "activeBlockers": active_blockers,
        "pendingApprovalsCount": total_approvals,
        "okrProgressAverage": 75.0, # Strategy completion average placeholder
        "riskIndex": "Low" if active_blockers <= 2 else "High"
    }

# 2. Corporate Announcements
@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    # Open to all authenticated users so employees can see announcements
    return db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()

@router.post("/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(req: AnnouncementCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    # Calculate mock reads metrics
    total_users = db.query(models.User).count()
    read_count = int(total_users * 0.65) if total_users > 0 else 0
    read_pct = 65.0
    
    ann = models.Announcement(
        title=req.title,
        body=req.body,
        priority=req.priority,
        audience=req.audience,
        author="CEO Office",
        read_count=read_count,
        read_pct=read_pct
    )
    db.add(ann)
    
    # Auto register audit trail
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Announcements",
        action_type="create",
        change_diff=json.dumps({"announcement_title": req.title})
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(ann)
    return ann

@router.delete("/announcements/{id}")
def delete_announcement(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    ann = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found.")
    
    db.delete(ann)
    db.commit()
    return {"status": "success", "message": "Announcement removed."}

# 3. CEO Checker Approvals
@router.get("/approvals/pending")
def get_pending_approvals(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    payroll = db.query(models.PayrollRun).filter(models.PayrollRun.status == "maker_signed").all()
    claims = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.status == "pending").all()
    leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "tl_approved").all()
    loans = db.query(models.Loan).filter(models.Loan.status == "active").all()
    
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
        "payrollRuns": payroll,
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
        
    req.status = "hr_approved" # Set to final approved status
    req.hr_approved_at = datetime.now()
    
    # Adjust balance
    bal = db.query(models.LeaveBalance).filter(models.LeaveBalance.user_id == req.user_id).first()
    if bal and hasattr(bal, req.leave_type):
        current_bal = getattr(bal, req.leave_type)
        setattr(bal, req.leave_type, max(0.0, current_bal - req.days))
        
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
        
    req.status = "denied"
    
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
def get_escalations(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    
    # Mark viewed by CEO
    escalations = db.query(models.Escalation).all()
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

# 5. Configs & Audit Trails
@router.get("/audit-trail", response_model=List[AuditLogResponse])
def get_audit_trail(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()

@router.get("/configs")
def get_system_settings(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    settings_list = db.query(models.SystemSetting).all()
    return {s.key: s.value for s in settings_list}

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
        action_type="verify_doc",
        change_diff=json.dumps({"config_key": req.key, "new_value": req.value})
    )
    db.add(db_log)
    db.commit()
    return {"status": "success", "key": req.key, "value": req.value}

# ─── 6. Finance Portal Data & Commands ────────────────────────────────────────

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

@router.get("/finance/data")
def get_finance_data(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)

    # 1. Fetch KPI & trends from system_settings or use defaults
    kpi_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_kpi_data").first()
    if kpi_setting:
        kpi_data = json.loads(kpi_setting.value)
    else:
        kpi_data = {
            "revenue": { "val": "₹12.4M", "trend": "+14%", "up": True },
            "grossProfit": { "val": "₹4.8M", "trend": "+8%", "up": True },
            "netProfit": { "val": "₹2.1M", "trend": "+5%", "up": True },
            "opex": { "val": "₹3.6M", "trend": "-2%", "up": False },
            "cash": { "val": "₹8.5M", "trend": "+11%", "up": True },
            "burnRate": { "val": "₹1.2M/mo", "trend": "Stable", "up": None }
        }

    rev_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_revenue_trend").first()
    if rev_setting:
        revenue_trend = json.loads(rev_setting.value)
    else:
        revenue_trend = [
            { "month": "Jan", "revenue": 8.2, "profit": 2.1 },
            { "month": "Feb", "revenue": 9.1, "profit": 2.3 },
            { "month": "Mar", "revenue": 10.5, "profit": 3.0 },
            { "month": "Apr", "revenue": 11.2, "profit": 3.2 },
            { "month": "May", "revenue": 12.4, "profit": 3.5 }
        ]

    cash_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_cash_flow_data").first()
    if cash_setting:
        cash_flow_data = json.loads(cash_setting.value)
    else:
        cash_flow_data = [
            { "month": "Jan", "in": 9.0, "out": 7.0 },
            { "month": "Feb", "in": 10.0, "out": 8.0 },
            { "month": "Mar", "in": 11.0, "out": 8.5 },
            { "month": "Apr", "in": 12.0, "out": 9.0 },
            { "month": "May", "in": 13.0, "out": 10.0 }
        ]

    budgets_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_budgets").first()
    if budgets_setting:
        budgets = json.loads(budgets_setting.value)
    else:
        budgets = [
            { "id": 1, "dept": "Marketing", "title": "Q3 Global Campaign", "amount": "₹2,500,000", "reqBy": "David L.", "status": "pending", "variance": "+15% vs Last Qtr" },
            { "id": 2, "dept": "IT Infrastructure", "title": "AWS Enterprise Renewal", "amount": "₹1,850,000", "reqBy": "Sarah C.", "status": "pending", "variance": "Within Limits" },
            { "id": 3, "dept": "Sales", "title": "CRM Upgrade", "amount": "₹400,000", "reqBy": "Amit P.", "status": "approved", "variance": "-5% vs Last Qtr" }
        ]

    ar_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_ar").first()
    if ar_setting:
        ar_data = json.loads(ar_setting.value)
    else:
        ar_data = [
            { "client": "Acme Corp", "invoice": "INV-2041", "amount": "₹1,200,000", "daysOverdue": 14, "status": "Overdue" },
            { "client": "Global Tech", "invoice": "INV-2045", "amount": "₹850,000", "daysOverdue": 0, "status": "Pending" },
            { "client": "Nexus Retail", "invoice": "INV-2030", "amount": "₹4,300,000", "daysOverdue": 45, "status": "High Risk" }
        ]

    ap_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_ap").first()
    if ap_setting:
        ap_data = json.loads(ap_setting.value)
    else:
        ap_data = [
            { "vendor": "AWS India", "ref": "AWS-MAY-26", "amount": "₹950,000", "dueDate": "15 Jun 2026", "status": "Upcoming" },
            { "vendor": "WeWork", "ref": "WW-Q3", "amount": "₹2,100,000", "dueDate": "01 Jul 2026", "status": "Upcoming" }
        ]

    stat_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_statutory").first()
    if stat_setting:
        statutory = json.loads(stat_setting.value)
    else:
        statutory = [
            { "id": 1, "type": "Provident Fund (PF)", "amount": "₹4,50,000", "month": "May 2026", "dueDate": "15 Jun 2026", "status": "Paid" },
            { "id": 2, "type": "TDS", "amount": "₹8,20,000", "month": "May 2026", "dueDate": "07 Jun 2026", "status": "Paid" }
        ]

    sal_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_salary_structure").first()
    if sal_setting:
        salary_structure = json.loads(sal_setting.value)
    else:
        salary_structure = [
            { "id": 1, "name": "Basic Salary", "type": "Fixed", "calc": "Flat", "value": 45000, "tax": True },
            { "id": 2, "name": "HRA", "type": "Fixed", "calc": "% of Basic", "value": 50, "tax": False }
        ]

    # 2. Dynamic aggregations
    # Real pending/approved expense claims
    db_claims = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.status == "pending").all()
    db_loans = db.query(models.Loan).filter(models.Loan.status == "active", models.Loan.outstanding_balance > 0, models.Loan.disbursed_at.is_(None)).all()

    # Build approvals for the CapEx & Contracts/Expenses section
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

    # Payroll register summary: dynamically compiled from active users
    db_users = db.query(models.User).filter(models.User.status == "active").all()
    payroll_register = []
    total_payroll_outflow = 0.0

    # Map roles to base salaries
    role_salaries = {
        "ceo": 350000,
        "hr": 85000,
        "tl": 120000,
        "employee": 90000
    }

    for u in db_users:
        # Check specific base salaries for designated users or default
        base = role_salaries.get(u.role, 80000)
        if "Architect" in (u.designation or ""):
            base = 150000
        elif "Senior" in (u.designation or ""):
            base = 110000
        
        gross = base
        # net pay = gross - 12% PF - 5% TDS
        net = gross * 0.83
        total_payroll_outflow += net

        payroll_register.append({
            "id": u.id,
            "name": u.name,
            "dept": u.department or "Operations",
            "gross": f"₹{int(gross):,}",
            "net": f"₹{int(net):,}",
            "status": "Processed"
        })

    # Adjust OPEX and Cash based on live data
    # Base OPEX = 3.6M. Base Cash = 8.5M.
    # Add approved expenses
    approved_claims_sum = db.query(func.sum(models.ExpenseClaim.amount)).filter(models.ExpenseClaim.status == "approved").scalar() or 0.0
    disbursed_loans_sum = db.query(func.sum(models.Loan.loan_amount)).filter(models.Loan.status == "active", models.Loan.disbursed_at.isnot(None)).scalar() or 0.0

    current_opex_val = 3.6 + (approved_claims_sum + total_payroll_outflow) / 1000000.0
    current_cash_val = 8.5 - (approved_claims_sum + disbursed_loans_sum + total_payroll_outflow) / 1000000.0

    kpi_data["opex"]["val"] = f"₹{current_opex_val:.1f}M"
    kpi_data["cash"]["val"] = f"₹{current_cash_val:.1f}M"

    return {
        "kpiData": kpi_data,
        "revenueTrend": revenue_trend,
        "cashFlowData": cash_flow_data,
        "budgets": budgets,
        "arData": ar_data,
        "apData": ap_data,
        "statutory": statutory,
        "salaryStructure": salary_structure,
        "executiveApprovals": approvals_list,
        "payrollRegister": payroll_register
    }

@router.post("/finance/budgets/{id}/approve")
def approve_finance_budget(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)

    budgets_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_budgets").first()
    if not budgets_setting:
        budgets = [
            { "id": 1, "dept": "Marketing", "title": "Q3 Global Campaign", "amount": "₹2,500,000", "reqBy": "David L.", "status": "pending", "variance": "+15% vs Last Qtr" },
            { "id": 2, "dept": "IT Infrastructure", "title": "AWS Enterprise Renewal", "amount": "₹1,850,000", "reqBy": "Sarah C.", "status": "pending", "variance": "Within Limits" },
            { "id": 3, "dept": "Sales", "title": "CRM Upgrade", "amount": "₹400,000", "reqBy": "Amit P.", "status": "approved", "variance": "-5% vs Last Qtr" }
        ]
    else:
        budgets = json.loads(budgets_setting.value)

    updated = False
    for b in budgets:
        if b["id"] == id:
            b["status"] = "approved"
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Budget request not found.")

    if not budgets_setting:
        budgets_setting = models.SystemSetting(key="finance_budgets", value=json.dumps(budgets))
        db.add(budgets_setting)
    else:
        budgets_setting.value = json.dumps(budgets)

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

    return {"status": "success", "budgets": budgets}

@router.post("/finance/budgets/{id}/reject")
def reject_finance_budget(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)

    budgets_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_budgets").first()
    if not budgets_setting:
        budgets = [
            { "id": 1, "dept": "Marketing", "title": "Q3 Global Campaign", "amount": "₹2,500,000", "reqBy": "David L.", "status": "pending", "variance": "+15% vs Last Qtr" },
            { "id": 2, "dept": "IT Infrastructure", "title": "AWS Enterprise Renewal", "amount": "₹1,850,000", "reqBy": "Sarah C.", "status": "pending", "variance": "Within Limits" },
            { "id": 3, "dept": "Sales", "title": "CRM Upgrade", "amount": "₹400,000", "reqBy": "Amit P.", "status": "approved", "variance": "-5% vs Last Qtr" }
        ]
    else:
        budgets = json.loads(budgets_setting.value)

    updated = False
    for b in budgets:
        if b["id"] == id:
            b["status"] = "rejected"
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Budget request not found.")

    if not budgets_setting:
        budgets_setting = models.SystemSetting(key="finance_budgets", value=json.dumps(budgets))
        db.add(budgets_setting)
    else:
        budgets_setting.value = json.dumps(budgets)

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

    return {"status": "success", "budgets": budgets}

@router.post("/finance/salary-structure")
def update_salary_structure(req: SalaryStructureListRequest, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)

    components_list = [comp.dict() for comp in req.components]

    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "finance_salary_structure").first()
    if not setting:
        setting = models.SystemSetting(key="finance_salary_structure", value=json.dumps(components_list))
        db.add(setting)
    else:
        setting.value = json.dumps(components_list)

    # Log action
    db_log = models.AuditLog(
        initiator_id=current_user.name,
        module="Finance",
        record_id=None,
        action_type="update_salary_structure",
        change_diff=json.dumps({"components_count": len(components_list)})
    )
    db.add(db_log)
    db.commit()

    return {"status": "success", "salaryStructure": components_list}


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
def ceo_get_projects(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.Project).order_by(models.Project.id.desc()).all()


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
