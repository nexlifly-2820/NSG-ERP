import sqlite3

conn = sqlite3.connect(r'backend\sql_app.db')
cursor = conn.cursor()

try:
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS employee_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        skill_name VARCHAR NOT NULL,
        proficiency_level INTEGER DEFAULT 3,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    print("Created employee_skills table")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")

# Seed some mock data for existing employees just so the skill matrix isn't empty initially.
try:
    # Check if we already have skills
    cursor.execute("SELECT COUNT(*) FROM employee_skills")
    count = cursor.fetchone()[0]
    if count == 0:
        cursor.execute("SELECT id, name FROM users WHERE role IN ('employee', 'tl')")
        users = cursor.fetchall()
        
        default_skills = ["React", "Node.js", "AWS", "Python", "SQL"]
        import random
        
        for user_id, name in users:
            for skill in default_skills:
                # Random proficiency between 2 and 5 for realism
                prof = random.randint(2, 5)
                cursor.execute(
                    "INSERT INTO employee_skills (user_id, skill_name, proficiency_level) VALUES (?, ?, ?)",
                    (user_id, skill, prof)
                )
        conn.commit()
        print(f"Seeded skills for {len(users)} users.")
except Exception as e:
    print(f"Seeding error: {e}")

conn.close()
print("Migration completed.")
