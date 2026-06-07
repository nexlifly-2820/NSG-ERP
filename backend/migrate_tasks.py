import sqlite3

conn = sqlite3.connect('sql_app.db')
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE tasks ADD COLUMN custom_data TEXT;")
    conn.commit()
    print("Migration successful: added custom_data to tasks")
except Exception as e:
    print(f"Migration error: {e}")
finally:
    conn.close()
