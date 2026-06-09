import sqlite3

conn = sqlite3.connect('sql_app.db')
c = conn.cursor()
c.execute("UPDATE users SET hashed_password='$2b$12$Vpkc3WE2oeiu3lzqsw8LsuYZHwT7iuG635/2nEQTlB8j05n0I3PY6' WHERE email='ceo@hnms.com'")
conn.commit()
conn.close()
print("Password updated successfully")
