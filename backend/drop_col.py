
from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE leave_balances DROP COLUMN "Paternity"'))
        conn.commit()
        print('Column dropped')
    except Exception as e:
        print(e)

