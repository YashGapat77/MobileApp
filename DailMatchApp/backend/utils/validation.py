"""
Input Validation and Sanitization Module
Provides validation for all user inputs to prevent security issues
"""

import re
from typing import Tuple, Optional
from datetime import datetime

# Email validation regex
EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

# Allowed file extensions for uploads
ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'heic'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Text length limits
MAX_NAME_LENGTH = 100
MAX_BIO_LENGTH = 500
MAX_PROMPT_ANSWER_LENGTH = 300
MAX_MESSAGE_LENGTH = 1000


def validate_email(email: str) -> Tuple[bool, str]:
    """
    Validate email format
    
    Returns: (is_valid, error_message)
    """
    if not email or len(email.strip()) == 0:
        return False, "Email is required"
    
    email = email.strip().lower()
    
    if len(email) > 255:
        return False, "Email is too long"
    
    if not re.match(EMAIL_REGEX, email):
        return False, "Invalid email format"
    
    return True, ""


def validate_password(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    
    Returns: (is_valid, error_message)
    """
    if not password:
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password is too long (max 128 characters)"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    
    return True, ""


def validate_name(name: str) -> Tuple[bool, str]:
    """Validate user's name"""
    if not name or len(name.strip()) == 0:
        return False, "Name is required"
    
    name = name.strip()
    
    if len(name) > MAX_NAME_LENGTH:
        return False, f"Name must be less than {MAX_NAME_LENGTH} characters"
    
    if len(name) < 2:
        return False, "Name must be at least 2 characters"
    
    # Allow letters, spaces, hyphens, apostrophes
    if not re.match(r"^[a-zA-Z\s'\-]+$", name):
        return False, "Name can only contain letters, spaces, hyphens, and apostrophes"
    
    return True, ""


def validate_age(age: int) -> Tuple[bool, str]:
    """Validate user's age"""
    try:
        age = int(age)
    except (ValueError, TypeError):
        return False, "Age must be a number"
    
    if age < 18:
        return False, "You must be at least 18 years old"
    
    if age > 100:
        return False, "Please enter a valid age"
    
    return True, ""


def validate_gender(gender: str) -> Tuple[bool, str]:
    """Validate gender selection"""
    valid_genders = ['male', 'female', 'non-binary', 'other', 'prefer not to say']
    
    if not gender or gender.lower().strip() not in valid_genders:
        return False, f"Gender must be one of: {', '.join(valid_genders)}"
    
    return True, ""


def validate_bio(bio: Optional[str]) -> Tuple[bool, str]:
    """Validate profile bio"""
    if bio is None or len(bio.strip()) == 0:
        return True, ""  # Bio is optional
    
    bio = bio.strip()
    
    if len(bio) > MAX_BIO_LENGTH:
        return False, f"Bio must be less than {MAX_BIO_LENGTH} characters"
    
    # Check for potentially harmful content
    if contains_harmful_content(bio):
        return False, "Bio contains inappropriate content"
    
    return True, ""


def validate_prompt_answer(answer: Optional[str]) -> Tuple[bool, str]:
    """Validate dating prompt answer"""
    if answer is None or len(answer.strip()) == 0:
        return True, ""  # Answers are optional
    
    answer = answer.strip()
    
    if len(answer) > MAX_PROMPT_ANSWER_LENGTH:
        return False, f"Answer must be less than {MAX_PROMPT_ANSWER_LENGTH} characters"
    
    if contains_harmful_content(answer):
        return False, "Answer contains inappropriate content"
    
    return True, ""


def validate_message(message: str) -> Tuple[bool, str]:
    """Validate chat message"""
    if not message or len(message.strip()) == 0:
        return False, "Message cannot be empty"
    
    message = message.strip()
    
    if len(message) > MAX_MESSAGE_LENGTH:
        return False, f"Message must be less than {MAX_MESSAGE_LENGTH} characters"
    
    if contains_harmful_content(message):
        return False, "Message contains inappropriate content"
    
    return True, ""


def validate_file_extension(filename: str, allowed_extensions: set = ALLOWED_IMAGE_EXTENSIONS) -> Tuple[bool, str]:
    """Validate file extension"""
    if not filename or '.' not in filename:
        return False, "Invalid filename"
    
    extension = filename.rsplit('.', 1)[1].lower()
    
    if extension not in allowed_extensions:
        return False, f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
    
    return True, ""


def validate_file_size(file_size: int, max_size: int = MAX_FILE_SIZE) -> Tuple[bool, str]:
    """Validate file size"""
    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        return False, f"File too large. Maximum size is {max_mb}MB"
    
    return True, ""


def sanitize_text(text: str) -> str:
    """
    Sanitize text input to prevent XSS
    Removes potentially dangerous characters but keeps basic formatting
    """
    if not text:
        return ""
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Remove control characters except newlines and tabs
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\t')
    
    return text.strip()


def contains_harmful_content(text: str) -> bool:
    """
    Basic check for harmful content
    In production, use a more sophisticated content moderation service
    """
    if not text:
        return False
    
    text_lower = text.lower()
    
    # Common spam/scam indicators
    harmful_patterns = [
        r'\b(viagra|cialis|lottery|inheritance)\b',
        r'\b(click here|free money|earn \$\$\$)\b',
        r'(https?://)?bit\.ly',  # Shortened links
        r'paypal\.me',
        r'venmo\.com',
        r'cashapp\.com',
    ]
    
    for pattern in harmful_patterns:
        if re.search(pattern, text_lower):
            return True
    
    # Check for excessive special characters (possible obfuscation)
    special_chars = sum(1 for c in text if not c.isalnum() and c not in ' \n\t.,!?\'"()-')
    if len(text) > 10 and special_chars / len(text) > 0.3:
        return True
    
    return False


def validate_report_reason(reason: str) -> Tuple[bool, str]:
    """Validate user report reason"""
    valid_reasons = [
        'spam',
        'harassment',
        'inappropriate_content',
        'fake_profile',
        'underage',
        'scam',
        'other'
    ]
    
    if reason not in valid_reasons:
        return False, f"Invalid report reason. Must be one of: {', '.join(valid_reasons)}"
    
    return True, ""


def validate_location(location: Optional[str]) -> Tuple[bool, str]:
    """Validate location string"""
    if location is None or len(location.strip()) == 0:
        return True, ""  # Location is optional
    
    location = location.strip()
    
    if len(location) > 200:
        return False, "Location must be less than 200 characters"
    
    # Basic format check for city, state or city, country
    if not re.match(r"^[a-zA-Z\s,.\-'()]+$", location):
        return False, "Location contains invalid characters"
    
    return True, ""


def validate_occupation(occupation: Optional[str]) -> Tuple[bool, str]:
    """Validate occupation"""
    if occupation is None or len(occupation.strip()) == 0:
        return True, ""  # Occupation is optional
    
    occupation = occupation.strip()
    
    if len(occupation) > 100:
        return False, "Occupation must be less than 100 characters"
    
    return True, ""


def validate_interests(interests: Optional[str]) -> Tuple[bool, str]:
    """Validate interests (comma-separated or JSON)"""
    if interests is None or len(interests.strip()) == 0:
        return True, ""  # Interests are optional
    
    if len(interests) > 500:
        return False, "Interests list is too long"
    
    return True, ""


# Utility function to validate all profile data at once
def validate_profile_data(data: dict) -> Tuple[bool, str]:
    """
    Validate complete profile data
    Returns: (is_valid, error_message)
    """
    # Required fields
    if 'name' in data:
        valid, msg = validate_name(data['name'])
        if not valid:
            return False, msg
    
    if 'age' in data:
        valid, msg = validate_age(data['age'])
        if not valid:
            return False, msg
    
    if 'gender' in data:
        valid, msg = validate_gender(data['gender'])
        if not valid:
            return False, msg
    
    # Optional fields
    if 'bio' in data:
        valid, msg = validate_bio(data.get('bio'))
        if not valid:
            return False, msg
    
    if 'location' in data:
        valid, msg = validate_location(data.get('location'))
        if not valid:
            return False, msg
    
    if 'occupation' in data:
        valid, msg = validate_occupation(data.get('occupation'))
        if not valid:
            return False, msg
    
    # Validate prompt answers
    for i in range(1, 4):
        answer_key = f'prompt{i}_answer'
        if answer_key in data:
            valid, msg = validate_prompt_answer(data.get(answer_key))
            if not valid:
                return False, f"Prompt {i}: {msg}"
    
    return True, ""
