from app.database import SessionLocal
from app import models

db = SessionLocal()
try:
    db.query(models.PayrollRun).all()
    print('PayrollRun OK')
except Exception as e:
    print('PayrollRun Error:', type(e).__name__, e)

try:
    db.query(models.APInvoice).all()
    print('APInvoice OK')
except Exception as e:
    print('APInvoice Error:', type(e).__name__, e)

try:
    db.query(models.ExpenseClaim).all()
    print('ExpenseClaim OK')
except Exception as e:
    print('ExpenseClaim Error:', type(e).__name__, e)
