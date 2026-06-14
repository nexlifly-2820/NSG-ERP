import sqlite3
import uuid

conn = sqlite3.connect(r'backend\sql_app.db')
cursor = conn.cursor()

try:
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR PRIMARY KEY,
        user_id INTEGER NOT NULL,
        assetTag VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        serialNumber VARCHAR,
        issueDate DATE,
        condition VARCHAR,
        returnStatus VARCHAR DEFAULT 'Pending',
        signedDate DATE,
        signature_data TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    print("Created assets table")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")

try:
    cursor.execute("SELECT COUNT(*) FROM assets")
    count = cursor.fetchone()[0]
    if count == 0:
        cursor.execute("SELECT id FROM users WHERE role IN ('employee', 'tl')")
        users = cursor.fetchall()
        
        for user_id, in users:
            # Add a laptop and access card for each user
            asset_id_1 = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO assets (id, user_id, assetTag, type, name, serialNumber, issueDate, condition, returnStatus) VALUES (?, ?, ?, ?, ?, ?, date('now', '-1 year'), ?, ?)",
                (asset_id_1, user_id, f"LAP-{user_id}001", "Laptop", "Dell XPS 15", f"SN-DL-{user_id}111", "Good", "Pending")
            )
            
            asset_id_2 = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO assets (id, user_id, assetTag, type, name, serialNumber, issueDate, condition, returnStatus) VALUES (?, ?, ?, ?, ?, ?, date('now', '-6 months'), ?, ?)",
                (asset_id_2, user_id, f"ACC-{user_id}002", "Access Card", "Building Access Pass", f"SN-AC-{user_id}222", "Good", "Pending")
            )
            
        conn.commit()
        print(f"Seeded assets for {len(users)} users.")
except Exception as e:
    print(f"Seeding error: {e}")

conn.close()
print("Migration completed.")
