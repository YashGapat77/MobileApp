from flask import Blueprint, request, jsonify, send_from_directory
from models.database import get_db
import json
import os
import time
from werkzeug.utils import secure_filename

user_bp = Blueprint('user', __name__)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@user_bp.route('/profile', methods=['GET'])
def get_profile():
    user_id = request.headers.get('User-Id', 1)
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
        
    cursor.execute('SELECT * FROM user_profiles WHERE user_id = ?', (user_id,))
    profile = cursor.fetchone()
    
    conn.close()
    
    response = {
        'name': f"{user['first_name'] or ''} {user['last_name'] or ''}".strip() or user['username'],
        'email': user['email'],
        'age': 25, 
    }
    
    if profile:
        photos = json.loads(profile['photos']) if profile['photos'] else []
        base_url = request.host_url.rstrip('/')
        photos = [p if p.startswith('http') else f"{base_url}/api/user/uploads/{p}" for p in photos]

        response.update({
            'bio': profile['bio'],
            'occupation': profile['occupation'],
            'education': profile['education'],
            'height': profile['height'],
            'location': profile['location'],
            'photos': photos,
            'prompts': json.loads(profile['prompts']) if profile['prompts'] else [],
        })
        
    return jsonify({'profile': response})

@user_bp.route('/profile', methods=['PUT'])
def update_profile():
    user_id = request.headers.get('User-Id', 1)
    
    # Handle multipart/form-data
    bio = request.form.get('bio', '')
    occupation = request.form.get('occupation', '')
    education = request.form.get('education', '')
    height = request.form.get('height', '')
    location = request.form.get('location', '')
    prompts = request.form.get('prompts', '[]')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get existing photos first
    cursor.execute('SELECT photos FROM user_profiles WHERE user_id = ?', (user_id,))
    existing_profile = cursor.fetchone()
    current_photos = json.loads(existing_profile['photos']) if existing_profile and existing_profile['photos'] else []
    
    # Handle new file uploads
    if 'photo' in request.files:
        files = request.files.getlist('photo')
        for file in files:
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(f"{user_id}_{int(time.time())}_{file.filename}")
                file.save(os.path.join(UPLOAD_FOLDER, filename))
                current_photos.append(filename)
    
    # Update DB
    cursor.execute('SELECT user_id FROM user_profiles WHERE user_id = ?', (user_id,))
    exists = cursor.fetchone()
    
    photos_json = json.dumps(current_photos)
    
    if exists:
        cursor.execute('''
            UPDATE user_profiles 
            SET bio=?, occupation=?, education=?, height=?, location=?, photos=?, prompts=?
            WHERE user_id=?
        ''', (bio, occupation, education, height, location, photos_json, prompts, user_id))
    else:
        cursor.execute('''
            INSERT INTO user_profiles (user_id, bio, occupation, education, height, location, photos, prompts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, bio, occupation, education, height, location, photos_json, prompts))
        
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'photos': current_photos})

@user_bp.route('/profile/<int:target_id>', methods=['GET'])
def get_public_profile(target_id):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (target_id,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
        
    cursor.execute('SELECT * FROM user_profiles WHERE user_id = ?', (target_id,))
    profile = cursor.fetchone()
    
    conn.close()
    
    response = {
        'id': user['id'],
        'name': f"{user['first_name'] or ''} {user['last_name'] or ''}".strip() or user['username'],
        'age': 25, 
    }
    
    if profile:
        photos = json.loads(profile['photos']) if profile['photos'] else []
        base_url = request.host_url.rstrip('/')
        photos = [p if p.startswith('http') else f"{base_url}/api/user/uploads/{p}" for p in photos]

        response.update({
            'bio': profile['bio'],
            'occupation': profile['occupation'],
            'education': profile['education'],
            'location': profile['location'],
            'photos': photos,
            'prompts': json.loads(profile['prompts']) if profile['prompts'] else [],
        })
        
    return jsonify({'profile': response})

# Serve uploaded files
@user_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# --- Matching Routes ---

@user_bp.route('/matches/potential', methods=['GET'])
def get_potential_matches():
    user_id = request.headers.get('User-Id', 1)
    
    # Get filters
    min_age = request.args.get('min_age', 18, type=int)
    max_age = request.args.get('max_age', 100, type=int)
    gender = request.args.get('gender') # 'male', 'female', or None/empty for all
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Base query
    query = '''
        SELECT u.id, u.first_name, u.last_name, u.dob, u.gender, p.bio, p.occupation, p.education, p.height, p.location, p.photos, p.prompts
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id != ? 
        AND u.id NOT IN (SELECT target_id FROM likes WHERE user_id = ?)
    '''
    params = [user_id, user_id]
    
    # Gender filter
    if gender and gender.lower() in ['male', 'female']:
        query += ' AND u.gender = ?'
        params.append(gender.lower())
        
    # Age filter (SQLite calculation)
    # (Year Now - Year DOB) - (1 if (Month Now, Day Now) < (Month DOB, Day DOB) else 0)
    # Simplified: Just year difference for now
    query += " AND (strftime('%Y', 'now') - strftime('%Y', u.dob)) BETWEEN ? AND ?"
    params.extend([min_age, max_age])
    
    query += ' LIMIT 20'
    
    cursor.execute(query, params)
    
    rows = cursor.fetchall()
    matches = []
    
    import datetime
    current_year = datetime.datetime.now().year
    
    for row in rows:
        photos = json.loads(row['photos']) if row['photos'] else []
        base_url = request.host_url.rstrip('/')
        photos = [p if p.startswith('http') else f"{base_url}/api/user/uploads/{p}" for p in photos]
        
        # Calculate age
        dob_year = int(row['dob'].split('-')[0]) if row['dob'] else 2000
        age = current_year - dob_year
        
        matches.append({
            'id': str(row['id']),
            'name': row['first_name'] or 'User',
            'age': age,
            'bio': row['bio'] or '',
            'occupation': row['occupation'] or '',
            'education': row['education'] or '',
            'height': row['height'] or '',
            'location': row['location'] or '',
            'photos': photos if photos else ['https://randomuser.me/api/portraits/women/1.jpg'],
            'prompts': json.loads(row['prompts']) if row['prompts'] else [],
        })
        
    conn.close()
    return jsonify({'matches': matches})

@user_bp.route('/matches/swipe', methods=['POST'])
def swipe():
    user_id = request.headers.get('User-Id', 1)
    data = request.get_json()
    target_id = data.get('targetUserId')
    action = data.get('action')
    comment = data.get('comment')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('INSERT INTO likes (user_id, target_id, action, comment) VALUES (?, ?, ?, ?)', 
                      (user_id, target_id, action, comment))
    except Exception:
        pass  # Ignore duplicate entries
    
    is_match = False
    
    if action == 'like' or action == 'super-like': # accept super-like as well
        # Check for reverse like
        cursor.execute('SELECT * FROM likes WHERE user_id = ? AND target_id = ? AND action = "like"', 
                      (target_id, user_id))
        
        # Real Matching Logic: Only match if they already liked us
        if cursor.fetchone():
            try:
                # Check if match already exists
                cursor.execute('SELECT * FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
                              (min(int(user_id), int(target_id)), max(int(user_id), int(target_id)),
                               min(int(user_id), int(target_id)), max(int(user_id), int(target_id))))
                
                if not cursor.fetchone():
                    cursor.execute('INSERT INTO matches (user1_id, user2_id) VALUES (?, ?)', 
                                  (min(int(user_id), int(target_id)), max(int(user_id), int(target_id))))
                    is_match = True
                    match_id = cursor.lastrowid
                    
                    # If there's a comment, insert it as a message to start conversation
                    if comment:
                        cursor.execute('INSERT INTO messages (sender_id, receiver_id, text) VALUES (?, ?, ?)',
                                      (user_id, target_id, comment))
            except Exception as e:
                print(f"Error creating match: {e}")
                pass
            
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'match': is_match, 'match_id': match_id if is_match else None})

@user_bp.route('/matches', methods=['GET'])
def get_matches():
    try:
        user_id_header = request.headers.get('User-Id', '1')
        # Handle 'undefined' or empty string
        if not user_id_header or user_id_header == 'undefined':
             user_id = 1
        else:
             user_id = int(user_id_header)
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT m.*, u.first_name, u.username, p.photos
            FROM matches m
            LEFT JOIN users u ON u.id = (CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END)
            LEFT JOIN user_profiles p ON p.user_id = (CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END)
            WHERE m.user1_id = ? OR m.user2_id = ?
        ''', (user_id, user_id, user_id, user_id))
        
        rows = cursor.fetchall()
        matches = []
        
        for row in rows:
            try:
                photos_json = row['photos']
                photos = json.loads(photos_json) if photos_json else []
            except:
                photos = []
                
            photo = photos[0] if photos else 'https://randomuser.me/api/portraits/women/1.jpg'
            if photo and not photo.startswith('http'):
                base_url = request.host_url.rstrip('/')
                photo = f"{base_url}/api/user/uploads/{photo}"
                
            other_user_id = row['user1_id'] if int(row['user2_id']) == int(user_id) else row['user2_id']
            
            # Get actual last message
            cursor.execute('''
                SELECT text, created_at FROM messages 
                WHERE (sender_id = ? AND receiver_id = ?) 
                   OR (sender_id = ? AND receiver_id = ?)
                ORDER BY created_at DESC LIMIT 1
            ''', (user_id, other_user_id, other_user_id, user_id))
            
            msg = cursor.fetchone()
            
            last_message = msg['text'] if msg else 'Say hi!'
            timestamp = msg['created_at'] if msg else 'New'
                
            matches.append({
                'id': str(row['id']),
                'userId': str(other_user_id),
                'name': row['first_name'] or row['username'] or 'Unknown',
                'photo': photo,
                'lastMessage': last_message,
                'timestamp': timestamp,
                'unread': False, # Todo: real unread count
            })
        
        conn.close()
        return jsonify({'matches': matches})
    except Exception as e:
        print(f"Error in get_matches: {e}")
        return jsonify({'matches': [], 'error': str(e)}), 500

@user_bp.route('/matches/<match_id>', methods=['DELETE'])
def unmatch_user(match_id):
    user_id_header = request.headers.get('User-Id', '1')
    try:
        user_id = int(user_id_header) if user_id_header and user_id_header != 'undefined' else 1
    except:
        user_id = 1

    conn = get_db()
    cursor = conn.cursor()
    # Verify the match belongs to the user
    cursor.execute("SELECT * FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)", (match_id, user_id, user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Match not found or unauthorized'}), 404
        
    # Delete match
    cursor.execute("DELETE FROM matches WHERE id = ?", (match_id,))
    
    conn.commit()
    conn.close()
    return jsonify({'success': True})
@user_bp.route('/upload', methods=['POST'])
def upload_generic():
    try:
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo provided'}), 400
            
        file = request.files['photo']
        if file and allowed_file(file.filename):
            filename = secure_filename(f"chat_{int(time.time())}_{file.filename}")
            file.save(os.path.join(UPLOAD_FOLDER, filename))
            
            return jsonify({'success': True, 'filename': filename})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Upload failed'}), 400
