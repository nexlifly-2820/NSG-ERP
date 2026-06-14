import os

os.system("git checkout backend/app/models.py")

with open(r"backend\app\models.py", "r", encoding="utf-8") as f:
    content = f.read()

old_vendor = """class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact_email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(String, default="active")"""

new_vendor = """class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    status = Column(String, default="Active")
    annual_spend = Column(String, nullable=True)
    renewal_date = Column(String, nullable=True)
    risk_level = Column(String, default="Low")"""

content = content.replace(old_vendor, new_vendor)

append_content = """
# Strategy & OKRs
class Objective(Base):
    __tablename__ = "objectives"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(String, default="On Track")
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

# Announcements
class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    priority = Column(String, default="Normal")
    audience = Column(String, default="All Employees")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    author = Column(String, default="CEO Office")
    read_count = Column(Integer, default=0)
    read_pct = Column(Float, default=0.0)

class AnnouncementRead(Base):
    __tablename__ = "announcement_reads"
    id = Column(Integer, primary_key=True, index=True)
    announcement_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    read_at = Column(DateTime(timezone=True), server_default=func.now())

# Document Vault
class VaultDocument(Base):
    __tablename__ = "vault_documents"
    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    parties = Column(String, nullable=True)
    file_url = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    sign_status = Column(String, default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Payroll
class PayrollRun(Base):
    __tablename__ = "payroll_runs"
    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    status = Column(String, default="Draft") # Draft, Processing, Completed
    total_gross = Column(Float, default=0.0)
    total_net = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

class Payslip(Base):
    __tablename__ = "payslips"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    payroll_run_id = Column(Integer, ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    basic = Column(Float, default=0.0)
    hra = Column(Float, default=0.0)
    allowances = Column(Float, default=0.0)
    da = Column(Float, default=0.0)
    bonus = Column(Float, default=0.0)
    epf = Column(Float, default=0.0)
    tds = Column(Float, default=0.0)
    lop = Column(Float, default=0.0)
    net = Column(Float, default=0.0)
    status = Column(String, default="pending")
    payment_method = Column(String, nullable=True)
    transaction_ref = Column(String, nullable=True)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    processed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], back_populates="payslips")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="info")
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    initiator_id = Column(String, nullable=False)
    module = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    change_diff = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
"""

if "class Payslip" not in content:
    content = content + "\n" + append_content

with open(r"backend\app\models.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Applied Master Fix to models.py")
