import random
import string
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from .models import EmailVerificationCode, PasswordResetToken


def generate_otp_code():
    return ''.join(random.choices(string.digits, k=6))


def create_verification_code(user):
    EmailVerificationCode.objects.filter(user=user, is_used=False).update(is_used=True)
    code = generate_otp_code()
    verification = EmailVerificationCode.objects.create(
        user=user, code=code, expires_at=timezone.now() + timedelta(minutes=15)
    )
    return verification


def create_password_reset_token(user):
    PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
    code = generate_otp_code()
    token = PasswordResetToken.objects.create(
        user=user, code=code, expires_at=timezone.now() + timedelta(hours=1)
    )
    return token


def send_verification_email(user, code):
    subject = 'Verify Your MindBridge Account'
    message = (
        f"Hello {user.first_name or user.username},\n\n"
        f"Welcome to MindBridge! Your verification code is:\n\n{code}\n\n"
        f"This code expires in 15 minutes.\n\nThe MindBridge Team"
    )
    html_message = f"""<!DOCTYPE html>
<html><head><style>
body{{font-family:Arial,sans-serif;line-height:1.6;color:#333}}
.container{{max-width:600px;margin:0 auto;padding:20px}}
.logo{{font-size:28px;font-weight:bold;color:#6366f1;text-align:center;padding:20px 0}}
.code-box{{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:32px;
  letter-spacing:8px;padding:20px 40px;border-radius:12px;text-align:center;margin:30px 0}}
.footer{{text-align:center;color:#666;font-size:12px;margin-top:40px}}
</style></head><body><div class="container">
<div class="logo">MindBridge</div>
<p>Hello {user.first_name or user.username},</p>
<p>Welcome to MindBridge! Your verification code is:</p>
<div class="code-box">{code}</div>
<p>This code expires in <strong>15 minutes</strong>.</p>
<div class="footer"><p>The MindBridge Team &mdash; &copy; 2025 MindBridge</p></div>
</div></body></html>"""
    send_mail(
        subject=subject, message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message, fail_silently=False,
    )


def send_password_reset_email(user, code):
    subject = 'Reset Your MindBridge Password'
    message = (
        f"Hello {user.first_name or user.username},\n\n"
        f"Your password reset code is:\n\n{code}\n\n"
        f"This code expires in 1 hour.\n\nThe MindBridge Team"
    )
    html_message = f"""<!DOCTYPE html>
<html><head><style>
body{{font-family:Arial,sans-serif;line-height:1.6;color:#333}}
.container{{max-width:600px;margin:0 auto;padding:20px}}
.logo{{font-size:28px;font-weight:bold;color:#6366f1;text-align:center;padding:20px 0}}
.code-box{{background:linear-gradient(135deg,#ef4444,#f97316);color:white;font-size:32px;
  letter-spacing:8px;padding:20px 40px;border-radius:12px;text-align:center;margin:30px 0}}
.footer{{text-align:center;color:#666;font-size:12px;margin-top:40px}}
</style></head><body><div class="container">
<div class="logo">MindBridge</div>
<p>Hello {user.first_name or user.username},</p>
<p>Your password reset code is:</p>
<div class="code-box">{code}</div>
<p>This code expires in <strong>1 hour</strong>.</p>
<div class="footer"><p>The MindBridge Team &mdash; &copy; 2025 MindBridge</p></div>
</div></body></html>"""
    send_mail(
        subject=subject, message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message, fail_silently=False,
    )
