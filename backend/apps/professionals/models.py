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
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    approved_at = models.DateTimeField(blank=True, null=True)

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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-scheduled_date', '-scheduled_time']


class Review(BaseModel):
    """Client review for a professional."""
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    rating = models.PositiveIntegerField()
    comment = models.TextField(blank=True)

    class Meta:
        db_table = 'reviews'
