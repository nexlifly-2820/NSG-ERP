import sqlite3

db_path = "backend/sql_app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS vault_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    sign_status VARCHAR DEFAULT 'Pending',
    file_url VARCHAR NOT NULL,
    file_hash VARCHAR,
    parties VARCHAR,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

conn.commit()
conn.close()
print("Vault Documents table created successfully.")
