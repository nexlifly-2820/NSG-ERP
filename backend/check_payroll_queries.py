from app.database import SessionLocal
from app import models

db = SessionLocal()
try:
    runs = db.query(models.PayrollRun).all()
    print('PayrollRun OK')
except Exception as e:
    print('PayrollRun Error:', type(e).__name__, e)

try:
    slips = db.query(models.Payslip).all()
    print('Payslip OK')
except Exception as e:
    print('Payslip Error:', type(e).__name__, e)

try:
    users = db.query(models.User).all()
    print('User OK')
except Exception as e:
    print('User Error:', type(e).__name__, e)
