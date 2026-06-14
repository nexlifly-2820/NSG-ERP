import sqlite3

def upgrade_db():
    conn = sqlite3.connect('backend/sql_app.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN last_active DATETIME;")
        print("Added last_active to users.")
    except Exception as e:
        print(f"Column last_active might already exist: {e}")

    try:
        cursor.execute("ALTER TABLE chat_messages ADD COLUMN delivered_to TEXT;")
        print("Added delivered_to to chat_messages.")
    except Exception as e:
        print(f"Column delivered_to might already exist: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade_db()
