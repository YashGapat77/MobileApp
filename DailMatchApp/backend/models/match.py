"""
MATCH MODEL
Represents matches (or potential matches) between two users
"""

from datetime import datetime
from typing import Optional, Dict, List
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from models.database import get_db


class Match:
    """
    Match model
    A row represents a relationship between two users:
    - user1_id, user2_id: user IDs (always stored in sorted order, smaller first)
    - compatibility_score: float 0–1
    - status: 'pending', 'matched', 'passed'
    - user1_action / user2_action: 'like', 'pass', 'pending'
    """

    def __init__(self, **row):
        self.id = row.get('id')
        self.user1_id = row.get('user1_id')
        self.user2_id = row.get('user2_id')
        self.compatibility_score = row.get('compatibility_score')
        self.status = row.get('status')
        self.user1_action = row.get('user1_action')
        self.user2_action = row.get('user2_action')
        self.matched_at = row.get('matched_at')
        self.created_at = row.get('created_at')

    @staticmethod
    def _ordered_pair(user_id: int, other_id: int) -> tuple[int, int, bool]:
        """
        Ensure consistent ordering: smaller ID is always user1.
        Returns (user1_id, user2_id, is_reversed)
        """
        if user_id <= other_id:
            return user_id, other_id, False
        return other_id, user_id, True

    @staticmethod
    def get_between(user_id: int, other_id: int) -> Optional['Match']:
        """Get existing match between two users (if any)."""
        user1_id, user2_id, _ = Match._ordered_pair(user_id, other_id)

        with get_db() as conn:
            row = conn.execute("""
                SELECT * FROM matches
                WHERE user1_id = ? AND user2_id = ?
            """, (user1_id, user2_id)).fetchone()

            if row:
                return Match(**dict(row))
            return None

    @staticmethod
    def create(user_id: int, other_id: int, score: float) -> 'Match':
        """Create a new match row (or return existing)."""
        existing = Match.get_between(user_id, other_id)
        if existing:
            return existing

        user1_id, user2_id, _ = Match._ordered_pair(user_id, other_id)

        with get_db() as conn:
            cursor = conn.execute("""
                INSERT INTO matches (
                    user1_id, user2_id, compatibility_score, status,
                    user1_action, user2_action, created_at
                ) VALUES (?, ?, ?, 'pending', 'pending', 'pending', ?)
            """, (user1_id, user2_id, score, datetime.now()))
            match_id = cursor.lastrowid

        return Match.get_by_id(match_id)

    @staticmethod
    def get_by_id(match_id: int) -> Optional['Match']:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM matches WHERE id = ?", (match_id,)).fetchone()
            if row:
                return Match(**dict(row))
        return None

    def set_action(self, actor_id: int, action: str) -> 'Match':
        """
        Update user1_action or user2_action to 'like' or 'pass'.
        Also updates status to 'matched' if both like.
        """
        if action not in ['like', 'pass']:
            raise ValueError("Action must be 'like' or 'pass'")

        # Determine which side actor is
        if actor_id == self.user1_id:
            field = 'user1_action'
        elif actor_id == self.user2_id:
            field = 'user2_action'
        else:
            raise ValueError("Actor is not part of this match")

        new_status = self.status
        matched_at = self.matched_at

        # Compute new values
        current_actions = {
            'user1_action': self.user1_action,
            'user2_action': self.user2_action
        }
        current_actions[field] = action

        # If both like -> matched
        if current_actions['user1_action'] == 'like' and current_actions['user2_action'] == 'like':
            new_status = 'matched'
            matched_at = datetime.now()
        # If either pass -> passed
        elif action == 'pass':
            new_status = 'passed'

        with get_db() as conn:
            conn.execute(f"""
                UPDATE matches
                SET {field} = ?, status = ?, matched_at = ?
                WHERE id = ?
            """, (action, new_status, matched_at, self.id))

        # Refresh instance
        updated = Match.get_by_id(self.id)
        self.__dict__.update(updated.__dict__)
        return self

    @staticmethod
    def get_user_matches(user_id: int, status: Optional[str] = None) -> List['Match']:
        """Get all matches for a user, optionally filtered by status."""
        with get_db() as conn:
            if status:
                rows = conn.execute("""
                    SELECT * FROM matches
                    WHERE (user1_id = ? OR user2_id = ?) AND status = ?
                    ORDER BY matched_at DESC, created_at DESC
                """, (user_id, user_id, status)).fetchall()
            else:
                rows = conn.execute("""
                    SELECT * FROM matches
                    WHERE user1_id = ? OR user2_id = ?
                    ORDER BY created_at DESC
                """, (user_id, user_id)).fetchall()

        return [Match(**dict(row)) for row in rows]

    def to_dict(self, current_user_id: int) -> Dict:
        """Serialize match row, with perspective of current user."""
        other_id = self.user2_id if current_user_id == self.user1_id else self.user1_id
        my_action = self.user1_action if current_user_id == self.user1_id else self.user2_action
        their_action = self.user2_action if current_user_id == self.user1_id else self.user1_action

        return {
            'id': self.id,
            'me': current_user_id,
            'other_user_id': other_id,
            'compatibility_score': self.compatibility_score,
            'status': self.status,
            'my_action': my_action,
            'their_action': their_action,
            'matched_at': str(self.matched_at) if self.matched_at else None,
            'created_at': str(self.created_at) if self.created_at else None
        }


# Simple test when running this file directly
if __name__ == '__main__':
    print("Match model test: just checking import and creation doesn't crash.")