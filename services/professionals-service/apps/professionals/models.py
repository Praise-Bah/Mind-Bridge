from django.db import models
from mindbridge_common.models import BaseModel


class UserSnapshot(BaseModel):
    """Read-only replica of auth-service user data."""
    user_id = models.UUIDField(unique=True, db_index=True)
    username = models.CharField(max_length=150)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    avatar_url = models.CharField(max_length=500, blank=True)
    is_professional = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)

    class Meta:
        db_table = 'user_snapshots'

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.username

    def __str__(self):
        return self.username


class Specialization(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        db_table = 'specializations'

    def __str__(self):
        return self.name


class ProfessionalProfile(BaseModel):
    """Extended profile for mental health professionals.

    user_id is the UUID from auth-service JWT — no FK to User model.
    user_snapshot is populated from professional.application_approved event.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    GENDER_CHOICES = [
        ('male', 'Male'), ('female', 'Female'), ('prefer_not', 'Prefer Not to Say'),
    ]

    user_id = models.UUIDField(unique=True, db_index=True)
    # Denormalized display data — updated from user.profile_updated event
    user_full_name = models.CharField(max_length=255, blank=True)
    user_avatar_url = models.CharField(max_length=500, blank=True)
    user_is_online = models.BooleanField(default=False)
    user_email = models.EmailField(blank=True)

    title = models.CharField(max_length=100)
    bio = models.TextField()
    credentials = models.TextField()
    years_of_experience = models.PositiveIntegerField()
    specializations = models.ManyToManyField(Specialization, related_name='professionals', blank=True)
    languages = models.JSONField(default=list)
    session_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    intro_video = models.FileField(upload_to='professional_videos/', blank=True, null=True)
    credential_documents = models.FileField(upload_to='credentials/', blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    payout_requested = models.BooleanField(default=False)

    class Meta:
        db_table = 'professional_profiles'

    def __str__(self):
        return f'{self.user_full_name or self.user_id} - {self.title}'


class Availability(BaseModel):
    WEEKDAYS = [
        (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'),
        (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday'),
    ]

    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name='availabilities')
    weekday = models.IntegerField(choices=WEEKDAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = 'availabilities'
        unique_together = ['professional', 'weekday', 'start_time']


class Booking(BaseModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'), ('confirmed', 'Confirmed'),
        ('completed', 'Completed'), ('cancelled', 'Cancelled'),
    ]

    user_id = models.UUIDField(db_index=True)  # no FK — resolved via UserSnapshot
    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name='bookings')
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-scheduled_date', '-scheduled_time']


class FavouriteProfessional(BaseModel):
    user_id = models.UUIDField(db_index=True)
    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name='favourited_by')

    class Meta:
        db_table = 'favourite_professionals'
        unique_together = ['user_id', 'professional']


class Review(BaseModel):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    rating = models.PositiveIntegerField()
    comment = models.TextField(blank=True)

    class Meta:
        db_table = 'reviews'


class SessionNote(BaseModel):
    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name='session_notes')
    patient_id = models.UUIDField(db_index=True)  # no FK
    content = models.TextField()

    class Meta:
        db_table = 'session_notes'
        ordering = ['-created_at']
