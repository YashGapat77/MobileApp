from services.ai_service import DailyMatchAI
from models.profile import Profile
from flask import Blueprint, request, jsonify
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from utils.auth import login_required
from services.matching_service import MatchingService
from models.match import Match
from models.profile import Profile
ai = DailyMatchAI(model='llama2:7b-chat-q4_0')
bp = Blueprint('matches', __name__, url_prefix='/api/matches')


@bp.route('/daily', methods=['GET'])
@login_required
def daily_matches():
    """
    Get daily suggested matches for the current user.

    GET /api/matches/daily?limit=10
    Headers:
        Authorization: Bearer <token>
    """
    try:
        limit = int(request.args.get('limit', 10))
    except ValueError:
        limit = 10

    service = MatchingService()
    suggestions = service.find_potential_matches(request.user_id, limit=limit)

    return jsonify({
        'count': len(suggestions),
        'matches': suggestions
    }), 200


@bp.route('/action', methods=['POST'])
@login_required
def match_action():
    """
    Like or pass another user.

    POST /api/matches/action
    Headers:
        Authorization: Bearer <token>
    JSON Body:
        {
            "target_user_id": 5,
            "action": "like" | "pass"
        }

    Response:
        {
            "message": "...",
            "status": "pending|matched|passed",
            "match": { ... }  # if exists
        }
    """
    data = request.get_json() or {}
    target_id = data.get('target_user_id')
    action = data.get('action')

    if not target_id or action not in ['like', 'pass']:
        return jsonify({'error': 'target_user_id and valid action required'}), 400

    # Make sure target profile exists
    target_profile = Profile.get_by_user_id(target_id)
    if not target_profile:
        return jsonify({'error': 'Target user/profile not found'}), 404

    # Ensure we have a score (fallback to 0.5 for now if new)
    from services.matching_service import MatchingService
    me_profile = Profile.get_by_user_id(request.user_id)
    service = MatchingService()
    score = service.compute_score(me_profile, target_profile)

    # Create or get match row
    match = Match.create(request.user_id, target_id, score)
    match.set_action(request.user_id, action)

    # If matched, we can notify later (for now just return status)
    resp = {
        'message': f"Action '{action}' recorded",
        'status': match.status,
        'match': match.to_dict(current_user_id=request.user_id)
    }
    return jsonify(resp), 200
@bp.route('/<int:match_id>/icebreakers', methods=['GET'])
@login_required
def get_icebreakers(match_id: int):

    user_id = request.user_id

    match = Match.get_by_id(match_id)
    if not match:
        return jsonify({'error': 'Match not found'}), 404

    # Ensure user is part of this match
    if user_id not in [match.user1_id, match.user2_id]:
        return jsonify({'error': 'Not authorized for this match'}), 403

    # Load both profiles
    me_profile = Profile.get_by_user_id(user_id)
    other_id = match.user2_id if user_id == match.user1_id else match.user1_id
    them_profile = Profile.get_by_user_id(other_id)

    if not me_profile or not them_profile:
        return jsonify({'error': 'Profiles not found for both users'}), 400

    me_dict = me_profile.to_dict(include_private=True)
    them_dict = them_profile.to_dict(include_private=False)

    icebreakers = ai.generate_icebreakers(me_dict, them_dict, count=3)

    return jsonify({
        'icebreakers': icebreakers
    }), 200    