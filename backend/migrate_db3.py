import sqlite3

conn = sqlite3.connect('sql_app.db')
cursor = conn.cursor()

def add_column(table, column, definition):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        print(f"Added {column} to {table}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {column} already exists in {table}")
        else:
            print(f"Error adding {column} to {table}: {e}")

add_column("payslips", "lop", "FLOAT DEFAULT 0.0")

conn.commit()
conn.close()
print("Done migrating columns.")
