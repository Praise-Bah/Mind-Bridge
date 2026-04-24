from rest_framework import serializers
from django.db import models
from .models import Specialization, ProfessionalProfile, Availability, Booking, Review


class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ['id', 'name', 'slug']


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ['id', 'weekday', 'start_time', 'end_time', 'is_available']


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='booking.user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'reviewer_name', 'created_at']


class ProfessionalProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    specializations = SpecializationSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = ProfessionalProfile
        fields = ['id', 'user', 'user_name', 'user_avatar', 'title', 'bio',
                  'credentials', 'years_of_experience', 'specializations',
                  'languages', 'session_rate', 'intro_video', 'average_rating',
                  'review_count', 'status', 'created_at']

    def get_average_rating(self, obj):
        reviews = Review.objects.filter(booking__professional=obj)
        if reviews.exists():
            return round(reviews.aggregate(models.Avg('rating'))['rating__avg'], 1)
        return None

    def get_review_count(self, obj):
        return Review.objects.filter(booking__professional=obj).count()


class BookingSerializer(serializers.ModelSerializer):
    professional_name = serializers.CharField(source='professional.user.get_full_name', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'user', 'professional', 'professional_name', 'scheduled_date',
                  'scheduled_time', 'duration_minutes', 'description', 'status',
                  'notes', 'created_at']
        read_only_fields = ['id', 'user', 'status', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
