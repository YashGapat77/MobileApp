"""
CHAT ROUTES
Basic messaging between matched users
"""

from flask import Blueprint, request, jsonify
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from utils.auth import login_required
from models.match import Match
from models.message import Message
from models.profile import Profile

bp = Blueprint('chat', __name__, url_prefix='/api/chat')


@bp.route('/conversations', methods=['GET'])
@login_required
def list_conversations():
    """
    List all match conversations for the current user.

    GET /api/chat/conversations
    Headers:
        Authorization: Bearer <token>
    """
    user_id = request.user_id

    matches = Match.get_user_matches(user_id)

    conversations = []
    for m in matches:
        # Identify the other user
        other_id = m.user2_id if m.user1_id == user_id else m.user1_id
        other_profile = Profile.get_by_user_id(other_id)

        # Get latest message (if any)
        thread = Message.get_conversation(m.id, limit=1)
        last_message = thread[-1].to_dict() if thread else None

        conversations.append({
            'match': m.to_dict(current_user_id=user_id),
            'other_profile': other_profile.to_dict(include_private=False) if other_profile else None,
            'last_message': last_message
        })

    return jsonify({'conversations': conversations}), 200


@bp.route('/thread/<int:match_id>', methods=['GET'])
@login_required
def get_thread(match_id: int):
    """
    Get all messages in a conversation.

    GET /api/chat/thread/<match_id>
    Headers:
        Authorization: Bearer <token>
    """
    user_id = request.user_id

    match = Match.get_by_id(match_id)
    if not match:
        return jsonify({'error': 'Match not found'}), 404

    # Ensure user is part of this match
    if user_id not in [match.user1_id, match.user2_id]:
        return jsonify({'error': 'Not authorized for this conversation'}), 403

    messages = Message.get_conversation(match_id)
    return jsonify({'messages': [m.to_dict() for m in messages]}), 200


@bp.route('/send', methods=['POST'])
@login_required
def send_message():
    """
    Send a message in a match conversation.

    POST /api/chat/send
    Headers:
        Authorization: Bearer <token>
    JSON body:
        {
          "match_id": 1,
          "message": "Hi there!"
        }
    """
    data = request.get_json() or {}
    user_id = request.user_id

    match_id = data.get('match_id')
    text = data.get('message')

    if not match_id or not text:
        return jsonify({'error': 'match_id and message are required'}), 400

    match = Match.get_by_id(match_id)
    if not match:
        return jsonify({'error': 'Match not found'}), 404

    # Ensure sender is part of this match
    if user_id not in [match.user1_id, match.user2_id]:
        return jsonify({'error': 'Not authorized to send message in this match'}), 403

    # Determine receiver
    receiver_id = match.user2_id if user_id == match.user1_id else match.user1_id

    try:
        msg = Message.create(match_id=match_id, sender_id=user_id, receiver_id=receiver_id, text=text)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    return jsonify({
        'message': 'Message sent',
        'data': msg.to_dict()
    }), 201