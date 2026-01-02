import sqlite3
import os

# Use absolute path for database to avoid issues
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_NAME = os.path.join(BASE_DIR, "dailymatch.db")

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            gender TEXT,
            dob TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # User Profiles table (for extended info)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id INTEGER PRIMARY KEY,
            bio TEXT,
            occupation TEXT,
            education TEXT,
            height TEXT,
            location TEXT,
            photos TEXT, -- JSON string of photo URLs
            prompts TEXT, -- JSON string of prompts
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Likes/Swipes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            target_id INTEGER NOT NULL,
            action TEXT NOT NULL, -- 'like' or 'pass'
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, target_id)
        )
    ''')

    # Migration: Add comment column if not exists
    try:
        cursor.execute("ALTER TABLE likes ADD COLUMN comment TEXT")
    except Exception:
        pass


    # Matches table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user1_id INTEGER NOT NULL,
            user2_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user1_id, user2_id)
        )
    ''')

    # Messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read BOOLEAN DEFAULT 0
        )
    ''')

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_NAME}")

if __name__ == '__main__':
    init_db()
