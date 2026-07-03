from django.db import models
from django.conf import settings
from apps.users.models import BaseModel


class Specialization(BaseModel):
    """Professional specialization tags."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        db_table = 'specializations'

    def __str__(self):
        return self.name


class ProfessionalProfile(BaseModel):
    """Extended profile for mental health professionals."""
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='professional_profile'
    )
    title = models.CharField(max_length=100)
    bio = models.TextField()
    credentials = models.TextField()
    years_of_experience = models.PositiveIntegerField()
    specializations = models.ManyToManyField(Specialization, related_name='professionals')
    languages = models.JSONField(default=list)
    session_rate = models.DecimalField(max_digits=10, decimal_places=2)
    intro_video = models.FileField(upload_to='professional_videos/', blank=True, null=True)
    credential_documents = models.FileField(upload_to='credentials/', blank=True, null=True)
    cv = models.FileField(upload_to='professional_cvs/', blank=True, null=True,
                          help_text='Private CV — visible only to the professional and admins.')

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('prefer_not', 'Prefer Not to Say'),
    ]

    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    rejection_reason = models.TextField(blank=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    payout_requested = models.BooleanField(default=False)

    class Meta:
        db_table = 'professional_profiles'

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.title}"


class Availability(BaseModel):
    """Professional availability slots."""
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
    """Session booking between user and professional."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name='bookings')
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-scheduled_date', '-scheduled_time']
        indexes = [
            models.Index(fields=['professional', 'status'], name='booking_professional_stat_idx'),
            models.Index(fields=['user', 'status'], name='booking_user_status_idx'),
            models.Index(fields=['scheduled_date'], name='booking_scheduled_date_idx'),
        ]


class FavouriteProfessional(BaseModel):
    """User-saved favourite professionals."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favourite_professionals'
    )
    professional = models.ForeignKey(
        ProfessionalProfile, on_delete=models.CASCADE, related_name='favourited_by'
    )

    class Meta:
        db_table = 'favourite_professionals'
        unique_together = ['user', 'professional']


class Review(BaseModel):
    """Client review for a professional."""
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    rating = models.PositiveIntegerField()
    comment = models.TextField(blank=True)

    class Meta:
        db_table = 'reviews'


class SessionNote(BaseModel):
    """Private session notes written by a professional about a patient."""
    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name='session_notes')
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_notes')
    content = models.TextField()

    class Meta:
        db_table = 'session_notes'
        ordering = ['-created_at']

    def __str__(self):
        return f"Note by {self.professional} about {self.patient.username}"
