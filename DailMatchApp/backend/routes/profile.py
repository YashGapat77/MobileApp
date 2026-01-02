from flask import Blueprint, request, jsonify, current_app
import sys
from pathlib import Path
import json
import os

# Fix import path so we can import models and utils
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from models.profile import Profile
from utils.auth import login_required
from utils.helpers import save_file
from services.ai_service import DailyMatchAI

bp = Blueprint('profile', __name__, url_prefix='/api/profile')
ai = DailyMatchAI()

@bp.route('/prompts', methods=['GET'])
def get_prompts():
    category = request.args.get('category')
    prompts = Profile.get_available_prompts(category=category)
    return jsonify({'prompts': prompts}), 200


@bp.route('/create', methods=['POST'])
@login_required
def create_profile():
    """
    Create user profile

    POST /api/profile/create
    Headers:
        Authorization: Bearer <token>
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Required fields
    required = ['name', 'age', 'gender', 'looking_for']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Validate age
    try:
        age = int(data['age'])
        if age < 18 or age > 100:
            return jsonify({'error': 'Age must be between 18 and 100'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid age'}), 400

    # Validate gender and looking_for
    valid_genders = ['male', 'female', 'non-binary', 'everyone', 'other']
    if data['gender'] not in valid_genders:
        return jsonify({'error': 'Invalid gender'}), 400
    if data['looking_for'] not in valid_genders:
        return jsonify({'error': 'Invalid looking_for preference'}), 400

    profile = Profile.create(user_id=request.user_id, profile_data=data)
    if not profile:
        return jsonify({'error': 'Profile already exists or creation failed'}), 409

    return jsonify({
        'message': 'Profile created successfully',
        'profile': profile.to_dict(include_private=True)
    }), 201


@bp.route('/me', methods=['GET'])
@login_required
def get_my_profile():
    """
    Get current user's profile

    GET /api/profile/me
    Headers:
        Authorization: Bearer <token>
    """
    profile = Profile.get_by_user_id(request.user_id)

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    return jsonify({
        'profile': profile.to_dict(include_private=True)
    }), 200


@bp.route('/update', methods=['PUT', 'PATCH'])
@login_required
def update_profile():
    """
    Update current user's profile

    PUT/PATCH /api/profile/update
    Headers:
        Authorization: Bearer <token>
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    profile = Profile.get_by_user_id(request.user_id)
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    success = profile.update(data)
    if not success:
        return jsonify({'error': 'No valid fields to update'}), 400

    updated_profile = Profile.get_by_user_id(request.user_id)

    return jsonify({
        'message': 'Profile updated successfully',
        'profile': updated_profile.to_dict(include_private=True)
    }), 200


@bp.route('/<int:profile_id>', methods=['GET'])
@login_required
def get_profile(profile_id: int):

    profile = Profile.get_by_id(profile_id)

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    return jsonify({
        'profile': profile.to_dict(include_private=False)
    }), 200


@bp.route('/photos/upload', methods=['POST'])
@login_required
def upload_photo():

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Save file to disk
    rel_path = save_file(file, 'profiles', request.user_id)
    if not rel_path:
        return jsonify({'error': 'Invalid file type (use png/jpg/jpeg/gif)'}), 400

    # Update profile in DB
    profile = Profile.get_by_user_id(request.user_id)
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    current_photos = json.loads(profile.photos) if profile.photos else []
    current_photos.append(rel_path)

    profile.update({'photos': current_photos})

    return jsonify({
        'message': 'Photo uploaded successfully',
        'url': f"/api/uploads/{rel_path}",
        'photos': current_photos
    }), 201


@bp.route('/photos/delete', methods=['DELETE'])
@login_required
def delete_photo():

    data = request.get_json() or {}
    photo_path = data.get('path')

    if not photo_path:
        return jsonify({'error': 'No photo path provided'}), 400

    profile = Profile.get_by_user_id(request.user_id)
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    current_photos = json.loads(profile.photos) if profile.photos else []

    if photo_path not in current_photos:
        return jsonify({'error': 'Photo not found in your profile'}), 404

    # Remove from DB list
    current_photos.remove(photo_path)
    profile.update({'photos': current_photos})

    # Delete physical file (best effort)
    try:
        full_path = Path(current_app.config['UPLOAD_FOLDER']) / photo_path
        if full_path.exists():
            os.remove(str(full_path))
    except Exception as e:
        print(f"Error deleting file {photo_path}: {e}")

    return jsonify({
        'message': 'Photo deleted',
        'photos': current_photos
    }), 200

@bp.route('/ai/improve-answer', methods=['POST'])
@login_required
def ai_improve_answer():

    data = request.get_json() or {}
    question = data.get('question')
    answer = data.get('answer')

    if not question or not answer:
        return jsonify({'error': 'question and answer are required'}), 400

    improved = ai.improve_prompt_answer(question, answer)

    return jsonify({
        'question': question,
        'original': answer,
        'improved': improved
    }), 200