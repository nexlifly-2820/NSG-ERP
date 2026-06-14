import sqlite3
conn = sqlite3.connect('sql_app.db')
cursor = conn.cursor()
cursor.execute("SELECT email, hashed_password FROM users WHERE email='ceo@hnms.com'")
print(cursor.fetchone())
conn.close()
