from rest_framework import serializers
from django.db import models as dj_models
from .models import Specialization, ProfessionalProfile, Availability, Booking, Review, FavouriteProfessional


class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ['id', 'name', 'slug']


class AvailabilitySerializer(serializers.ModelSerializer):
    weekday_name = serializers.CharField(source='get_weekday_display', read_only=True)

    class Meta:
        model = Availability
        fields = ['id', 'weekday', 'weekday_name', 'start_time', 'end_time', 'is_available']


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'reviewer_name', 'created_at']

    def get_reviewer_name(self, obj):
        from .models import UserSnapshot
        snap = UserSnapshot.objects.filter(user_id=obj.booking.user_id).first()
        return snap.username if snap else str(obj.booking.user_id)[:8]


class ProfessionalProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user_full_name', read_only=True)
    user_avatar = serializers.CharField(source='user_avatar_url', read_only=True)
    is_online = serializers.BooleanField(source='user_is_online', read_only=True)
    specializations = SpecializationSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_favourite = serializers.SerializerMethodField()

    class Meta:
        model = ProfessionalProfile
        fields = [
            'id', 'user_id', 'user_name', 'user_avatar', 'is_online',
            'title', 'bio', 'credentials', 'years_of_experience',
            'specializations', 'gender', 'languages', 'session_rate',
            'intro_video', 'average_rating', 'review_count', 'is_favourite',
            'status', 'created_at',
        ]

    def get_average_rating(self, obj):
        result = Review.objects.filter(booking__professional=obj).aggregate(
            avg=dj_models.Avg('rating')
        )
        return round(result['avg'], 1) if result['avg'] else None

    def get_review_count(self, obj):
        return Review.objects.filter(booking__professional=obj).count()

    def get_is_favourite(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'user_id'):
            return FavouriteProfessional.objects.filter(
                user_id=str(request.user.user_id), professional=obj
            ).exists()
        return False


class BookingSerializer(serializers.ModelSerializer):
    professional_name = serializers.SerializerMethodField()
    has_review = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'user_id', 'professional', 'professional_name',
            'scheduled_date', 'scheduled_time', 'duration_minutes',
            'description', 'status', 'notes', 'has_review', 'created_at',
        ]
        read_only_fields = ['id', 'user_id', 'status', 'created_at']

    def get_professional_name(self, obj):
        return obj.professional.user_full_name or str(obj.professional.user_id)[:8]

    def get_has_review(self, obj):
        return hasattr(obj, 'review')

    def create(self, validated_data):
        validated_data['user_id'] = str(self.context['request'].user.user_id)
        return super().create(validated_data)


class FavouriteProfessionalSerializer(serializers.ModelSerializer):
    professional = ProfessionalProfileSerializer(read_only=True)

    class Meta:
        model = FavouriteProfessional
        fields = ['id', 'professional', 'created_at']
