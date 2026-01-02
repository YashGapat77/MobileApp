import bcrypt
from .database import get_db

class User:
    """Simple User model interacting with the SQLite database.
    Provides basic CRUD utilities needed for the test suite.
    """

    def __init__(self, id, email, username, password_hash, first_name=None, last_name=None, gender=None, dob=None):
        self.id = id
        self.email = email
        self.username = username
        # Store both legacy and explicit attribute names for compatibility
        self.password_hash = password_hash
        self.password = password_hash
        self.first_name = first_name
        self.last_name = last_name
        self.gender = gender
        self.dob = dob

    @staticmethod
    def create(email, password, username=None, **kwargs):
        """Create a new user record.
        Returns a User instance on success, or None if the user already exists.
        """
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        conn = get_db()
        cursor = conn.cursor()
        try:
            # Use email prefix as default username if not provided
            if not username:
                username = email.split('@')[0]
            cursor.execute(
                "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
                (email, username, hashed_pw),
            )
            conn.commit()
            user_id = cursor.lastrowid
            return User(user_id, email, username, hashed_pw)
        except Exception:
            # Likely a UNIQUE constraint violation – user already exists
            return None
        finally:
            conn.close()

    @staticmethod
    def get_by_email(email):
        """Fetch a user by email. Returns a User instance or None."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return User(
                row["id"],
                row["email"],
                row["username"],
                row["password"],
                row["first_name"],
                row["last_name"],
                row["gender"],
                row["dob"],
            )
        return None

    @staticmethod
    def verify_password(password, password_hash):
        """Verify a plaintext password against a stored bcrypt hash."""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash)

    def to_dict(self):
        """Return a serializable representation of the user (excluding password)."""
        return {"id": self.id, "email": self.email, "username": self.username}
