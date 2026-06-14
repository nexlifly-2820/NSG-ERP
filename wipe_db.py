import sys
import os

# Ensure backend directory is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.database import SessionLocal
from app import models

def wipe_database():
    db = SessionLocal()
    try:
        # 1. Users & Profiles (keep CEO)
        deleted_users = db.query(models.User).filter(models.User.role != 'ceo').delete()
        print(f"Deleted {deleted_users} non-CEO users.")
        
        # 2. Company Operations
        print(f"Deleted {db.query(models.Announcement).delete()} Announcements.")
        print(f"Deleted {db.query(models.Project).delete()} Projects.")
        print(f"Deleted {db.query(models.Escalation).delete()} Escalations.")
        
        # 3. HR & Payroll
        print(f"Deleted {db.query(models.Attendance).delete()} Attendance records.")
        print(f"Deleted {db.query(models.LeaveRequest).delete()} Leave Requests.")
        print(f"Deleted {db.query(models.LeaveBalance).delete()} Leave Balances.")
        print(f"Deleted {db.query(models.PayrollRun).delete()} Payroll Runs.")
        print(f"Deleted {db.query(models.Payslip).delete()} Payslips.")
        print(f"Deleted {db.query(models.Resignation).delete()} Resignations.")
        
        # 4. Finance
        print(f"Deleted {db.query(models.ExpenseClaim).delete()} Expense Claims.")
        print(f"Deleted {db.query(models.Loan).delete()} Loans.")
        
        # 5. OKRs & Strategy
        print(f"Deleted {db.query(models.KeyResult).delete()} Key Results.")
        print(f"Deleted {db.query(models.Objective).delete()} Objectives.")
        
        # 6. Communication & Logs
        print(f"Deleted {db.query(models.Notification).delete()} Notifications.")
        print(f"Deleted {db.query(models.AuditLog).delete()} Audit Logs.")
        print(f"Deleted {db.query(models.SystemSetting).delete()} System Settings.")
        
        db.commit()
        print("\nSUCCESS: All fake data wiped. Production-ready clean state achieved.")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    wipe_database()
