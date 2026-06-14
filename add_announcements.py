import os

code_to_add = """
class AnnouncementResponse(BaseModel):
    id: int
    title: str
    body: str
    priority: str
    audience: str
    author: str
    date: str 

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
"""

files_to_patch = [
    r"backend\app\routers\hr_portal.py",
    r"backend\app\routers\team_lead.py"
]

for file_path in files_to_patch:
    if os.path.exists(file_path):
        with open(file_path, "a") as f:
            f.write("\n" + code_to_add + "\n")
        print(f"Patched {file_path}")
    else:
        print(f"File not found: {file_path}")
