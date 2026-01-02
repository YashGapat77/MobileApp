import sqlite3
import json
import os
from werkzeug.security import generate_password_hash

# Define path to DB
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, "dailymatch.db")

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def seed_data():
    conn = get_db()
    cursor = conn.cursor()
    
    print("Cleaning up old data (Users 1-100)...")
    # Delete test users if they exist to avoid duplicate errors
    # We leave users > 100 alone (real users usually)
    cursor.execute("DELETE FROM user_profiles WHERE user_id <= 100")
    cursor.execute("DELETE FROM users WHERE id <= 100")
    cursor.execute("DELETE FROM likes WHERE user_id <= 100 OR target_id <= 100")
    cursor.execute("DELETE FROM matches WHERE user1_id <= 100 OR user2_id <= 100")
    conn.commit()

    # Define mock users
    users = [
        {
            "id": 10,
            "email": "sarah@example.com",
            "username": "sarah",
            "first_name": "Sarah",
            "last_name": "Miller",
            "gender": "female",
            "dob": "1998-05-15", # 25
            "profile": {
                "bio": "Love hiking and coffee ☕",
                "occupation": "Product Designer",
                "education": "Stanford University",
                "height": "5'6\"",
                "location": "San Francisco, CA",
                "photos": ["https://randomuser.me/api/portraits/women/1.jpg", "https://randomuser.me/api/portraits/women/2.jpg"],
                "prompts": [{"question": "My simple pleasures", "answer": "Sunday morning coffee"}]
            }
        },
        {
            "id": 11,
            "email": "emma@example.com",
            "username": "emma",
            "first_name": "Emma",
            "last_name": "Wilson",
            "gender": "female",
            "dob": "2000-08-20", # 23
            "profile": {
                "bio": "Foodie | Traveler | Dog lover 🐕",
                "occupation": "Marketing Manager",
                "education": "UCLA",
                "height": "5'5\"",
                "location": "Los Angeles, CA",
                "photos": ["https://randomuser.me/api/portraits/women/3.jpg", "https://randomuser.me/api/portraits/women/4.jpg"],
                "prompts": [{"question": "Green flags I look for", "answer": "Kindness and humor"}]
            }
        },
        {
            "id": 12,
            "email": "alex@example.com",
            "username": "alex",
            "first_name": "Alex",
            "last_name": "Johnson",
            "gender": "male",
            "dob": "1995-03-10", # 28
            "profile": {
                "bio": "Adventure seeker 🏔️ | Photographer 📸",
                "occupation": "Software Engineer",
                "education": "MIT",
                "height": "6'0\"",
                "location": "Seattle, WA",
                "photos": ["https://randomuser.me/api/portraits/men/1.jpg", "https://randomuser.me/api/portraits/men/2.jpg"],
                "prompts": [{"question": "A fun fact about me", "answer": "Climbed Mt. Rainier"}]
            }
        },
        {
            "id": 13,
            "email": "jordan@example.com",
            "username": "jordan",
            "first_name": "Jordan",
            "last_name": "Lee",
            "gender": "female",
            "dob": "1999-11-05", # 24
            "profile": {
                "bio": "Artist & Music Lover 🎨",
                "occupation": "Graphic Designer",
                "education": "RISD",
                "height": "5'7\"",
                "location": "Portland, OR",
                "photos": ["https://randomuser.me/api/portraits/women/40.jpg", "https://randomuser.me/api/portraits/women/42.jpg"],
                "prompts": [{"question": "My happy place", "answer": "Art museum"}]
            }
        },
        {
            "id": 14,
            "email": "mike@example.com",
            "username": "mike",
            "first_name": "Michael",
            "last_name": "Chen",
            "gender": "male",
            "dob": "1993-01-20", # 30
            "profile": {
                "bio": "Chef in the making 🍳",
                "occupation": "Sous Chef",
                "education": "Culinary Institute",
                "height": "5'10\"",
                "location": "Chicago, IL",
                "photos": ["https://randomuser.me/api/portraits/men/32.jpg", "https://randomuser.me/api/portraits/men/33.jpg"],
                "prompts": [{"question": "I'm convinced that", "answer": "Pineapple belongs on pizza"}]
            }
        },
        {
            "id": 15,
            "email": "priya@example.com",
            "username": "priya",
            "first_name": "Priya",
            "last_name": "Patel",
            "gender": "female",
            "dob": "1997-06-12", # 26
            "profile": {
                "bio": "Yoga instructor and wellness enthusiast 🧘‍♀️",
                "occupation": "Yoga Teacher",
                "education": "NYU",
                "height": "5'4\"",
                "location": "Austin, TX",
                "photos": ["https://randomuser.me/api/portraits/women/20.jpg", "https://randomuser.me/api/portraits/women/21.jpg"],
                "prompts": [{"question": "I take pride in", "answer": "My plant collection"}]
            }
        },
        {
            "id": 16,
            "email": "david@example.com",
            "username": "david",
            "first_name": "David",
            "last_name": "Kim",
            "gender": "male",
            "dob": "1996-09-30", # 27
            "profile": {
                "bio": "Tech enthusiast and gamer 🎮",
                "occupation": "Data Analyst",
                "education": "Georgia Tech",
                "height": "5'9\"",
                "location": "San Jose, CA",
                "photos": ["https://randomuser.me/api/portraits/men/45.jpg", "https://randomuser.me/api/portraits/men/46.jpg"],
                "prompts": [{"question": "Two truths and a lie", "answer": "I speak 3 languages"}]
            }
        },
        {
            "id": 17,
            "email": "lisa@example.com",
            "username": "lisa",
            "first_name": "Lisa",
            "last_name": "Wang",
            "gender": "female",
            "dob": "1994-04-20", # 29
            "profile": {
                "bio": "Writer and bookworm 📚",
                "occupation": "Editor",
                "education": "Columbia",
                "height": "5'7\"",
                "location": "New York, NY",
                "photos": ["https://randomuser.me/api/portraits/women/50.jpg", "https://randomuser.me/api/portraits/women/51.jpg"],
                "prompts": [{"question": "My simple pleasures", "answer": "Tea and books"}]
            }
        },
        {
            "id": 18,
            "email": "james@example.com",
            "username": "james",
            "first_name": "James",
            "last_name": "Bond",
            "gender": "male",
            "dob": "1990-11-11", # 33
            "profile": {
                "bio": "Building the future 🚀",
                "occupation": "Founder",
                "education": "Self Taught",
                "height": "6'2\"",
                "location": "San Francisco, CA",
                "photos": ["https://randomuser.me/api/portraits/men/60.jpg", "https://randomuser.me/api/portraits/men/61.jpg"],
                "prompts": [{"question": "I bet you can't", "answer": "Beat me at chess"}]
            }
        },
        {
            "id": 19,
            "email": "olivia@example.com",
            "username": "olivia",
            "first_name": "Olivia",
            "last_name": "Garcia",
            "gender": "female",
            "dob": "1999-02-14", # 24
            "profile": {
                "bio": "Gallery Hopper 🎨",
                "occupation": "Artist",
                "education": "Art Institute",
                "height": "5'6\"",
                "location": "Miami, FL",
                "photos": ["https://randomuser.me/api/portraits/women/5.jpg", "https://randomuser.me/api/portraits/women/6.jpg"],
                "prompts": [{"question": "I'm looking for", "answer": "A muse"}]
            }
        },
        # --- Frontend Mock Matches (IDs 101, 102) ---
        {
            "id": 101,
            "email": "sarah101@example.com",
            "username": "sarah101",
            "first_name": "Sarah",
            "last_name": "Miller",
            "gender": "female",
            "dob": "1998-05-15",
            "profile": {
                "bio": "Love hiking and coffee ☕",
                "occupation": "Product Designer",
                "education": "Stanford University",
                "height": "5'7\"",
                "location": "San Francisco, CA",
                "photos": ["https://randomuser.me/api/portraits/women/1.jpg", "https://randomuser.me/api/portraits/women/2.jpg"],
                "prompts": [{"question": "My simple pleasures", "answer": "Sunday morning coffee"}]
            }
        },
        {
            "id": 102,
            "email": "emma102@example.com",
            "username": "emma102",
            "first_name": "Emma",
            "last_name": "Wilson",
            "gender": "female",
            "dob": "2000-08-20",
            "profile": {
                "bio": "Foodie | Traveler | Dog lover 🐕",
                "occupation": "Marketing Manager",
                "education": "UCLA",
                "height": "5'5\"",
                "location": "Los Angeles, CA",
                "photos": ["https://randomuser.me/api/portraits/women/3.jpg", "https://randomuser.me/api/portraits/women/4.jpg"],
                "prompts": [{"question": "Green flags I look for", "answer": "Kindness and humor"}]
            }
        },
    ]

    print(f"Seeding {len(users)} users...")
    
    password_hash = generate_password_hash("password123")
    
    for u in users:
        # Insert User
        try:
            cursor.execute('''
                INSERT INTO users (id, email, username, password, first_name, last_name, gender, dob)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (u['id'], u['email'], u['username'], password_hash, u['first_name'], u['last_name'], u['gender'], u['dob']))
            
            # Insert Profile
            p = u['profile']
            cursor.execute('''
                INSERT INTO user_profiles (user_id, bio, occupation, education, height, location, photos, prompts)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (u['id'], p['bio'], p['occupation'], p['education'], p['height'], p['location'], 
                  json.dumps(p['photos']), json.dumps(p['prompts'])))
                  
        except sqlite3.IntegrityError as e:
            print(f"Skipping {u['username']}: {e}")

    # Make seed users like potential real users (1-50) to facilitate matching
    print("Simulating likes from seed users...")
    for u in users:
        seed_id = u['id']
        for target_id in range(1, 51): # Assume real user is in first 50 IDs
            if target_id == seed_id: continue
            try:
                cursor.execute("INSERT OR IGNORE INTO likes (user_id, target_id, action) VALUES (?, ?, 'like')", 
                              (seed_id, target_id))
            except:
                pass

    conn.commit()
    conn.close()
    print("✅ Database seeded successfully!")

if __name__ == '__main__':
    seed_data()
