import os

payroll_models = """

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

with open(r"backend\app\models.py", "r", encoding="utf-8") as f:
    content = f.read()

if "class Payslip" not in content:
    with open(r"backend\app\models.py", "a", encoding="utf-8") as f:
        f.write("\n" + payroll_models + "\n")
    print("Added Payroll, Notification, and AuditLog models")
else:
    print("Models already exist")
