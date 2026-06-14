import os

model_code = """
class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    status = Column(String, default="Active")
    annual_spend = Column(String, nullable=True)
    renewal_date = Column(String, nullable=True)
    risk_level = Column(String, default="Low")
"""

routers_code = """
class VendorCreate(BaseModel):
    vendor_id: str
    name: str
    category: str
    status: str
    annual_spend: str
    renewal_date: str
    risk_level: str

class VendorResponse(BaseModel):
    id: int
    vendor_id: str
    name: str
    category: str
    status: str
    annual_spend: str
    renewal_date: str
    risk_level: str
    
    class Config:
        from_attributes = True

@router.get("/vendors", response_model=List[VendorResponse])
def get_vendors(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.Vendor).all()

@router.post("/vendors", response_model=VendorResponse)
def create_vendor(req: VendorCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    db_vendor = db.query(models.Vendor).filter(models.Vendor.vendor_id == req.vendor_id).first()
    if db_vendor:
        raise HTTPException(status_code=400, detail="Vendor ID already exists")
    
    new_vendor = models.Vendor(**req.dict())
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

@router.delete("/vendors/{id}")
def delete_vendor(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    vendor = db.query(models.Vendor).filter(models.Vendor.id == id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    db.delete(vendor)
    db.commit()
    return {"status": "success"}
"""

with open(r"backend\app\models.py", "a") as f:
    f.write("\n" + model_code + "\n")
print("Added Vendor model")

with open(r"backend\app\routers\ceo_portal.py", "a") as f:
    f.write("\n" + routers_code + "\n")
print("Added Vendor APIs")
