import sqlite3
import json

schemas = {
    "IT": [
        {"name": "prUrl", "type": "url", "label": "PR Link"},
        {"name": "sp", "type": "number", "label": "Story Points"},
        {"name": "sprint", "type": "text", "label": "Sprint"}
    ],
    "Sales": [
        {"name": "client_phone", "type": "text", "label": "Client Phone"},
        {"name": "deal_value", "type": "number", "label": "Deal Value"},
        {"name": "follow_up_date", "type": "date", "label": "Follow Up Date"}
    ],
    "Marketing": [
        {"name": "campaign_link", "type": "url", "label": "Campaign Asset Link"},
        {"name": "target_audience", "type": "text", "label": "Target Audience"}
    ]
}

conn = sqlite3.connect('sql_app.db')
cursor = conn.cursor()
try:
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS department_schemas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department VARCHAR NOT NULL UNIQUE,
        schema_json TEXT NOT NULL
    )
    """)
    
    for dept, schema in schemas.items():
        cursor.execute(
            "INSERT OR IGNORE INTO department_schemas (department, schema_json) VALUES (?, ?)",
            (dept, json.dumps(schema))
        )
    
    conn.commit()
    print("Migration successful: added department_schemas table and seeded data.")
except Exception as e:
    print(f"Migration error: {e}")
finally:
    conn.close()
