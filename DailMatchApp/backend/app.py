from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, emit
from routes.auth import auth_bp
from routes.user import user_bp
from models.database import init_db, get_db
import os
import random
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", "dev_secret_key")
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Initialize database on startup
try:
    init_db()
except Exception as e:
    print(f"DB Init: {e}")

# Enable CORS for all domains
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/user')

@app.route('/api/health')
def health():
    return {'status': 'ok'}

# --- Socket.IO Events ---

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join')
def on_join(data):
    room = data.get('room')
    if room:
        join_room(room)
        print(f'Client joined room: {room}')
        
        # Load Chat History
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            print(f"DEBUG: Looking for match/room ID: {room}")
            # Find the users in this match/room
            cursor.execute("SELECT user1_id, user2_id FROM matches WHERE id = ?", (room,))
            match_row = cursor.fetchone()
            
            if match_row:
                user1, user2 = match_row['user1_id'], match_row['user2_id']
                print(f"DEBUG: Found match between {user1} and {user2}")
                
                # Fetch messages between them
                cursor.execute('''
                    SELECT * FROM messages 
                    WHERE (sender_id = ? AND receiver_id = ?) 
                       OR (sender_id = ? AND receiver_id = ?)
                    ORDER BY created_at ASC
                ''', (user1, user2, user2, user1))
                
                rows = cursor.fetchall()
                print(f"DEBUG: Loading {len(rows)} messages from history")
                
                history = []
                for row in rows:
                    history.append({
                        '_id': str(row['id']), # Unique ID
                        'text': row['text'],
                        'senderId': str(row['sender_id']),
                        'timestamp': row['created_at'],
                        'status': 'read' if row['read'] else 'sent'
                    })
                
                emit('chat_history', history, room=room)
            else:
                 print(f"DEBUG: No match found for room {room}")
                
            conn.close()
        except Exception as e:
            print(f"Error loading history: {e}")

@socketio.on('leave')
def on_leave(data):
    room = data.get('room')
    if room:
        leave_room(room)
        print(f'Client left room: {room}')

@socketio.on('send_message')
def handle_message(data):
    room = data.get('room')
    message_text = data.get('text')
    sender_id = data.get('senderId')
    
    if room and message_text and sender_id:
        print(f'Message in {room} from {sender_id}: {message_text}')
        
        # Save to DB
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            # Identify receiver (the other person in the match)
            cursor.execute("SELECT user1_id, user2_id FROM matches WHERE id = ?", (room,))
            match_row = cursor.fetchone()
            
            if match_row:
                u1, u2 = match_row['user1_id'], match_row['user2_id']
                receiver_id = u2 if str(u1) == str(sender_id) else u1
                
                print(f"DEBUG: Saving msg from {sender_id} to {receiver_id}")
                
                cursor.execute('''
                    INSERT INTO messages (sender_id, receiver_id, text)
                    VALUES (?, ?, ?)
                ''', (sender_id, receiver_id, message_text))
                
                conn.commit()
                new_msg_id = cursor.lastrowid
                print(f"DEBUG: Msg saved with ID {new_msg_id}")
                
                # Emit to room
                emit('receive_message', {
                    '_id': str(new_msg_id),
                    'text': message_text,
                    'senderId': sender_id,
                    'timestamp': data.get('timestamp')
                }, room=room)
            else:
                print(f"DEBUG: Cannot save message, room {room} not found in DB")
                
            conn.close()
        except Exception as e:
            print(f"Error saving message: {e}")

if __name__ == '__main__':
    # Initialize database tables
    init_db()
    
    print("Starting Flask-SocketIO server on port 5000...")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
