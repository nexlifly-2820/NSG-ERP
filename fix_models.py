import re

with open(r"backend\app\models.py", "r", encoding="utf-8") as f:
    content = f.read()

# Let's find the FIRST class Vendor and truncate there.
idx = content.find('class Vendor(Base):')
if idx != -1:
    clean_content = content[:idx]
    
    # Now append the classes we want at the end properly.
    append_classes = """class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    status = Column(String, default="Active")
    annual_spend = Column(String, nullable=True)
    renewal_date = Column(String, nullable=True)
    risk_level = Column(String, default="Low")

class APInvoice(Base):
    __tablename__ = "ap_invoices"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)
    ref_number = Column(String, nullable=False)
    amount = Column(String, nullable=False)
    due_date = Column(String, nullable=False)
    vendor = relationship("Vendor")

class StatutoryCompliance(Base):
    __tablename__ = "statutory_compliances"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    amount = Column(String, nullable=False)
    due_date = Column(String, nullable=False)

class SalaryComponent(Base):
    __tablename__ = "salary_components"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    calc = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    tax = Column(Boolean, default=True)

class FinanceTrend(Base):
    __tablename__ = "finance_trends"
    id = Column(Integer, primary_key=True, index=True)
    month = Column(String, nullable=False, unique=True)  # e.g., 'Jan', 'Feb'
    revenue = Column(Float, default=0.0)
    profit = Column(Float, default=0.0)
    cash_in = Column(Float, default=0.0)
    cash_out = Column(Float, default=0.0)

class CompanyPolicy(Base):
    __tablename__ = "company_policies"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    created_by = Column(String, nullable=False)
    status = Column(String, default="pending") # pending, approved, rejected
    submitted_at = Column(DateTime, server_default=func.now())

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
"""
    
    with open(r"backend\app\models.py", "w", encoding="utf-8") as f:
        f.write(clean_content + append_classes)
    
    print("Fixed models.py")
else:
    print("Could not find Vendor")
