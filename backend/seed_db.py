import sqlite3
import datetime

db_path = r"c:\Users\DELL\Desktop\NSG-ERP\backend\sql_app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Add extra users to make headcount realistic
users_to_add = [
    (5, 'Amit Sharma', 'amit@nsgtech.com', '$2b$12$qpQGhqQe1gdNagfFKUIYg.3WfIGzV3slSobXb2oni/mDuMLl/F60i', 'employee', 'Sales', 'active', 'NSG-0105', 'Sales Representative'),
    (6, 'Priya Patel', 'priya@nsgtech.com', '$2b$12$qpQGhqQe1gdNagfFKUIYg.3WfIGzV3slSobXb2oni/mDuMLl/F60i', 'employee', 'Engineering', 'active', 'NSG-0106', 'Software Architect'),
    (7, 'Rahul Roy', 'rahul@nsgtech.com', '$2b$12$qpQGhqQe1gdNagfFKUIYg.3WfIGzV3slSobXb2oni/mDuMLl/F60i', 'employee', 'Marketing', 'active', 'NSG-0107', 'SEO Specialist')
]
for u in users_to_add:
    cursor.execute("""
        INSERT OR IGNORE INTO users 
        (id, name, email, hashed_password, role, department, status, emp_id, designation) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, u)

# 2. Add escalations
# (id, user_id, title, task_link, submitted_at, severity, ceo_viewed, resolved, dependencies, description)
now_str = datetime.datetime.now().isoformat()
t_15m = (datetime.datetime.now() - datetime.timedelta(minutes=15)).isoformat()
t_1h = (datetime.datetime.now() - datetime.timedelta(hours=1)).isoformat()
t_3h = (datetime.datetime.now() - datetime.timedelta(hours=3)).isoformat()

escalations_to_add = [
    (1, 2, 'Payroll processing blocked by HR maker approval timeout.', '#', t_15m, 'CRITICAL', 0, 0, 'Payroll', 'Maker signature deadline exceeded.'),
    (2, 3, 'Data Center Upgrade exceeded budget by 12%.', '#', t_1h, 'HIGH', 0, 0, 'Projects', 'Upgrade budget mismatch on servers.'),
    (3, 5, 'Sales GPS compliance dropped below 80%.', '#', t_3h, 'MEDIUM', 0, 0, 'Attendance', 'Compliance tracking gaps.')
]
for e in escalations_to_add:
    cursor.execute("""
        INSERT OR IGNORE INTO escalations 
        (id, user_id, title, task_link, submitted_at, severity, ceo_viewed, resolved, dependencies, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, e)

# 3. Add leave requests
# (id, user_id, leave_type, from_date, to_date, days, reason, status)
leaves_to_add = [
    (1, 4, 'CL', '2026-06-10', '2026-06-13', 3.0, 'Family function', 'tl_approved'),
    (2, 5, 'SL', '2026-06-15', '2026-06-17', 2.0, 'Medical checkup', 'tl_approved')
]
for l in leaves_to_add:
    cursor.execute("""
        INSERT OR IGNORE INTO leave_requests (id, user_id, leave_type, from_date, to_date, days, reason, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, l)

# 4. Add expense claims
# (id, user_id, claim_date, amount, category, status)
expenses_to_add = [
    (1, 6, '2026-06-05', 15400.0, 'Travel', 'pending'),
    (2, 3, '2026-06-04', 8900.0, 'Client Entertainment', 'pending')
]
for ex in expenses_to_add:
    cursor.execute("""
        INSERT OR IGNORE INTO expense_claims (id, user_id, claim_date, amount, category, status) 
        VALUES (?, ?, ?, ?, ?, ?)
    """, ex)

# 5. Add payroll runs
# (id, month, year, status, maker_id, maker_signed_at)
payroll_to_add = [
    (1, 5, 2026, 'maker_signed', 'Sophia Reed', t_1h)
]
for p in payroll_to_add:
    cursor.execute("""
        INSERT OR IGNORE INTO payroll_runs (id, month, year, status, maker_id, maker_signed_at) 
        VALUES (?, ?, ?, ?, ?, ?)
    """, p)

# 6. Add loans
# (id, user_id, loan_amount, emi_amount, tenure, outstanding_balance, status)
loans_to_add = [
    (1, 4, 150000.0, 15000.0, 10, 150000.0, 'active')
]
for lo in loans_to_add:
    cursor.execute("""
        INSERT OR IGNORE INTO loans (id, user_id, loan_amount, emi_amount, tenure, outstanding_balance, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, lo)

# 7. Add tasks to calculate active projects count
tasks_to_add = [
    (1, 4, 'NSG-ERP Core', 'Sprint 14', 'Review backend routes', 'Reviewing routes', 'high', 'pending', 3, '2026-06-10'),
    (2, 6, 'Marketing Website', 'Sprint 14', 'Landing page UI', 'Redesigning page', 'medium', 'pending', 5, '2026-06-12'),
    (3, 7, 'Mobile App', 'Sprint 14', 'Push notifications integration', 'Integrating iOS push', 'high', 'pending', 8, '2026-06-15')
]
for t in tasks_to_add:
    cursor.execute("""
        INSERT OR IGNORE INTO tasks 
        (id, user_id, project, sprint, title, description, priority, status, sp, due) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, t)

# 8. Add attendance records to display on heatmap with default values populated
depts = ["Sales", "Engineering", "Marketing", "HR", "Finance"]
import random
random.seed(42)

cursor.execute("DELETE FROM attendance") # Clean slate for attendance
att_id = 1
for dept in depts:
    cursor.execute("SELECT id FROM users WHERE department = ?", (dept,))
    user_ids = [r[0] for r in cursor.fetchall()]
    if not user_ids:
        user_ids = [4, 5, 6, 7]
        
    for day_offset in range(14):
        att_date = (datetime.date(2026, 5, 24) + datetime.timedelta(days=day_offset))
        for uid in user_ids:
            status_choice = random.choices(["present", "late", "absent"], weights=[0.85, 0.10, 0.05])[0]
            is_late_val = 1 if status_choice == "late" else 0
            exception_flag_val = "absent" if status_choice == "absent" else "none"
            
            cursor.execute("""
                INSERT INTO attendance 
                (id, user_id, date, status, clock_in, clock_out, work_mode, is_late, exception_flag, total_hours)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                att_id,
                uid,
                att_date.isoformat(),
                status_choice,
                (datetime.datetime.combine(att_date, datetime.time(9, 0))).isoformat() if status_choice != "absent" else None,
                (datetime.datetime.combine(att_date, datetime.time(18, 0))).isoformat() if status_choice != "absent" else None,
                "office",
                is_late_val,
                exception_flag_val,
                9.0 if status_choice != "absent" else None
            ))
            att_id += 1

conn.commit()
print("Database successfully seeded with realistic interactive data (corrected default columns)!")
conn.close()
