import os
import jwt
import datetime

# Secret key for JWT signing – use environment variable or default for development
SECRET_KEY = os.getenv('SECRET_KEY', 'dev_secret_key')
ALGORITHM = 'HS256'
EXPIRATION_HOURS = 24


def generate_token(user_id: int) -> str:
    """Generate a JWT token for the given user ID.
    The token expires after ``EXPIRATION_HOURS`` hours.
    """
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=EXPIRATION_HOURS)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    # ``jwt.encode`` returns ``str`` in PyJWT>=2.0, but may return ``bytes`` in older versions.
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token


def decode_token(token: str):
    """Decode a JWT token.
    Returns the payload dict if the token is valid, otherwise ``None``.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        # Any error (expired, invalid signature, etc.) results in ``None``
        return None
