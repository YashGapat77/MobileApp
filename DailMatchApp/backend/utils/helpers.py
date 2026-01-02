import os
from werkzeug.utils import secure_filename
from pathlib import Path
from flask import current_app

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_file(file, folder, user_id):
    """
    Save uploaded file securely
    Returns the relative path to be stored in DB
    """
    if not file or not allowed_file(file.filename):
        return None
    
    filename = secure_filename(file.filename)
    # Make unique filename: user_1_timestamp_filename.jpg
    import time
    timestamp = int(time.time())
    unique_filename = f"user_{user_id}_{timestamp}_{filename}"
    
    # Create directory if not exists
    upload_path = Path(current_app.config['UPLOAD_FOLDER']) / folder
    upload_path.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = upload_path / unique_filename
    file.save(str(file_path))
    
    # Return relative path for URL usage (e.g., 'uploads/profiles/file.jpg')
    return f"{folder}/{unique_filename}"