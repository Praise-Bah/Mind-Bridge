import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True)

    timezone = models.CharField(max_length=50, default='UTC')
    daily_notification_time = models.TimeField(default='09:00:00')
    email_notifications_enabled = models.BooleanField(default=True)
    push_notifications_enabled = models.BooleanField(default=True)

    anonymous_mode = models.BooleanField(default=False)
    profile_visibility = models.CharField(
        max_length=20,
        choices=[('public', 'Public'), ('friends', 'Friends Only'), ('private', 'Private')],
        default='public',
    )
    allow_messages_from = models.CharField(
        max_length=20,
        choices=[('everyone', 'Everyone'), ('friends', 'Friends Only'), ('nobody', 'Nobody')],
        default='everyone',
    )

    theme = models.CharField(
        max_length=10,
        choices=[('light', 'Light'), ('dark', 'Dark'), ('system', 'System')],
        default='system',
    )
    text_size = models.CharField(
        max_length=10,
        choices=[('small', 'Small'), ('medium', 'Medium'), ('large', 'Large')],
        default='medium',
    )

    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)

    is_deactivated = models.BooleanField(default=False)
    deactivated_at = models.DateTimeField(null=True, blank=True)

    is_professional = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email


class UserMood(BaseModel):
    MOOD_CHOICES = [
        (1, 'Very Bad'), (2, 'Bad'), (3, 'Neutral'), (4, 'Good'), (5, 'Very Good'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='moods')
    mood_score = models.IntegerField(choices=MOOD_CHOICES)
    note = models.TextField(blank=True)
    recorded_date = models.DateField()

    class Meta:
        db_table = 'user_moods'
        unique_together = ['user', 'recorded_date']
        ordering = ['-recorded_date']


class EmailVerificationCode(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_codes')
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'email_verification_codes'
        ordering = ['-created_at']

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired


class PasswordResetToken(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_tokens'
        ordering = ['-created_at']

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired


class UserSession(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    device_info = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_sessions'
        ordering = ['-last_activity']


class UserGoal(BaseModel):
    CATEGORY_CHOICES = [
        ('wellness', 'Wellness'), ('social', 'Social'),
        ('professional', 'Professional'), ('personal', 'Personal'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='personal')
    target_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    progress = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_goals'
        ordering = ['-created_at']


class ProfessionalApplication(BaseModel):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'), ('approved', 'Approved'), ('rejected', 'Rejected'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='professional_application')
    credentials_document = models.FileField(upload_to='credentials/', blank=True, null=True)
    license_number = models.CharField(max_length=100, blank=True)
    specializations = models.JSONField(default=list)
    years_of_experience = models.PositiveIntegerField(default=0)
    bio = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviewed_applications',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = 'professional_applications'
        ordering = ['-created_at']

    def approve(self, admin_user):
        from django.utils import timezone
        self.status = 'approved'
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.save()
        self.user.is_professional = True
        self.user.is_verified = True
        self.user.save()
        # Publish event — professionals service handles ProfessionalProfile creation
        try:
            from mindbridge_common.events import publisher
            publisher.publish('professional.application_approved', {
                'user_id': str(self.user.id),
                'email': self.user.email,
                'username': self.user.username,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'bio': self.bio or '',
                'license_number': self.license_number or '',
                'years_of_experience': self.years_of_experience or 0,
                'specializations': self.specializations or [],
            }, service_origin='auth-service')
        except Exception:
            pass

    def reject(self, admin_user, reason=''):
        from django.utils import timezone
        self.status = 'rejected'
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.save()
