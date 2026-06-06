from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import (
    UserMood, EmailVerificationCode, PasswordResetToken,
    ProfessionalApplication, UserSession, UserGoal,
)

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['user', 'professional'], default='user', write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'password_confirm',
                  'first_name', 'last_name', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role = validated_data.pop('role', 'user')
        user = User.objects.create_user(**validated_data)
        user.is_verified = False
        user.save()
        if role == 'professional':
            ProfessionalApplication.objects.create(user=user)
        return user


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'User not found.'})

        verification = EmailVerificationCode.objects.filter(
            user=user, code=attrs['code'], is_used=False
        ).first()

        if not verification:
            raise serializers.ValidationError({'code': 'Invalid verification code.'})
        if verification.is_expired:
            raise serializers.ValidationError({'code': 'Verification code has expired.'})

        attrs['user'] = user
        attrs['verification'] = verification
        return attrs


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('User not found.')
        if user.is_verified:
            raise serializers.ValidationError('Email is already verified.')
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            pass
        return value


class VerifyResetCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'User not found.'})

        reset_token = PasswordResetToken.objects.filter(
            user=user, code=attrs['code'], is_used=False
        ).first()

        if not reset_token:
            raise serializers.ValidationError({'code': 'Invalid reset code.'})
        if reset_token.is_expired:
            raise serializers.ValidationError({'code': 'Reset code has expired.'})

        attrs['user'] = user
        attrs['reset_token'] = reset_token
        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})

        try:
            user = User.objects.get(email=attrs['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'User not found.'})

        reset_token = PasswordResetToken.objects.filter(
            user=user, code=attrs['code'], is_used=False
        ).first()

        if not reset_token:
            raise serializers.ValidationError({'code': 'Invalid reset code.'})
        if reset_token.is_expired:
            raise serializers.ValidationError({'code': 'Reset code has expired.'})

        attrs['user'] = user
        attrs['reset_token'] = reset_token
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    token = serializers.CharField()
    role = serializers.ChoiceField(choices=['user', 'professional'], default='user')


class ProfessionalApplicationSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ProfessionalApplication
        fields = ['id', 'user', 'user_email', 'user_name', 'credentials_document',
                  'license_number', 'specializations', 'years_of_experience', 'bio',
                  'status', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'created_at']
        read_only_fields = ['id', 'user', 'status', 'reviewed_by', 'reviewed_at', 'created_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


class UserSerializer(serializers.ModelSerializer):
    joined_date = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name',
                  'avatar', 'bio', 'date_of_birth', 'timezone', 'joined_date',
                  'is_professional', 'is_verified', 'is_online', 'last_seen',
                  'is_staff', 'created_at']
        read_only_fields = ['id', 'email', 'is_professional', 'is_verified',
                            'is_online', 'last_seen', 'is_staff', 'created_at', 'joined_date']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'avatar', 'bio', 'date_of_birth',
                  'phone_number', 'timezone', 'daily_notification_time',
                  'email_notifications_enabled', 'push_notifications_enabled']


class UserMoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserMood
        fields = ['id', 'mood_score', 'note', 'recorded_date', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class PrivacySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['anonymous_mode', 'profile_visibility', 'allow_messages_from']


class AppearanceSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['theme', 'text_size']


class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['daily_notification_time', 'email_notifications_enabled',
                  'push_notifications_enabled']


class UserSessionSerializer(serializers.ModelSerializer):
    device_name = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    is_current = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = ['id', 'session_key', 'ip_address', 'user_agent', 'device_info',
                  'last_activity', 'is_active', 'device_name', 'location', 'is_current']
        read_only_fields = ['id', 'session_key', 'ip_address', 'user_agent',
                            'device_info', 'last_activity']

    def get_device_name(self, obj):
        return (obj.device_info or {}).get('device_name', 'Unknown Device')

    def get_location(self, obj):
        return (obj.device_info or {}).get('location', 'Unknown Location')

    def get_is_current(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'session'):
            return obj.session_key == request.session.session_key
        return False


class AccountActionSerializer(serializers.Serializer):
    password = serializers.CharField(required=True)
    confirmation = serializers.CharField(required=True)

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.check_password(attrs.get('password')):
            raise serializers.ValidationError({'password': 'Password is incorrect.'})
        return attrs


class DeactivateAccountSerializer(AccountActionSerializer):
    pass


class DeleteAccountSerializer(AccountActionSerializer):
    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs.get('confirmation', '').lower() != 'delete my account':
            raise serializers.ValidationError(
                {'confirmation': 'Please type "delete my account" exactly to confirm.'}
            )
        return attrs


class UserGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserGoal
        fields = ['id', 'title', 'description', 'category', 'target_date',
                  'is_completed', 'progress', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
