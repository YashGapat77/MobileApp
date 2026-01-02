import sqlite3
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, "dailymatch.db")

conn = sqlite3.connect(DB_NAME)
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute("SELECT id, email, first_name FROM users ORDER BY id DESC LIMIT 10")
rows = c.fetchall()
print("--- Recent Users ---")
for r in rows:
    print(f"ID: {r['id']}, Email: {r['email']}, Name: {r['first_name']}")
conn.close()
