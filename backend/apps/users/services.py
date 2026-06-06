import random
import string
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from .models import EmailVerificationCode, PasswordResetToken


def generate_otp_code():
    """Generate a 6-digit OTP code."""
    return ''.join(random.choices(string.digits, k=6))


def create_verification_code(user):
    """Create a new email verification code for a user."""
    # Invalidate any existing codes
    EmailVerificationCode.objects.filter(user=user, is_used=False).update(is_used=True)
    
    code = generate_otp_code()
    expires_at = timezone.now() + timedelta(minutes=15)
    
    verification = EmailVerificationCode.objects.create(
        user=user,
        code=code,
        expires_at=expires_at
    )
    return verification


def create_password_reset_token(user):
    """Create a new password reset token for a user."""
    # Invalidate any existing tokens
    PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
    
    code = generate_otp_code()
    expires_at = timezone.now() + timedelta(hours=1)
    
    token = PasswordResetToken.objects.create(
        user=user,
        code=code,
        expires_at=expires_at
    )
    return token


def send_verification_email(user, code):
    """Send email verification OTP to user."""
    subject = 'Verify Your MindBridge Account'
    
    # Plain text version
    message = f"""
Hello {user.first_name or user.username},

Welcome to MindBridge! Please verify your email address by entering the following code:

{code}

This code will expire in 15 minutes.

If you didn't create an account with MindBridge, please ignore this email.

Best regards,
The MindBridge Team
"""
    
    # HTML version
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ text-align: center; padding: 20px 0; }}
        .logo {{ font-size: 28px; font-weight: bold; color: #6366f1; }}
        .code-box {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-size: 32px; letter-spacing: 8px; padding: 20px 40px; border-radius: 12px; text-align: center; margin: 30px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 40px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MindBridge</div>
            <p>Your Mental Health Companion</p>
        </div>
        
        <p>Hello {user.first_name or user.username},</p>
        
        <p>Welcome to MindBridge! Please verify your email address by entering the following code:</p>
        
        <div class="code-box">{code}</div>
        
        <p>This code will expire in <strong>15 minutes</strong>.</p>
        
        <p>If you didn't create an account with MindBridge, please ignore this email.</p>
        
        <div class="footer">
            <p>Best regards,<br>The MindBridge Team</p>
            <p>&copy; 2025 MindBridge. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False
    )


def send_password_reset_email(user, code):
    """Send password reset OTP to user."""
    subject = 'Reset Your MindBridge Password'
    
    # Plain text version
    message = f"""
Hello {user.first_name or user.username},

We received a request to reset your MindBridge password. Enter the following code to proceed:

{code}

This code will expire in 1 hour.

If you didn't request a password reset, please ignore this email or contact support if you're concerned.

Best regards,
The MindBridge Team
"""
    
    # HTML version
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ text-align: center; padding: 20px 0; }}
        .logo {{ font-size: 28px; font-weight: bold; color: #6366f1; }}
        .code-box {{ background: linear-gradient(135deg, #ef4444, #f97316); color: white; font-size: 32px; letter-spacing: 8px; padding: 20px 40px; border-radius: 12px; text-align: center; margin: 30px 0; }}
        .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 40px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MindBridge</div>
            <p>Password Reset Request</p>
        </div>
        
        <p>Hello {user.first_name or user.username},</p>
        
        <p>We received a request to reset your MindBridge password. Enter the following code to proceed:</p>
        
        <div class="code-box">{code}</div>
        
        <p>This code will expire in <strong>1 hour</strong>.</p>
        
        <div class="warning">
            <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The MindBridge Team</p>
            <p>&copy; 2025 MindBridge. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False
    )


def send_professional_approval_email(user):
    """Send email when professional application is approved."""
    subject = 'Your MindBridge Professional Application is Approved!'
    
    message = f"""
Hello {user.first_name or user.username},

Great news! Your application to become a MindBridge professional has been approved.

You can now:
- Appear in the professional directory
- Receive chat sessions from users
- Set your availability and session rates
- Access the professional dashboard

Log in to your account to get started: {settings.FRONTEND_URL}/login

Welcome to the MindBridge professional community!

Best regards,
The MindBridge Team
"""
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False
    )


def send_professional_rejection_email(user, reason=''):
    """Send email when professional application is rejected."""
    subject = 'Update on Your MindBridge Professional Application'
    
    reason_text = f"\n\nReason: {reason}" if reason else ""
    
    message = f"""
Hello {user.first_name or user.username},

Thank you for your interest in becoming a MindBridge professional.

After reviewing your application, we are unable to approve it at this time.{reason_text}

If you believe this was a mistake or would like to provide additional information, please contact our support team.

Best regards,
The MindBridge Team
"""
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False
    )
