import sqlite3
import datetime

db_path = r"c:\Users\DELL\Desktop\NSG-ERP\backend\sql_app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Add extra users to make headcount realistic
users_to_add = [
    (5, 'Amit Sharma', 'amit@hnms.com', '$2b$12$qpQGhqQe1gdNagfFKUIYg.3WfIGzV3slSobXb2oni/mDuMLl/F60i', 'employee', 'Sales', 'active', 'NSG-0105', 'Sales Representative'),
    (6, 'Priya Patel', 'priya@hnms.com', '$2b$12$qpQGhqQe1gdNagfFKUIYg.3WfIGzV3slSobXb2oni/mDuMLl/F60i', 'employee', 'Engineering', 'active', 'NSG-0106', 'Software Architect'),
    (7, 'Rahul Roy', 'rahul@hnms.com', '$2b$12$qpQGhqQe1gdNagfFKUIYg.3WfIGzV3slSobXb2oni/mDuMLl/F60i', 'employee', 'Marketing', 'active', 'NSG-0107', 'SEO Specialist')
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

# 9. Create and seed objectives and key_results
cursor.execute("""
CREATE TABLE IF NOT EXISTS objectives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'On Track',
    progress INTEGER DEFAULT 0,
    owner VARCHAR NOT NULL,
    quarter VARCHAR DEFAULT 'Q2',
    year VARCHAR DEFAULT '2026',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS key_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objective_id INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    target INTEGER NOT NULL,
    current INTEGER DEFAULT 0,
    unit VARCHAR NOT NULL,
    sprint_link VARCHAR,
    FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE
)
""")

cursor.execute("SELECT COUNT(*) FROM objectives")
if cursor.fetchone()[0] == 0:
    print("Seeding corporate OKRs...")
    okrs_data = [
        (1, 'Achieve Market Leadership in Enterprise Segment', 'On Track', 75, 'Sales & Marketing', 'Q2', '2026'),
        (2, 'Transform Digital Operational Excellence', 'At Risk', 42, 'IT Dept', 'Q2', '2026'),
        (3, 'Global Talent Acquisition Drive', 'Off Track', 20, 'HR Dept', 'Q3', '2026'),
        (4, 'Launch AI-Powered Core Product', 'On Track', 60, 'Product', 'Q2', '2026')
    ]
    for o in okrs_data:
        cursor.execute("""
            INSERT INTO objectives (id, title, status, progress, owner, quarter, year)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, o)
        
    krs_data = [
        (11, 1, 'Increase Enterprise ARR by 40%', 40, 32, '%', 'Sprint 24: Enterprise Expansion'),
        (12, 1, 'Onboard 5 Fortune 500 clients', 5, 4, 'clients', None),
        (21, 2, 'Migrate legacy on-prem to Cloud', 100, 40, '%', 'Sprint 22: AWS Migration'),
        (22, 2, 'Reduce infra costs by 25%', 25, 10, '%', None),
        (31, 3, 'Hire 50 Senior Engineers', 50, 10, 'hires', 'Sprint 28: EU Hiring'),
        (32, 3, 'Launch Employer Branding Campaign', 100, 20, '%', None),
        (41, 4, 'Complete AI Beta Testing', 100, 80, '%', None),
        (42, 4, 'Train 500 users on new features', 500, 300, 'users', None)
    ]
    for k in krs_data:
        cursor.execute("""
            INSERT INTO key_results (id, objective_id, title, target, current, unit, sprint_link)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, k)

# 10. Create and seed chat_channels and chat_messages
cursor.execute("""
CREATE TABLE IF NOT EXISTS chat_channels (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    label VARCHAR,
    type VARCHAR NOT NULL
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id VARCHAR NOT NULL,
    sender VARCHAR NOT NULL,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE
)
""")

cursor.execute("SELECT COUNT(*) FROM chat_channels")
if cursor.fetchone()[0] == 0:
    print("Seeding chat channels...")
    channels_data = [
        ('general-channel', '#general-channel', 'Company General Room', 'staff'),
        ('team-room', '#team-room', 'Engineering Team Room', 'staff'),
        ('grievance-room', '#grievance-room', 'HR Grievance (Private)', 'grievance'),
        ('ceo-channel', '#ceo-channel', 'CEO Suite Room', 'management'),
        ('tl-channel', '#tl-channel', 'Team Lead Forum', 'management')
    ]
    for c in channels_data:
        cursor.execute("INSERT OR IGNORE INTO chat_channels (id, name, label, type) VALUES (?, ?, ?, ?)", c)
        
    messages_data = [
        ('general-channel', 'CEO (John Doe)', 'Welcome to the unified NSG-ERP communications channel!', now_str),
        ('team-room', 'Marcus Vance', 'Hey team, morning! Please drop your standup items here. Also, let\'s aim to deploy the new build by 4 PM.', now_str),
        ('team-room', 'Alex Wong', 'Morning! Working on the payment gate validation fixes. PR is ready for review: #412.', now_str),
        ('team-room', 'Sarah Jenkins', 'Morning! I\'m wrapping up the Asset Requests validation and mobile tab changes. I\'ll review your PR, Alex, right after.', now_str),
        ('grievance-room', 'Sophia Reed (HR Officer)', 'Hello Sarah, welcome to your secure grievance portal. Anything shared here remains private. How can I assist you today?', now_str),
        ('ceo-channel', 'CEO (John Doe)', "Sarah, let's audit the monthly payroll maker file before release.", now_str),
        ('tl-channel', 'TL (Michael Vance)', 'Are the Shift A attendance exceptions fully resolved?', now_str)
    ]
    for m in messages_data:
        cursor.execute("INSERT OR IGNORE INTO chat_messages (channel_id, sender, text, timestamp) VALUES (?, ?, ?, ?)", m)

# 11. Seed candidates if table is empty
cursor.execute("""
CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    phone VARCHAR,
    role VARCHAR NOT NULL,
    source VARCHAR,
    stage VARCHAR DEFAULT 'applied',
    resume_url VARCHAR,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

cursor.execute("SELECT COUNT(*) FROM candidates")
if cursor.fetchone()[0] == 0:
    print("Seeding candidates...")
    candidates_data = [
        (1, 'Vikram Malhotra', 'vikram.m@gmail.com', '+91 98765 43210', 'Senior React Developer', 'LinkedIn', 'interview', '#', now_str),
        (2, 'Ananya Sharma', 'ananya.s@yahoo.com', '+91 87654 32109', 'Product Manager', 'Referral', 'applied', '#', now_str),
        (3, 'Rohan Deshmukh', 'rohan.d@gmail.com', '+91 76543 21098', 'Junior UI/UX Designer', 'Job Board', 'screening', '#', now_str),
        (4, 'Pooja Iyer', 'pooja.i@outlook.com', '+91 91234 56789', 'QA Automation Engineer', 'Direct', 'offer', '#', now_str),
        (5, 'Amit Verma', 'amit.v@hotmail.com', '+91 92345 67890', 'DevOps Engineer', 'LinkedIn', 'joined', '#', now_str)
    ]
    for c in candidates_data:
        cursor.execute("""
            INSERT OR IGNORE INTO candidates (id, name, email, phone, role, source, stage, resume_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, c)

conn.commit()
print("Database successfully seeded with realistic interactive data (corrected default columns, strategy OKRs, chat data, and candidates)!")
conn.close()

