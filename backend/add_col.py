import sqlite3

try:
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()
    cursor.execute('ALTER TABLE users ADD COLUMN plain_password VARCHAR;')
    conn.commit()
    print("Column added successfully.")
except sqlite3.OperationalError as e:
    print(f"Error (maybe column already exists): {e}")
finally:
    conn.close()
