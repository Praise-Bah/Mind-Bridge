from rest_framework import serializers
from django.db import models
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
    reviewer_name = serializers.CharField(source='booking.user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'reviewer_name', 'created_at']


class ProfessionalProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    is_online = serializers.BooleanField(source='user.is_online', read_only=True)
    specializations = SpecializationSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_favourite = serializers.SerializerMethodField()

    class Meta:
        model = ProfessionalProfile
        fields = ['id', 'user', 'user_name', 'user_avatar', 'is_online', 'title', 'bio',
                  'credentials', 'years_of_experience', 'specializations', 'gender',
                  'languages', 'session_rate', 'intro_video', 'average_rating',
                  'review_count', 'is_favourite', 'status', 'created_at']

    def get_average_rating(self, obj):
        ann = getattr(obj, 'avg_rating_ann', None)
        if ann is not None:
            return round(ann, 1)
        reviews = Review.objects.filter(booking__professional=obj)
        if reviews.exists():
            return round(reviews.aggregate(models.Avg('rating'))['rating__avg'], 1)
        return None

    def get_review_count(self, obj):
        ann = getattr(obj, 'review_count_ann', None)
        return ann if ann is not None else Review.objects.filter(booking__professional=obj).count()

    def get_is_favourite(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return False
        favourite_ids = self.context.get('favourite_ids')
        if favourite_ids is not None:
            return obj.id in favourite_ids
        return FavouriteProfessional.objects.filter(user=request.user, professional=obj).exists()


class OwnProfessionalProfileSerializer(ProfessionalProfileSerializer):
    """Serializer for a professional viewing their own profile — includes private fields like CV."""
    class Meta(ProfessionalProfileSerializer.Meta):
        fields = ProfessionalProfileSerializer.Meta.fields + ['cv']


class BookingSerializer(serializers.ModelSerializer):
    professional_name = serializers.CharField(source='professional.user.get_full_name', read_only=True)
    has_review = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = ['id', 'user', 'professional', 'professional_name', 'scheduled_date',
                  'scheduled_time', 'duration_minutes', 'description', 'status',
                  'notes', 'has_review', 'created_at']
        read_only_fields = ['id', 'user', 'status', 'created_at']

    def get_has_review(self, obj):
        return hasattr(obj, 'review')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class FavouriteProfessionalSerializer(serializers.ModelSerializer):
    professional = ProfessionalProfileSerializer(read_only=True)

    class Meta:
        model = FavouriteProfessional
        fields = ['id', 'professional', 'created_at']
