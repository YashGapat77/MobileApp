"""
MESSAGE MODEL
Handles chat messages between matched users
"""

from datetime import datetime
from typing import Optional, List, Dict
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from models.database import get_db


class Message:
    """
    Represents a single chat message in a match conversation.
    """

    def __init__(self, **row):
        self.id = row.get('id')
        self.match_id = row.get('match_id')
        self.sender_id = row.get('sender_id')
        self.receiver_id = row.get('receiver_id')
        self.message = row.get('message')
        self.created_at = row.get('created_at')
        self.read_at = row.get('read_at')

    @staticmethod
    def create(match_id: int, sender_id: int, receiver_id: int, text: str) -> 'Message':
        """Create and store a new message."""
        if not text or not text.strip():
            raise ValueError("Message text cannot be empty")

        with get_db() as conn:
            cursor = conn.execute("""
                INSERT INTO messages (match_id, sender_id, receiver_id, message, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (match_id, sender_id, receiver_id, text.strip(), datetime.now()))
            msg_id = cursor.lastrowid

        return Message.get_by_id(msg_id)

    @staticmethod
    def get_by_id(message_id: int) -> Optional['Message']:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM messages WHERE id = ?", (message_id,)).fetchone()
            if row:
                return Message(**dict(row))
        return None

    @staticmethod
    def get_conversation(match_id: int, limit: int = 50) -> List['Message']:
        """Get the latest messages in a conversation (by match_id)."""
        with get_db() as conn:
            rows = conn.execute("""
                SELECT * FROM messages
                WHERE match_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (match_id, limit)).fetchall()

        # Return in chronological order (oldest first)
        messages = [Message(**dict(row)) for row in rows]
        messages.reverse()
        return messages

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'match_id': self.match_id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'message': self.message,
            'created_at': str(self.created_at) if self.created_at else None,
            'read_at': str(self.read_at) if self.read_at else None
        }