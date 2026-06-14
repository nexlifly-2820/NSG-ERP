import sqlite3

db_path = "backend/sql_app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'Active',
    annual_spend VARCHAR NOT NULL,
    renewal_date VARCHAR,
    risk_level VARCHAR DEFAULT 'Low',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)
""")

# Insert initial DEFAULT_VENDORS
initial_vendors = [
    ('V-100', 'AWS Cloud India', 'Software/Cloud', 'Active', '₹14,50,000', '2026-10-15', 'Low'),
    ('V-101', 'Salesforce Enterprise', 'Software/SaaS', 'Active', '₹8,20,000', '2026-12-01', 'Low'),
    ('V-102', 'WeWork Solutions', 'Real Estate', 'Pending Review', '₹22,00,000', '2026-07-01', 'Medium'),
    ('V-103', 'Dell Hardware Partners', 'Hardware/IT', 'Active', '₹5,40,000', 'N/A', 'Low'),
    ('V-104', 'KPMG Auditing Services', 'Legal/Finance', 'Expired', '₹3,00,000', '2026-04-15', 'High')
]

for v in initial_vendors:
    try:
        cursor.execute("""
        INSERT INTO vendors (vendor_id, name, category, status, annual_spend, renewal_date, risk_level)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, v)
    except sqlite3.IntegrityError:
        pass # Already exists

conn.commit()
conn.close()
print("Vendors table created and populated successfully.")
