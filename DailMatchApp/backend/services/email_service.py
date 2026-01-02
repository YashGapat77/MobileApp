"""
Email Service Module
Handles sending emails for verification, password reset, etc.
"""

import os
from flask import render_template_string
from flask_mail import Mail, Message
import secrets
from datetime import datetime, timedelta
from typing import Optional

# Initialize Flask-Mail (will be configured in app.py)
mail = None

def init_mail(app):
    """Initialize mail with Flask app"""
    global mail
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@dailymatch.app')
    
    mail = Mail(app)
    return mail


def send_verification_email(email: str, token: str, base_url: str = "http://localhost:5000") -> bool:
    """
    Send email verification link
    
    Args:
        email: User's email address
        token: Verification token
        base_url: Base URL of the application
    
    Returns:
        bool: True if sent successfully
    """
    if not mail:
        print("Mail not initialized. Skipping email send.")
        return False
    
    try:
        verification_link = f"{base_url}/verify-email?token={token}"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #ff6b9d;">💝 Welcome to DailyMatch!</h1>
                    <p>Thanks for signing up! Please verify your email address to get started.</p>
                    
                    <a href="{verification_link}" 
                       style="display: inline-block; padding: 15px 30px; background: #ff6b9d; 
                              color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                        Verify Email Address
                    </a>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all;">
                        {verification_link}
                    </p>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                    </p>
                    
                    <p style="color: #999; font-size: 12px; margin-top: 40px;">
                        DailyMatch - Real Love, Not Endless Swiping
                    </p>
                </div>
            </body>
        </html>
        """
        
        text_body = f"""
        Welcome to DailyMatch!
        
        Thanks for signing up! Please verify your email address to get started.
        
        Click here to verify: {verification_link}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, you can safely ignore this email.
        
        DailyMatch - Real Love, Not Endless Swiping
        """
        
        msg = Message(
            subject="Verify your DailyMatch account",
            recipients=[email],
            html=html_body,
            body=text_body
        )
        
        mail.send(msg)
        return True
    
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        return False


def send_password_reset_email(email: str, token: str, base_url: str = "http://localhost:5000") -> bool:
    """
    Send password reset link
    
    Args:
        email: User's email address
        token: Reset token
        base_url: Base URL of the application
    
    Returns:
        bool: True if sent successfully
    """
    if not mail:
        print("Mail not initialized. Skipping email send.")
        return False
    
    try:
        reset_link = f"{base_url}/reset-password?token={token}"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #ff6b9d;">🔒 Reset Your Password</h1>
                    <p>We received a request to reset your DailyMatch password.</p>
                    
                    <a href="{reset_link}" 
                       style="display: inline-block; padding: 15px 30px; background: #ff6b9d; 
                              color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                        Reset Password
                    </a>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all;">
                        {reset_link}
                    </p>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        This link will expire in 1 hour. If you didn't request a password reset, 
                        please ignore this email or contact support if you have concerns.
                    </p>
                    
                    <p style="color: #999; font-size: 12px; margin-top: 40px;">
                        DailyMatch - Real Love, Not Endless Swiping
                    </p>
                </div>
            </body>
        </html>
        """
        
        text_body = f"""
        Reset Your Password
        
        We received a request to reset your DailyMatch password.
        
        Click here to reset: {reset_link}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
        
        DailyMatch - Real Love, Not Endless Swiping
        """
        
        msg = Message(
            subject="Reset your DailyMatch password",
            recipients=[email],
            html=html_body,
            body=text_body
        )
        
        mail.send(msg)
        return True
    
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
        return False


def send_match_notification(email: str, match_name: str, base_url: str = "http://localhost:5000") -> bool:
    """
    Send notification when users match
    
    Args:
        email: User's email address
        match_name: Name of the person they matched with
        base_url: Base URL of the application
    
    Returns:
        bool: True if sent successfully
    """
    if not mail:
        print("Mail not initialized. Skipping email send.")
        return False
    
    try:
        app_link = f"{base_url}/app.html"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #ff6b9d;">🎉 It's a Match!</h1>
                    <p style="font-size: 18px;">You and <strong>{match_name}</strong> liked each other!</p>
                    
                    <p>Start a conversation and see where it goes!</p>
                    
                    <a href="{app_link}" 
                       style="display: inline-block; padding: 15px 30px; background: #ff6b9d; 
                              color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                        Send a Message
                    </a>
                    
                    <p style="color: #999; font-size: 12px; margin-top: 40px;">
                        DailyMatch - Real Love, Not Endless Swiping
                    </p>
                </div>
            </body>
        </html>
        """
        
        msg = Message(
            subject=f"🎉 You matched with {match_name}!",
            recipients=[email],
            html=html_body
        )
        
        mail.send(msg)
        return True
    
    except Exception as e:
        print(f"Failed to send match notification: {e}")
        return False


def generate_verification_token() -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)


def generate_reset_token() -> str:
    """Generate a secure random token for password reset"""
    return secrets.token_urlsafe(32)
