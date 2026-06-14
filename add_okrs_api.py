import os

code_to_add = """
class KeyResultCreate(BaseModel):
    title: str
    target: int
    unit: str
    sprintLink: Optional[str] = None

class ObjectiveCreate(BaseModel):
    title: str
    owner: str
    quarter: str
    year: str
    krs: List[KeyResultCreate]

@router.post("/okrs")
def create_okr(req: ObjectiveCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    new_obj = models.Objective(
        title=req.title,
        status="On Track",
        progress=0,
        owner=req.owner,
        quarter=req.quarter,
        year=req.year
    )
    db.add(new_obj)
    db.commit()
    db.refresh(new_obj)
    
    for kr in req.krs:
        new_kr = models.KeyResult(
            objective_id=new_obj.id,
            title=kr.title,
            current=0,
            target=kr.target,
            unit=kr.unit,
            sprintLink=kr.sprintLink
        )
        db.add(new_kr)
    
    db.commit()
    return {"status": "success", "id": new_obj.id, "message": "OKR created"}

@router.delete("/okrs/{id}")
def delete_okr(id: int, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(database.get_db)):
    verify_ceo_role(current_user)
    obj = db.query(models.Objective).filter(models.Objective.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    db.query(models.KeyResult).filter(models.KeyResult.objective_id == id).delete()
    db.delete(obj)
    db.commit()
    return {"status": "success", "message": "OKR deleted"}
"""

file_path = r"backend\app\routers\ceo_portal.py"

if os.path.exists(file_path):
    with open(file_path, "a") as f:
        f.write("\n" + code_to_add + "\n")
    print(f"Patched {file_path}")
else:
    print(f"File not found: {file_path}")
