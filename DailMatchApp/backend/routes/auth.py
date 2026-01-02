from flask import Blueprint, request, jsonify
from models.database import get_db
import bcrypt
import jwt
import datetime
import os

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = os.environ.get("SECRET_KEY", "dev_secret_key")

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
        
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO users (email, username, password, first_name, last_name, gender, dob) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (email, username, hashed_pw, data.get('firstName'), data.get('lastName'), data.get('gender'), data.get('dateOfBirth'))
        )
        conn.commit()
        user_id = cursor.lastrowid
        
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            'token': token,
            'user': {
                'id': user_id,
                'email': email,
                'username': username
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'username': user['username']
            }
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401
