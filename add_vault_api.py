import os

model_code = """
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

routers_code = """
from fastapi import File, UploadFile, Form
import shutil
import hashlib

class VaultDocResponse(BaseModel):
    id: int
    doc_id: str
    name: str
    type: str
    parties: Optional[str] = None
    file_url: str
    file_hash: str
    sign_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/vault", response_model=List[VaultDocResponse])
def get_vault_docs(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    return db.query(models.VaultDocument).all()

@router.post("/vault/upload")
def upload_vault_doc(
    doc_id: str = Form(...),
    name: str = Form(...),
    type: str = Form(...),
    parties: str = Form(""),
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    verify_ceo_role(current_user)
    
    # Check if doc_id already exists
    if db.query(models.VaultDocument).filter(models.VaultDocument.doc_id == doc_id).first():
        raise HTTPException(status_code=400, detail="Document ID already exists")

    # Save physical file
    upload_dir = os.path.join("uploads", "vault")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{doc_id}{file_ext}"
    file_path = os.path.join(upload_dir, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Calculate SHA-256 hash for cryptographic security
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    
    file_hash = sha256_hash.hexdigest()
    file_url = f"/uploads/vault/{safe_filename}"
    
    new_doc = models.VaultDocument(
        doc_id=doc_id,
        name=name,
        type=type,
        parties=parties,
        file_url=file_url,
        file_hash=file_hash,
        sign_status="Pending"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Needs to return a standard structure that Pydantic models can parse
    # Or just return a dict
    return {"status": "success", "id": new_doc.id}

@router.put("/vault/{id}/sign")
def sign_vault_doc(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    doc = db.query(models.VaultDocument).filter(models.VaultDocument.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc.sign_status = "Signed"
    db.commit()
    return {"status": "success"}
"""

with open(r"backend\app\models.py", "a") as f:
    f.write("\n" + model_code + "\n")
print("Added Vault model")

with open(r"backend\app\routers\ceo_portal.py", "a") as f:
    f.write("\n" + routers_code + "\n")
print("Added Vault APIs")

# Also ensure static files are mounted for uploads in main.py
# if not already mounted.
"""
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
"""
