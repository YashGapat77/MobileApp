"""
PROFILE MODEL
Handles dating profile operations
"""

import json
from typing import Optional, Dict, List
from datetime import datetime
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from models.database import get_db

class Profile:
    """Dating profile model"""
    
    def __init__(self, **kwargs):
        """Initialize profile with keyword arguments"""
        self.id = kwargs.get('id')
        self.user_id = kwargs.get('user_id')
        self.name = kwargs.get('name')
        self.age = kwargs.get('age')
        self.gender = kwargs.get('gender')
        self.looking_for = kwargs.get('looking_for')
        self.bio = kwargs.get('bio')
        self.location = kwargs.get('location')
        self.occupation = kwargs.get('occupation')
        self.education = kwargs.get('education')
        self.height = kwargs.get('height')
        
        # Prompts
        self.prompt1_question = kwargs.get('prompt1_question')
        self.prompt1_answer = kwargs.get('prompt1_answer')
        self.prompt2_question = kwargs.get('prompt2_question')
        self.prompt2_answer = kwargs.get('prompt2_answer')
        self.prompt3_question = kwargs.get('prompt3_question')
        self.prompt3_answer = kwargs.get('prompt3_answer')
        
        # JSON fields
        self.interests = kwargs.get('interests', '[]')
        self.dealbreakers = kwargs.get('dealbreakers', '[]')
        self.photos = kwargs.get('photos', '[]')
        
        # Metadata
        self.profile_completed = kwargs.get('profile_completed', False)
        self.completion_percentage = kwargs.get('completion_percentage', 0)
        self.created_at = kwargs.get('created_at')
        self.updated_at = kwargs.get('updated_at')
    
    @staticmethod
    def create(user_id: int, profile_data: Dict) -> Optional['Profile']:
        """
        Create a new profile
        
        Args:
            user_id: User's ID
            profile_data: Dictionary with profile information
        
        Returns:
            Profile object if successful, None otherwise
        """
        # Check if profile already exists
        existing = Profile.get_by_user_id(user_id)
        if existing:
            print(f"❌ Profile already exists for user {user_id}")
            return None
        
        # Validate required fields
        required = ['name', 'age', 'gender', 'looking_for']
        for field in required:
            if field not in profile_data:
                print(f"❌ Missing required field: {field}")
                return None
        
        with get_db() as conn:
            # Convert lists to JSON strings
            interests_json = json.dumps(profile_data.get('interests', []))
            dealbreakers_json = json.dumps(profile_data.get('dealbreakers', []))
            photos_json = json.dumps(profile_data.get('photos', []))
            
            cursor = conn.execute("""
                INSERT INTO profiles (
                    user_id, name, age, gender, looking_for, bio, location,
                    occupation, education, height,
                    prompt1_question, prompt1_answer,
                    prompt2_question, prompt2_answer,
                    prompt3_question, prompt3_answer,
                    interests, dealbreakers, photos
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                profile_data['name'],
                profile_data['age'],
                profile_data['gender'],
                profile_data['looking_for'],
                profile_data.get('bio'),
                profile_data.get('location'),
                profile_data.get('occupation'),
                profile_data.get('education'),
                profile_data.get('height'),
                profile_data.get('prompt1_question'),
                profile_data.get('prompt1_answer'),
                profile_data.get('prompt2_question'),
                profile_data.get('prompt2_answer'),
                profile_data.get('prompt3_question'),
                profile_data.get('prompt3_answer'),
                interests_json,
                dealbreakers_json,
                photos_json
            ))
            
            profile_id = cursor.lastrowid
            
            # Update completion percentage
            Profile._update_completion(profile_id)
            
            print(f"✅ Profile created with ID: {profile_id}")
            
            return Profile.get_by_id(profile_id)
    
    @staticmethod
    def get_by_id(profile_id: int) -> Optional['Profile']:
        """Get profile by ID"""
        with get_db() as conn:
            row = conn.execute(
                "SELECT * FROM profiles WHERE id = ?",
                (profile_id,)
            ).fetchone()
            
            if row:
                return Profile(**dict(row))
            return None
    
    @staticmethod
    def get_by_user_id(user_id: int) -> Optional['Profile']:
        """Get profile by user ID"""
        with get_db() as conn:
            row = conn.execute(
                "SELECT * FROM profiles WHERE user_id = ?",
                (user_id,)
            ).fetchone()
            
            if row:
                return Profile(**dict(row))
            return None
    
    def update(self, update_data: Dict) -> bool:
        """
        Update profile
        
        Args:
            update_data: Dictionary with fields to update
        
        Returns:
            True if successful
        """
        # Fields that can be updated
        allowed_fields = [
            'name', 'age', 'bio', 'location', 'occupation', 'education', 'height',
            'prompt1_question', 'prompt1_answer',
            'prompt2_question', 'prompt2_answer',
            'prompt3_question', 'prompt3_answer',
            'interests', 'dealbreakers', 'photos'
        ]
        
        # Build UPDATE query dynamically
        updates = []
        values = []
        
        for field, value in update_data.items():
            if field in allowed_fields:
                # Convert lists to JSON for JSON fields
                if field in ['interests', 'dealbreakers', 'photos'] and isinstance(value, list):
                    value = json.dumps(value)
                
                updates.append(f"{field} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        # Add updated_at
        updates.append("updated_at = ?")
        values.append(datetime.now())
        values.append(self.id)
        
        with get_db() as conn:
            conn.execute(f"""
                UPDATE profiles 
                SET {', '.join(updates)}
                WHERE id = ?
            """, values)
        
        # Update completion percentage
        Profile._update_completion(self.id)
        
        print(f"✅ Profile {self.id} updated")
        return True
    
    @staticmethod
    def _update_completion(profile_id: int):
        """Calculate and update profile completion percentage"""
        profile = Profile.get_by_id(profile_id)
        if not profile:
            return
        
        # Fields to check for completion
        checks = {
            'basic_info': all([profile.name, profile.age, profile.gender, profile.looking_for]),
            'location': bool(profile.location),
            'bio': bool(profile.bio and len(profile.bio) > 20),
            'occupation': bool(profile.occupation),
            'prompt1': bool(profile.prompt1_question and profile.prompt1_answer),
            'prompt2': bool(profile.prompt2_question and profile.prompt2_answer),
            'prompt3': bool(profile.prompt3_question and profile.prompt3_answer),
            'interests': len(json.loads(profile.interests)) >= 3,
            'photos': len(json.loads(profile.photos)) >= 2
        }
        
        # Calculate percentage
        completed = sum(checks.values())
        total = len(checks)
        percentage = int((completed / total) * 100)
        
        is_completed = percentage >= 80  # 80% threshold
        
        with get_db() as conn:
            conn.execute("""
                UPDATE profiles 
                SET completion_percentage = ?, profile_completed = ?
                WHERE id = ?
            """, (percentage, is_completed, profile_id))
    
    def to_dict(self, include_private: bool = False) -> Dict:
        """
        Convert profile to dictionary
        
        Args:
            include_private: Include private info (for own profile)
        
        Returns:
            Dictionary representation
        """
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'location': self.location,
            'bio': self.bio,
            'occupation': self.occupation,
            'education': self.education,
            'height': self.height,
            'prompts': [
                {
                    'question': self.prompt1_question,
                    'answer': self.prompt1_answer
                } if self.prompt1_question else None,
                {
                    'question': self.prompt2_question,
                    'answer': self.prompt2_answer
                } if self.prompt2_question else None,
                {
                    'question': self.prompt3_question,
                    'answer': self.prompt3_answer
                } if self.prompt3_question else None
            ],
            'interests': json.loads(self.interests) if self.interests else [],
            'photos': json.loads(self.photos) if self.photos else [],
            'completion_percentage': self.completion_percentage,
            'profile_completed': bool(self.profile_completed)
        }
        
        # Remove None prompts
        data['prompts'] = [p for p in data['prompts'] if p]
        
        if include_private:
            data['dealbreakers'] = json.loads(self.dealbreakers) if self.dealbreakers else []
            data['looking_for'] = self.looking_for
        
        # Always include user_id for frontend actions
        data['user_id'] = self.user_id
        
        return data
    
    @staticmethod
    def get_available_prompts(category: Optional[str] = None) -> List[Dict]:
        """Get available prompt questions from library"""
        with get_db() as conn:
            if category:
                rows = conn.execute("""
                    SELECT question, category FROM prompt_library 
                    WHERE is_active = 1 AND category = ?
                    ORDER BY question
                """, (category,)).fetchall()
            else:
                rows = conn.execute("""
                    SELECT question, category FROM prompt_library 
                    WHERE is_active = 1
                    ORDER BY category, question
                """).fetchall()
            
            return [{'question': row['question'], 'category': row['category']} for row in rows]


# Test the Profile model
if __name__ == '__main__':
    print("\n" + "="*60)
    print("Testing Profile Model")
    print("="*60 + "\n")
    
    # Test 1: Get available prompts
    print("Test 1: Get available prompts")
    prompts = Profile.get_available_prompts()
    print(f"✅ Available prompts: {len(prompts)}")
    if prompts:
        print(f"   Example: {prompts[0]['question']}")
    
    # Test 2: Create profile
    print("\nTest 2: Create profile")
    profile_data = {
        'name': 'Sarah Chen',
        'age': 28,
        'gender': 'female',
        'looking_for': 'male',
        'location': 'San Francisco, CA',
        'bio': 'Coffee enthusiast, weekend hiker, and bookworm',
        'occupation': 'Software Engineer',
        'education': 'BS Computer Science',
        'height': 165,
        'prompt1_question': 'A perfect Sunday for me is...',
        'prompt1_answer': 'Farmers market, brunch, then reading in the park',
        'interests': ['Coffee', 'Hiking', 'Reading', 'Photography'],
        'photos': ['photo1.jpg', 'photo2.jpg']
    }
    
    # Use a dummy user ID for testing if needed, or rely on existing DB state
    # profile = Profile.create(user_id=1, profile_data=profile_data)
    # if profile:
    #     print(f"✅ Profile created: {profile.name}")
    #     print(f"   Completion: {profile.completion_percentage}%")
    
    print("\n" + "="*60 + "\n")