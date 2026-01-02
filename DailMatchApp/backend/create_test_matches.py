import sqlite3
import os
import datetime
import bcrypt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, "dailymatch.db")

def create_matches():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    demo_id = 999
    # Use bcrypt to match backend auth
    pw_hash = bcrypt.hashpw("123456".encode('utf-8'), bcrypt.gensalt())
    
    # 1. Check if user exists
    cursor.execute("SELECT id FROM users WHERE id=?", (demo_id,))
    if cursor.fetchone():
        print("Updating Demo User Password (ID: 999)...")
        cursor.execute("UPDATE users SET password=? WHERE id=?", (pw_hash, demo_id))
    else:
        print("Creating Demo User (ID: 999)...")
        cursor.execute('''
            INSERT INTO users (id, email, username, password, first_name, last_name, gender, dob)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (demo_id, "demo@test.com", "demo", pw_hash, "Demo", "User", "male", "1995-01-01"))
        
        # Profile
        cursor.execute('''
            INSERT INTO user_profiles (user_id, bio, occupation, education, height, location, photos, prompts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (demo_id, "Just testing things out! 🧪", "Tester", "QA Univ", "5'10\"", "Test City", "[]", "[]"))
    
    conn.commit()

    # 2. Match Demo User with Everyone
    target_ids = [10, 11, 12, 13, 14, 15, 101, 102] 
    
    print(f"Forcing matches for Demo User ({demo_id}) with seeded users...")
    
    count = 0
    for other_id in target_ids:
        # Check if match exists
        cursor.execute("SELECT id FROM matches WHERE (user1_id=? AND user2_id=?) OR (user1_id=? AND user2_id=?)", 
                      (demo_id, other_id, other_id, demo_id))
        
        if not cursor.fetchone():
            try:
                # Create Match (using created_at)
                cursor.execute("INSERT INTO matches (user1_id, user2_id, created_at) VALUES (?, ?, datetime('now'))",
                              (demo_id, other_id))
                match_id = cursor.lastrowid
                
                # Mutual Likes
                cursor.execute("INSERT OR IGNORE INTO likes (user_id, target_id, action) VALUES (?, ?, 'like')", (demo_id, other_id))
                cursor.execute("INSERT OR IGNORE INTO likes (user_id, target_id, action) VALUES (?, ?, 'like')", (other_id, demo_id))
                
                # Fake Message (using sender_id, receiver_id, created_at)
                msg = f"Hey! I am User {other_id}. Nice to meet you!"
                cursor.execute("INSERT INTO messages (sender_id, receiver_id, text, created_at) VALUES (?, ?, ?, datetime('now'))",
                              (other_id, demo_id, msg))
                              
                count += 1
            except Exception as e:
                print(f"Error matching {demo_id}-{other_id}: {e}")
                    
    conn.commit()
    conn.close()
    print(f"✅ Created {count} new matches!")
    print("👉 Login with Email: demo@test.com | Pass: 123456")

if __name__ == '__main__':
    create_matches()
