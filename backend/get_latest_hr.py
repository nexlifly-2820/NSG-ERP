import sqlite3
conn = sqlite3.connect('sql_app.db')
c = conn.cursor()
c.execute("SELECT id, name, email, role, created_at, hashed_password FROM users WHERE role='hr' ORDER BY id DESC LIMIT 1")
print(c.fetchone())
conn.close()
