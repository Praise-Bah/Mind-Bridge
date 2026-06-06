from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.community.models import Report, CommunityGroup
from apps.users.models import ProfessionalApplication

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'avatar', 'is_staff', 'is_professional', 'is_verified',
            'is_active', 'role', 'date_joined', 'created_at',
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_role(self, obj):
        if obj.is_staff:
            return 'admin'
        if obj.is_professional:
            return 'professional'
        return 'user'


class PendingProfessionalSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    credential_url = serializers.SerializerMethodField()

    class Meta:
        model = ProfessionalApplication
        fields = [
            'id', 'user_email', 'user_name', 'bio', 'license_number',
            'years_of_experience', 'specializations', 'credential_url',
            'status', 'rejection_reason', 'created_at',
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_credential_url(self, obj):
        request = self.context.get('request')
        if obj.credentials_document and request:
            return request.build_absolute_uri(obj.credentials_document.url)
        return None


class PendingGroupSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = CommunityGroup
        fields = [
            'id', 'name', 'slug', 'description', 'group_type', 'custom_type',
            'visibility', 'cover_image_url', 'creation_reason',
            'created_by_username', 'created_by_email',
            'ai_total_score', 'ai_review_summary', 'ai_review_scores',
            'approval_status', 'rejection_reason', 'review_step', 'created_at',
        ]

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.url)
        return None


class ReportDetailSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)
    post_content = serializers.SerializerMethodField()
    comment_content = serializers.SerializerMethodField()
    content_author = serializers.SerializerMethodField()
    content_author_id = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'reporter_name', 'reason', 'details', 'is_resolved',
            'post', 'comment', 'post_content', 'comment_content',
            'content_author', 'content_author_id', 'created_at',
        ]

    def get_post_content(self, obj):
        if obj.post:
            return obj.post.content[:200]
        return None

    def get_comment_content(self, obj):
        if obj.comment:
            return obj.comment.content[:200]
        return None

    def get_content_author(self, obj):
        if obj.post:
            return obj.post.author.username
        if obj.comment:
            return obj.comment.author.username
        return None

    def get_content_author_id(self, obj):
        if obj.post:
            return str(obj.post.author_id)
        if obj.comment:
            return str(obj.comment.author_id)
        return None
