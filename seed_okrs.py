import sqlite3
import datetime

db_path = "backend/sql_app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Insert Strategic Objectives
objectives = [
    (1, "Dominate Enterprise Software Market", "On Track", 65, "CEO Office", "Q2", "2026", datetime.datetime.now()),
    (2, "Achieve Operational Excellence", "At Risk", 35, "COO Office", "Q2", "2026", datetime.datetime.now()),
    (3, "Expand into European Markets", "Off Track", 10, "CSO Office", "Q2", "2026", datetime.datetime.now())
]

cursor.executemany("""
INSERT INTO objectives (id, title, status, progress, owner, quarter, year, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", objectives)

# Insert Key Results
key_results = [
    # For Objective 1
    (1, 1, "Increase Enterprise Sales by $5M", 5000000, 3200000, "$", "SALES-SPRINT-01"),
    (2, 1, "Acquire 50 new Enterprise Clients", 50, 35, "Clients", "MKT-SPRINT-02"),
    # For Objective 2
    (3, 2, "Reduce Cloud Infrastructure Costs by 20%", 20, 5, "%", "IT-SPRINT-04"),
    (4, 2, "Improve Customer Support SLA to 99.9%", 99, 95, "%", "SUP-SPRINT-01"),
    # For Objective 3
    (5, 3, "Establish HQ in London", 100, 10, "%", "EXP-SPRINT-01"),
    (6, 3, "Hire 20 Regional Sales Directors", 20, 2, "People", "HR-SPRINT-03")
]

cursor.executemany("""
INSERT INTO key_results (id, objective_id, title, target, current, unit, sprint_link)
VALUES (?, ?, ?, ?, ?, ?, ?)
""", key_results)

conn.commit()
conn.close()
print("Successfully seeded OKRs!")
