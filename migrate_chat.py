import sqlite3

conn = sqlite3.connect(r'backend\sql_app.db')
cursor = conn.cursor()

columns_to_add = [
    ("parent_id", "INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE"),
    ("is_pinned", "BOOLEAN DEFAULT 0"),
    ("mentions", "TEXT"),
    ("attachment_url", "TEXT"),
    ("attachment_type", "TEXT"),
    ("seen_by", "TEXT"),
    ("delivered_to", "TEXT"),
    ("reactions", "TEXT"),
    ("deleted_at", "DATETIME"),
    ("is_edited", "BOOLEAN DEFAULT 0")
]

for col_name, col_type in columns_to_add:
    try:
        cursor.execute(f"ALTER TABLE chat_messages ADD COLUMN {col_name} {col_type}")
        print(f"Added {col_name}")
    except sqlite3.OperationalError as e:
        print(f"Skipped {col_name}: {e}")

conn.commit()
conn.close()
print("Migration completed.")
