from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="employee")  # employee, tl, ceo, hr, admin
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    emp_id = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    status = Column(String, default="active")  # active, probation, terminated, suspended
    join_date = Column(Date, nullable=True)
    probation_end_date = Column(Date, nullable=True)
    bank_name = Column(String, nullable=True)
    account_number = Column(String, nullable=True)
    ifsc_code = Column(String, nullable=True)
    bank_branch = Column(String, nullable=True)
    grade = Column(Integer, default=1)
    manager = Column(String, nullable=True) # Deprecated string name, keep for backward compatibility
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    photo = Column(String, nullable=True)
    documents = Column(Text, nullable=True)  # JSON-serialized list of docs
    
    # Missing Personal Details mapping
    dob = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    
    # Payroll & PDF Details
    pan_number = Column(String, nullable=True)
    pf_number = Column(String, nullable=True)
    uan = Column(String, nullable=True)
    esi_number = Column(String, nullable=True)
    location = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    shift_timing = Column(String, nullable=True)

    # Relationships
    attendance_records = relationship("Attendance", back_populates="user", cascade="all, delete-orphan")
    attendance_corrections = relationship("AttendanceCorrection", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    timesheets = relationship("Timesheet", back_populates="user", cascade="all, delete-orphan")
    daily_timesheets = relationship("DailyTimesheet", foreign_keys="[DailyTimesheet.user_id]", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    leave_balances = relationship("LeaveBalance", back_populates="user", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="user", cascade="all, delete-orphan")
    expense_claims = relationship("ExpenseClaim", back_populates="user", cascade="all, delete-orphan")
    payslips = relationship("Payslip", foreign_keys="[Payslip.user_id]", back_populates="user", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="user", cascade="all, delete-orphan")
    resignations = relationship("Resignation", back_populates="user", cascade="all, delete-orphan")
    support_tickets = relationship("SupportTicket", back_populates="user", cascade="all, delete-orphan")
    escalations = relationship("Escalation", back_populates="user", cascade="all, delete-orphan")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    clock_in = Column(DateTime(timezone=True), nullable=True)
    clock_out = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="present")  # present, absent, late, half-day, leave
    total_hours = Column(Float, nullable=True)
    work_mode = Column(String, default="office")  # office, wfh
    is_late = Column(Boolean, default=False)
    exception_flag = Column(String, default="none")  # none, absent, missed-punch
    late_alert_dismissed = Column(Boolean, default=False)
    missed_punch_alert_dismissed = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="attendance_records")

class AttendanceCorrection(Base):
    __tablename__ = "attendance_corrections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    correction_date = Column(Date, nullable=False, index=True)
    requested_clock_in = Column(DateTime(timezone=True), nullable=False)
    requested_clock_out = Column(DateTime(timezone=True), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, approved, denied

    # Relationships
    user = relationship("User", back_populates="attendance_corrections")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    type = Column(String, default="warning")  # warning, success, danger, info
    read = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="notifications")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)


class Timesheet(Base):
    __tablename__ = "timesheets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    week_start_date = Column(Date, nullable=False, index=True)
    status = Column(String, default="draft")  # draft, submitted, approved, rejected
    rejection_comment = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="timesheets")
    rows = relationship("TimesheetRow", back_populates="timesheet", cascade="all, delete-orphan")


class TimesheetRow(Base):
    __tablename__ = "timesheet_rows"

    id = Column(Integer, primary_key=True, index=True)
    timesheet_id = Column(Integer, ForeignKey("timesheets.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, nullable=True)
    name = Column(String, nullable=False)
    sprint = Column(String, nullable=False)
    hours_mon = Column(Float, default=0.0)
    hours_tue = Column(Float, default=0.0)
    hours_wed = Column(Float, default=0.0)
    hours_thu = Column(Float, default=0.0)
    hours_fri = Column(Float, default=0.0)

    # Relationships
    timesheet = relationship("Timesheet", back_populates="rows")


class DailyTimesheet(Base):
    __tablename__ = "daily_timesheets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    date = Column(Date, nullable=False, index=True)
    project = Column(String, nullable=False)
    task = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    hours = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected
    rejection_comment = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="daily_timesheets")
    manager = relationship("User", foreign_keys=[manager_id])


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project = Column(String, nullable=False)
    sprint = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String, default="medium")  # high, medium, low
    status = Column(String, default="pending")  # pending, in-progress, done, blocked
    sp = Column(Integer, default=1)
    due = Column(Date, nullable=True)
    pr_status = Column(String, nullable=True)  # pending, approved, rejected
    pr_url = Column(String, nullable=True)
    rejected_reason = Column(String, nullable=True)
    custom_data = Column(Text, nullable=True)  # JSON-serialized custom fields
    acceptance = Column(Text, nullable=True)  # JSON-serialized array of strings
    milestone_id = Column(Integer, ForeignKey("milestones.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="tasks")
    subtasks = relationship("TaskSubtask", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("TaskAttachment", back_populates="task", cascade="all, delete-orphan")


class TaskSubtask(Base):
    __tablename__ = "task_subtasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    done = Column(Boolean, default=False)

    # Relationships
    task = relationship("Task", back_populates="subtasks")


class TaskAttachment(Base):
    __tablename__ = "task_attachments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    task = relationship("Task", back_populates="attachments")


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    CL = Column(Float, default=0.0)
    SL = Column(Float, default=0.0)
    EL = Column(Float, default=0.0)
    Maternity = Column(Float, default=0.0)
    year = Column(Integer, default=2026)

    # Relationships
    user = relationship("User", back_populates="leave_balances")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    leave_type = Column(String, nullable=False)  # CL, SL, EL, etc.
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    days = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, tl_approved, hr_approved, denied
    tl_approved_at = Column(DateTime(timezone=True), nullable=True)
    hr_approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="leave_requests")


class ExpenseClaim(Base):
    __tablename__ = "expense_claims"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    claim_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    receipt_url = Column(String, nullable=True)
    tl_approval = Column(String, default="pending")  # pending, approved, rejected
    hr_approval = Column(String, default="pending")
    status = Column(String, default="pending")  # pending, approved, rejected
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="expense_claims")


class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    payroll_run_id = Column(Integer, nullable=True)
    basic = Column(Float, nullable=False)
    hra = Column(Float, nullable=False)
    da = Column(Float, nullable=False)
    allowances = Column(Float, nullable=False)
    epf = Column(Float, nullable=False)
    tds = Column(Float, nullable=False)
    net = Column(Float, nullable=False)
    lop = Column(Float, default=0.0)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    
    # PDF Fields
    worked_days = Column(Float, nullable=True)
    arrear_days = Column(Float, nullable=True, default=0.0)
    lop_days = Column(Float, nullable=True, default=0.0)
    lop_days_reversed = Column(Float, nullable=True, default=0.0)
    
    status = Column(String, default="pending")  # pending, paid
    payment_method = Column(String, nullable=True)
    transaction_ref = Column(String, nullable=True)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    processed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="payslips")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    loan_amount = Column(Float, nullable=False)
    emi_amount = Column(Float, nullable=False)
    tenure = Column(Integer, nullable=False)
    disbursed_at = Column(DateTime(timezone=True), nullable=True)
    outstanding_balance = Column(Float, nullable=False)
    status = Column(String, default="active")  # active, closed

    # Relationships
    user = relationship("User", back_populates="loans")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, index=True)  # AssetTag e.g. LAP-089
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    assetTag = Column(String, nullable=False)
    type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    serialNumber = Column(String, nullable=True)
    issueDate = Column(Date, nullable=True)
    condition = Column(String, nullable=True)
    returnStatus = Column(String, default="Issued")  # Issued, Pending NOC, Returned
    signedDate = Column(Date, nullable=True)
    signature_data = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="assets")


class Resignation(Base):
    __tablename__ = "resignations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resignation_date = Column(Date, nullable=False)
    LWD = Column(Date, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected, withdrawn
    ceo_status = Column(String, default="pending")  # pending, approved, rejected
    reason = Column(Text, nullable=False)
    early_relief_status = Column(String, nullable=True) # requested, approved, rejected
    exit_checklist = Column(Text, nullable=True) # JSON array of checklist items
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="resignations")


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    priority = Column(String, default="medium")  # high, medium, low
    status = Column(String, default="open")  # open, in-progress, resolved, closed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="support_tickets")


class ChatChannel(Base):
    __tablename__ = "chat_channels"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    label = Column(String, nullable=True)
    type = Column(String, nullable=False)  # staff, grievance, management
    members = Column(Text, nullable=True)  # JSON-serialized list of strings


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(String, ForeignKey("chat_channels.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())
    parent_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=True)
    is_pinned = Column(Boolean, default=False)
    mentions = Column(Text, nullable=True) # JSON array of usernames
    attachment_url = Column(String, nullable=True)
    attachment_type = Column(String, nullable=True)
    seen_by = Column(Text, nullable=True) # JSON array
    delivered_to = Column(Text, nullable=True) # JSON array
    reactions = Column(Text, nullable=True) # JSON object
    deleted_at = Column(DateTime, nullable=True)
    is_edited = Column(Boolean, default=False)



class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    task_link = Column(String, nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    severity = Column(String, default="Medium")  # Medium, High, Critical
    ceo_viewed = Column(Boolean, default=False)
    resolved = Column(Boolean, default=False)
    rejected = Column(Boolean, default=False)
    dependencies = Column(String, nullable=True)  # Comma-separated dependencies list
    description = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="escalations")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(String, nullable=False)
    source = Column(String, nullable=True)
    stage = Column(String, default="applied")  # applied, screening, interview, offer, joined, rejected
    resume_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class JobHistory(Base):
    __tablename__ = "job_history"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)  # joining, compensation_change, department_transfer, etc.
    old_dept = Column(String, nullable=True)
    new_dept = Column(String, nullable=True)
    old_role = Column(String, nullable=True)
    new_role = Column(String, nullable=True)
    old_grade = Column(Integer, nullable=True)
    new_grade = Column(Integer, nullable=True)
    manager = Column(String, nullable=True)
    effective_date = Column(Date, nullable=False)
    approved_by = Column(String, nullable=True)

    employee = relationship("User", foreign_keys=[employee_id])


class DisciplinaryTicket(Base):
    __tablename__ = "disciplinary_tickets"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    issued_by = Column(String, nullable=False)
    violation_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    evidence_url = Column(String, nullable=True)
    response_deadline = Column(DateTime(timezone=True), nullable=True)
    employee_rebuttal = Column(Text, nullable=True)
    status = Column(String, default="issued")  # issued, resolved

    employee = relationship("User", foreign_keys=[employee_id])


class PIP(Base):
    __tablename__ = "pips"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ticket_id = Column(Integer, ForeignKey("disciplinary_tickets.id", ondelete="SET NULL"), nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    duration_weeks = Column(Integer, default=4)
    goals = Column(Text, nullable=True)  # JSON-serialized goals
    status = Column(String, default="ongoing")  # ongoing, completed, failed
    outcome = Column(String, default="pending")  # pending, passed, terminated

    employee = relationship("User", foreign_keys=[employee_id])
    manager = relationship("User", foreign_keys=[manager_id])


class TrainingTrack(Base):
    __tablename__ = "training_tracks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    department = Column(String, default="All")
    modules = Column(Text, nullable=True)  # JSON-serialized modules
    is_mandatory = Column(Boolean, default=False)


class TrainingProgress(Base):
    __tablename__ = "training_progress"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    track_id = Column(Integer, ForeignKey("training_tracks.id", ondelete="CASCADE"), nullable=False)
    completed_modules = Column(Integer, default=0)
    quiz_score = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)

    employee = relationship("User", foreign_keys=[employee_id])
    track = relationship("TrainingTrack")

class DepartmentSchema(Base):
    __tablename__ = "department_schemas"

    id = Column(Integer, primary_key=True, index=True)
    department = Column(String, unique=True, index=True, nullable=False)
    schema_json = Column(Text, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    initiator_id = Column(String, nullable=False)
    module = Column(String, nullable=False)
    record_id = Column(Integer, nullable=True)
    action_type = Column(String, nullable=False)
    change_diff = Column(Text, nullable=True)  # JSON string
    ip_address = Column(String, nullable=True)
    client_agent = Column(String, nullable=True)


class TDSDeclaration(Base):
    __tablename__ = "tds_declarations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    financial_year = Column(String, nullable=False)
    declaration_type = Column(String, nullable=False)
    declared_amount = Column(Float, nullable=False)
    proof_url = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, verified, rejected
    verified_by = Column(String, nullable=True)

    employee = relationship("User", foreign_keys=[employee_id])


class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    status = Column(String, default="draft")  # draft, maker_signed, checker_signed, bank_transferred
    maker_id = Column(String, nullable=True)
    maker_signed_at = Column(DateTime(timezone=True), nullable=True)
    checker_id = Column(String, nullable=True)
    checker_signed_at = Column(DateTime(timezone=True), nullable=True)
    bank_transfer_at = Column(DateTime(timezone=True), nullable=True)


class TimesheetException(Base):
    __tablename__ = "timesheet_exceptions"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    week_start_date = Column(Date, nullable=False)
    exception_type = Column(String, nullable=False)  # underlogged, unsubmitted
    logged_hours = Column(Float, default=0.0)
    target_hours = Column(Float, default=8.0)
    date = Column(Date, nullable=False)
    tl_rejection_comment = Column(Text, nullable=True)
    status = Column(String, default="open")  # open, resolved
    days_overdue = Column(Integer, default=0)

    employee = relationship("User", foreign_keys=[employee_id])


class OnboardingTask(Base):
    __tablename__ = "onboarding_tasks"

    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_name = Column(String, nullable=False)
    assigned_to = Column(String, nullable=False)  # IT, Employee, HR, TL
    due_date = Column(Date, nullable=False)
    is_mandatory = Column(Boolean, default=True)
    requires_esign = Column(Boolean, default=False)
    completed_at = Column(Date, nullable=True)
    status = Column(String, default="pending")  # pending, completed

    employee = relationship("User", foreign_keys=[instance_id])


class EsignRequest(Base):
    __tablename__ = "esign_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_name = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, signed, voided
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    signed_at = Column(DateTime(timezone=True), nullable=True)

    employee = relationship("User", foreign_keys=[employee_id])


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    priority = Column(String, default="Normal")  # Urgent, Normal, Low
    audience = Column(String, default="All Portals")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    author = Column(String, default="CEO Office")
    read_count = Column(Integer, default=0)
    read_pct = Column(Float, default=0.0)


class AppraisalCycle(Base):
    __tablename__ = "appraisal_cycles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    period = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    self_deadline = Column(String, nullable=False)
    tl_review_deadline = Column(String, nullable=False)
    status = Column(String, default="active")


class IncrementProposal(Base):
    __tablename__ = "increment_proposals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    current_ctc = Column(Float, nullable=False)
    proposed_ctc = Column(Float, nullable=False)
    increment_pct = Column(Float, nullable=False)
    performance_band = Column(String, default="A")
    effective_date = Column(String, nullable=False)
    status = Column(String, default="pending_ceo")
    approved_by = Column(String, nullable=True)

    employee = relationship("User", foreign_keys=[employee_id])


class AppraisalScorecard(Base):
    __tablename__ = "appraisal_scorecards"

    id = Column(Integer, primary_key=True, index=True)
    employee_name = Column(String, nullable=False)
    tl_name = Column(String, nullable=False)
    rating = Column(String, nullable=False)
    comments = Column(Text, nullable=False)
    emp_acknowledged = Column(Boolean, default=False)
    hr_acknowledged = Column(Boolean, default=False)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    client = Column(String, nullable=False)
    budget = Column(Float, nullable=False)
    used = Column(Float, default=0.0)
    status = Column(String, default="Active")  # Active, At Risk, Completed, On Hold
    deadline = Column(String, nullable=True)  # stored as string e.g. "Dec 31, 2025"
    checklist = Column(Text, nullable=True)   # JSON-serialized array of checklist items
    department = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    sprintId = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    goal = Column(String, nullable=True)
    start = Column(String, nullable=True)
    end = Column(String, nullable=True)
    sp = Column(Integer, default=40)
    status = Column(String, default="Planning")  # Planning, Active, Completed
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)


class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    current = Column(String, nullable=False)
    proposed = Column(String, nullable=False)
    status = Column(String, default="approved_by_ceo")


class Objective(Base):
    __tablename__ = "objectives"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(String, default="On Track")  # On Track, At Risk, Off Track
    progress = Column(Integer, default=0)
    owner = Column(String, nullable=False)
    quarter = Column(String, default="Q2")
    year = Column(String, default="2026")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    krs = relationship("KeyResult", back_populates="objective", cascade="all, delete-orphan")


class KeyResult(Base):
    __tablename__ = "key_results"

    id = Column(Integer, primary_key=True, index=True)
    objective_id = Column(Integer, ForeignKey("objectives.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    target = Column(Integer, nullable=False)
    current = Column(Integer, default=0)
    unit = Column(String, nullable=False)
    sprint_link = Column(String, nullable=True)

    objective = relationship("Objective", back_populates="krs")


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(String, nullable=False)  # ISO date string e.g. "2026-01-26"
    type = Column(String, default="national")  # national, optional


class LeavePolicy(Base):
    __tablename__ = "leave_policies"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)         # CL, SL, EL, Maternity
    accrual_rule = Column(String, default="monthly")
    max_balance = Column(Integer, nullable=False)
    carryover_days = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)


class CustomSchema(Base):
    __tablename__ = "custom_schemas"

    id = Column(Integer, primary_key=True, index=True)
    department = Column(String, nullable=False, index=True)
    schema_fields = Column(Text, nullable=False, default="[]")  # JSON-serialized list

class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String, nullable=False)
    proficiency_level = Column(Integer, default=3) # 1 to 5

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    due_date = Column(String, nullable=False)
    status = Column(String, default="pending")
    progress = Column(Integer, default=0)
    tasks_count = Column(Integer, default=0)




class APInvoice(Base):
    __tablename__ = "ap_invoices"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, nullable=True)
    vendor_name = Column(String, nullable=True)
    ref_number = Column(String, nullable=True)
    amount = Column(Float, default=0.0)
    due_date = Column(Date, nullable=True)
    status = Column(String, default="Pending")

class ARInvoice(Base):
    __tablename__ = "ar_invoices"
    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, nullable=True)
    invoice_number = Column(String, nullable=True)
    amount = Column(Float, default=0.0)
    status = Column(String, default="Pending")
    days_overdue = Column(Integer, default=0)

class CompanyPolicy(Base):
    __tablename__ = "company_policies"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class DepartmentBudget(Base):
    __tablename__ = "department_budgets"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, nullable=True)
    title = Column(String, nullable=False)
    requested_by = Column(String, nullable=True)
    amount = Column(Float, default=0.0)
    variance = Column(String, nullable=True)
    status = Column(String, default="pending")

class AnnouncementRead(Base):
    __tablename__ = "announcement_reads"
    id = Column(Integer, primary_key=True, index=True)
    announcement_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    read_at = Column(DateTime(timezone=True), server_default=func.now())

class StatutoryCompliance(Base):
    __tablename__ = "statutory_compliance"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    amount = Column(Float, default=0.0)
    due_date = Column(Date, nullable=True)
    status = Column(String, default="Pending")

class FinanceTrend(Base):
    __tablename__ = "finance_trends"
    id = Column(Integer, primary_key=True, index=True)
    month = Column(String, nullable=False)
    revenue = Column(Float, default=0.0)
    profit = Column(Float, default=0.0)
    cash_in = Column(Float, default=0.0)
    cash_out = Column(Float, default=0.0)

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact = Column(String, nullable=True)
    email = Column(String, nullable=True)

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    head_id = Column(Integer, nullable=True)
    parent_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    headcount = Column(Integer, default=0)

class SalaryComponent(Base):
    __tablename__ = "salary_components"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, default="Fixed")
    calc = Column(String, default="Flat")
    value = Column(Float, default=0.0)
    tax = Column(Boolean, default=True)

class Designation(Base):
    __tablename__ = "designations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    department_id = Column(Integer, nullable=True)
    level = Column(String, nullable=True)

class Shift(Base):
    __tablename__ = "shifts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    days = Column(String, nullable=True)

class VaultDocument(Base):
    __tablename__ = "vault_documents"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_by = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="Active")
    hash = Column(String, nullable=True)

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    interview_date = Column(DateTime(timezone=True), nullable=True)
    interviewer_id = Column(Integer, nullable=True)
    status = Column(String, default="Scheduled")

class JobOffer(Base):
    __tablename__ = "job_offers"
    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    offer_date = Column(Date, nullable=True)
    salary_offered = Column(Float, default=0.0)
    status = Column(String, default="Draft")


