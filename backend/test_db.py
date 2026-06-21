import sqlite3
from datetime import date

db_path = "c:/Users/karet/Desktop/NSG-ERP/NSG-ERP/backend/sql_app.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

today = str(date.today())
print(f"Today is: {today}")

cur.execute("SELECT user_id, date, clock_in, clock_out, status, work_mode FROM attendance WHERE date = ?", (today,))
rows = cur.fetchall()

print("Attendance records for today:")
for r in rows:
    print(r)

cur.execute("SELECT id, name, status FROM users")
users = cur.fetchall()
print("\nUsers:")
for u in users:
    print(u)
    
conn.close()
