from rest_framework import serializers
from .models import CommunityGroup, Post, Comment, Reaction, Report, GroupInvitation
import re


class CommunityGroupSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    is_moderator = serializers.SerializerMethodField()
    created_by_username = serializers.SerializerMethodField()
    invite_url = serializers.SerializerMethodField()

    class Meta:
        model = CommunityGroup
        fields = [
            'id', 'name', 'slug', 'description', 'group_type', 'custom_type',
            'cover_image', 'member_count', 'is_member', 'is_moderator', 'is_active',
            'is_user_created', 'created_by', 'created_by_username', 'visibility',
            'invite_code', 'invite_url', 'is_approved', 'approval_status',
            'approved_at', 'rejection_reason',
        ]

    def get_member_count(self, obj):
        return obj.members.count()

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'user_id'):
            return obj.members.filter(user_id=request.user.user_id).exists()
        return False

    def get_is_moderator(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'user_id'):
            return obj.groupmembership_set.filter(
                user__user_id=request.user.user_id, is_moderator=True
            ).exists()
        return False

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else None

    def get_invite_url(self, obj):
        if obj.visibility == 'private':
            request = self.context.get('request')
            if request:
                return f"{request.build_absolute_uri('/')}community/join/{obj.invite_code}/"
        return None


class CommunityGroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityGroup
        fields = ['id', 'name', 'description', 'group_type', 'custom_type',
                  'visibility', 'cover_image', 'creation_reason']
        extra_kwargs = {
            'cover_image': {'required': False, 'allow_null': True},
            'creation_reason': {'required': False, 'allow_blank': True, 'default': ''},
        }

    def validate(self, data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'user_id'):
            count = CommunityGroup.objects.filter(
                created_by__user_id=str(request.user.user_id),
                is_user_created=True,
            ).count()
            if count >= 3:
                raise serializers.ValidationError(
                    'You have reached the maximum limit of 3 created groups.'
                )
        return data

    def create(self, validated_data):
        from .models import UserSnapshot
        request = self.context.get('request')
        snapshot, _ = UserSnapshot.objects.get_or_create(
            user_id=str(request.user.user_id),
            defaults={'username': request.user.username},
        )
        validated_data['created_by'] = snapshot
        validated_data['is_user_created'] = True
        validated_data['is_approved'] = False
        validated_data['approval_status'] = 'pending'
        validated_data['review_step'] = 'reason'

        name = validated_data['name']
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        original_slug = slug
        counter = 1
        while CommunityGroup.objects.filter(slug=slug).exists():
            slug = f'{original_slug}-{counter}'
            counter += 1
        validated_data['slug'] = slug
        return super().create(validated_data)


class ReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reaction
        fields = ['id', 'reaction_type', 'created_at']
        read_only_fields = ['id', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    user_can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'author_name', 'content',
            'is_anonymous', 'parent', 'replies', 'user_can_delete',
            'is_saved', 'expires_at', 'created_at',
        ]
        read_only_fields = ['id', 'author', 'created_at']

    def get_author_name(self, obj):
        return 'Anonymous Member' if obj.is_anonymous else obj.author.username

    def get_replies(self, obj):
        if obj.parent is None:
            replies = obj.replies.filter(is_deleted=False)
            return CommentSerializer(replies, many=True, context=self.context).data
        return []

    def get_user_can_delete(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'user_id'):
            return str(obj.author.user_id) == str(request.user.user_id)
        return False


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    reactions_summary = serializers.SerializerMethodField()
    user_reactions = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()
    group_slug = serializers.CharField(source='group.slug', read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'group', 'group_name', 'group_slug', 'author', 'author_name',
            'content', 'image', 'mood_tag', 'is_anonymous', 'is_pinned',
            'comments_count', 'reactions_summary', 'user_reactions',
            'is_saved', 'expires_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'group', 'author', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return 'Anonymous Member' if obj.is_anonymous else obj.author.username

    def get_group_name(self, obj):
        return obj.group.name

    def get_comments_count(self, obj):
        return obj.comments.filter(is_deleted=False).count()

    def get_reactions_summary(self, obj):
        reactions = obj.reactions.filter(is_deleted=False)
        return {r_type: reactions.filter(reaction_type=r_type).count()
                for r_type, _ in Reaction.REACTION_TYPES}

    def get_user_reactions(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'user_id'):
            return list(
                obj.reactions.filter(user__user_id=request.user.user_id, is_deleted=False)
                .values_list('reaction_type', flat=True)
            )
        return []


class GroupInvitationSerializer(serializers.ModelSerializer):
    group_name = serializers.SerializerMethodField()
    created_by_username = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = GroupInvitation
        fields = [
            'id', 'group', 'group_name', 'invite_code', 'created_by',
            'created_by_username', 'invited_user', 'is_used', 'used_by',
            'used_at', 'expires_at', 'message', 'is_expired', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_group_name(self, obj):
        return obj.group.name

    def get_created_by_username(self, obj):
        return obj.created_by.username

    def get_is_expired(self, obj):
        return obj.is_expired()


class GroupQuestionsSerializer(serializers.Serializer):
    questions = serializers.ListField(child=serializers.CharField(max_length=500))


class GroupAnswersSerializer(serializers.Serializer):
    answers = serializers.ListField(child=serializers.CharField(max_length=1000))


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'reason', 'details', 'created_at']
        read_only_fields = ['id', 'created_at']
