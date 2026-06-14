import os

models_code = """
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
    title = Column(String, nullable=False, unique=True)
    department_id = Column(Integer, nullable=True)

class Shift(Base):
    __tablename__ = "shifts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)

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
"""

with open(r"c:\Users\vivek chamanthula\Desktop\Nsg Erp\NSG-ERP\backend\app\models.py", 'a', encoding='utf-8') as f:
    f.write("\n" + models_code)

print("Appended models successfully.")
