import sqlite3

conn = sqlite3.connect(r'backend\sql_app.db')
cursor = conn.cursor()

try:
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name VARCHAR NOT NULL,
        due_date VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        tasks_count INTEGER DEFAULT 0,
        FOREIGN KEY(project_id) REFERENCES projects(id)
    )
    """)
    print("Created milestones table")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")

# Seed some mock data for existing projects so timeline view isn't empty initially.
try:
    cursor.execute("SELECT COUNT(*) FROM milestones")
    count = cursor.fetchone()[0]
    if count == 0:
        cursor.execute("SELECT id FROM projects")
        projects = cursor.fetchall()
        
        milestones_data = [
            ("Project Kickoff & Requirements", "2026-05-01", "completed", 100, 12),
            ("Alpha Release (Internal)", "2026-06-15", "in-progress", 65, 34),
            ("Beta Release (Public)", "2026-07-15", "pending", 0, 45),
            ("Final Production Rollout", "2026-08-01", "pending", 0, 20),
        ]
        
        for p_id in projects:
            for m in milestones_data:
                cursor.execute(
                    "INSERT INTO milestones (project_id, name, due_date, status, progress, tasks_count) VALUES (?, ?, ?, ?, ?, ?)",
                    (p_id[0], m[0], m[1], m[2], m[3], m[4])
                )
        conn.commit()
        print(f"Seeded milestones for {len(projects)} projects.")
except Exception as e:
    print(f"Seeding error: {e}")

conn.close()
print("Migration completed.")
