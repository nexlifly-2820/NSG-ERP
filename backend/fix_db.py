import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models

def fix_timesheets():
    db = SessionLocal()
    try:
        # Find the HR user (hemanth)
        hr_user = db.query(models.User).filter(models.User.email.like('%hemanth%')).first()
        if not hr_user:
            hr_user = db.query(models.User).filter(models.User.role == 'hr').first()
            
        hr_id = hr_user.id
        print(f"Found HR User ID: {hr_id}")
        
        timesheets = db.query(models.DailyTimesheet).filter(
            models.DailyTimesheet.status == 'approved'
        ).all()
        
        count = 0
        for ts in timesheets:
            if ts.manager_id is None or ts.manager_id == 0:
                ts.manager_id = hr_id
                count += 1
                
        db.commit()
        print(f"Successfully updated {count} timesheets.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_timesheets()
