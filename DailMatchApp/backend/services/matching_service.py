"""
MATCHING SERVICE
Finds potential matches and computes compatibility scores
"""

from typing import List, Dict
import json
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from models.database import get_db
from models.profile import Profile
from models.match import Match


class MatchingService:
    """
    Encapsulates logic to find potential matches for a user
    and score compatibility.
    """

    def _gender_compatible(self, a_looking_for: str, b_gender: str) -> bool:
        """Check if person's 'looking_for' includes the other person's gender."""
        if a_looking_for == 'everyone':
            return True
        return a_looking_for == b_gender

    def compute_score(self, me: Profile, them: Profile) -> float:
        """
        Compute compatibility score between two profiles.
        Very simple initial version:
        - 40% shared interests
        - 30% age difference
        - 20% location
        - 10% profile completion
        """
        score = 0.0

        # Interests overlap
        my_interests = set(json.loads(me.interests) if me.interests else [])
        their_interests = set(json.loads(them.interests) if them.interests else [])
        if my_interests and their_interests:
            overlap = len(my_interests & their_interests)
            union = len(my_interests | their_interests)
            interest_score = overlap / union if union else 0
        else:
            interest_score = 0.0
        score += interest_score * 0.4

        # Age difference
        try:
            age_diff = abs(int(me.age) - int(them.age))
        except Exception:
            age_diff = 10

        if age_diff <= 2:
            age_score = 1.0
        elif age_diff <= 5:
            age_score = 0.7
        elif age_diff <= 10:
            age_score = 0.4
        else:
            age_score = 0.2
        score += age_score * 0.3

        # Location (exact match gets bonus)
        if me.location and them.location and me.location == them.location:
            loc_score = 1.0
        else:
            loc_score = 0.3  # we treat remote/any location as partial
        score += loc_score * 0.2

        # Profile completion
        completion = (me.completion_percentage + them.completion_percentage) / 2.0
        completion_score = completion / 100.0
        score += completion_score * 0.1

        # Clamp 0–1
        if score < 0:
            score = 0.0
        if score > 1:
            score = 1.0

        return round(score, 2)

    def find_potential_matches(self, user_id: int, limit: int = 10) -> List[Dict]:
        """
        Find best matches for a given user_id.
        Returns a list of dicts with:
            { 'profile': {...}, 'score': 0.85, 'already_matched': bool }
        """

        me = Profile.get_by_user_id(user_id)
        if not me:
            return []

        with get_db() as conn:
            # Candidate pool:
            # - different user_id
            # - profile_completed = 1
            # - basic gender preference (we'll double-check in Python)
            rows = conn.execute("""
                SELECT p.*
                FROM profiles p
                WHERE p.user_id != ?
                  AND p.profile_completed = 1
            """, (user_id,)).fetchall()

            candidates = [Profile(**dict(row)) for row in rows]

        results = []

        for them in candidates:
            # Check gender compatibility both ways
            if not self._gender_compatible(me.looking_for, them.gender):
                continue
            if not self._gender_compatible(them.looking_for, me.gender):
                continue

            # Skip if there's already a match row
            existing = Match.get_between(user_id, them.user_id)
            already_matched = existing is not None

            score = self.compute_score(me, them)
            results.append({
                'profile': them.to_dict(include_private=False),
                'score': score,
                'already_matched': already_matched
            })

        # Sort by score, highest first
        results.sort(key=lambda x: x['score'], reverse=True)

        # Limit amount
        return results[:limit]