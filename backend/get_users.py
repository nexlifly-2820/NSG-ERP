import sqlite3
conn = sqlite3.connect('sql_app.db')
c = conn.cursor()
c.execute("SELECT name, email, role, hashed_password FROM users")
print("All users:")
for row in c.fetchall():
    print(row)
