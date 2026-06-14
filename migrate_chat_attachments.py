import sqlite3

conn = sqlite3.connect('backend/sql_app.db')
c = conn.cursor()

try:
    c.execute("ALTER TABLE chat_messages ADD COLUMN attachment_url TEXT")
except Exception as e:
    print(f"Error adding attachment_url: {e}")

try:
    c.execute("ALTER TABLE chat_messages ADD COLUMN attachment_type TEXT")
except Exception as e:
    print(f"Error adding attachment_type: {e}")

conn.commit()
conn.close()
print("Migration completed.")
