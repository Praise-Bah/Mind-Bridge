from rest_framework import serializers
from .models import CommunityGroup, Post, Comment, Reaction, Report, GroupInvitation


class CommunityGroupSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    is_moderator = serializers.SerializerMethodField()
    created_by_username = serializers.SerializerMethodField()
    invite_url = serializers.SerializerMethodField()

    class Meta:
        model = CommunityGroup
        fields = ['id', 'name', 'slug', 'description', 'group_type', 'custom_type',
                  'cover_image', 'member_count', 'is_member', 'is_moderator', 'is_active',
                  'is_user_created', 'created_by', 'created_by_username', 'visibility',
                  'invite_code', 'invite_url', 'is_approved', 'approval_status',
                  'approved_at', 'rejection_reason']

    def get_member_count(self, obj):
        ann = getattr(obj, 'member_count_ann', None)
        return ann if ann is not None else obj.members.count()

    def get_is_member(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return False
        member_ids = self.context.get('member_group_ids')
        if member_ids is not None:
            return obj.id in member_ids
        return obj.members.filter(id=request.user.id).exists()

    def get_is_moderator(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return False
        mod_ids = self.context.get('moderator_group_ids')
        if mod_ids is not None:
            return obj.id in mod_ids
        return obj.groupmembership_set.filter(user=request.user, is_moderator=True).exists()
    
    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else None
    
    def get_invite_url(self, obj):
        if obj.visibility == 'private':
            request = self.context.get('request')
            if request:
                return f"{request.build_absolute_uri('/')}community/join/{obj.invite_code}/"
        return None


class CommunityGroupCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new groups with validation."""
    
    class Meta:
        model = CommunityGroup
        fields = ['id', 'name', 'description', 'group_type', 'custom_type', 'visibility', 'cover_image', 'creation_reason']
        extra_kwargs = {
            'cover_image': {'required': False, 'allow_null': True},
            'creation_reason': {'required': False, 'allow_blank': True, 'default': ''},
        }
    
    def validate(self, data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Check user's group creation limit (max 3)
            user_created_count = CommunityGroup.objects.filter(
                created_by=request.user,
                is_user_created=True
            ).count()
            if user_created_count >= 3:
                raise serializers.ValidationError(
                    "You have reached the maximum limit of 3 created groups."
                )
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        validated_data['is_user_created'] = True
        validated_data['is_approved'] = False  # Requires AI/admin approval
        validated_data['approval_status'] = 'pending'
        validated_data['review_step'] = 'reason'  # Start with reason submitted
        
        # Generate slug from name
        import re
        name = validated_data['name']
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        original_slug = slug
        counter = 1
        
        # Ensure unique slug
        while CommunityGroup.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        validated_data['slug'] = slug
        return super().create(validated_data)


class ReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reaction
        fields = ['id', 'reaction_type', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    user_can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_name', 'content',
                  'is_anonymous', 'parent', 'replies', 'user_can_delete', 
                  'is_saved', 'expires_at', 'created_at']
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
        if request and request.user.is_authenticated:
            return obj.author_id == request.user.id
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
        fields = ['id', 'group', 'group_name', 'group_slug', 'author', 'author_name', 'content', 'image',
                  'mood_tag', 'is_anonymous', 'is_pinned', 'comments_count',
                  'reactions_summary', 'user_reactions', 'is_saved', 'expires_at',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'group', 'author', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return 'Anonymous Member' if obj.is_anonymous else obj.author.username

    def get_group_name(self, obj):
        return obj.group.name

    def get_comments_count(self, obj):
        ann = getattr(obj, 'comments_count_ann', None)
        return ann if ann is not None else obj.comments.filter(is_deleted=False).count()

    def get_reactions_summary(self, obj):
        reactions = getattr(obj, 'prefetched_reactions', None)
        if reactions is None:
            reactions = list(obj.reactions.filter(is_deleted=False))
        summary = {r_type: 0 for r_type, _ in Reaction.REACTION_TYPES}
        for r in reactions:
            summary[r.reaction_type] = summary.get(r.reaction_type, 0) + 1
        return summary

    def get_user_reactions(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return []
        reactions = getattr(obj, 'prefetched_reactions', None)
        if reactions is not None:
            return [r.reaction_type for r in reactions if r.user_id == request.user.id]
        return list(
            obj.reactions.filter(user=request.user, is_deleted=False)
            .values_list('reaction_type', flat=True)
        )


class GroupInvitationSerializer(serializers.ModelSerializer):
    group_name = serializers.SerializerMethodField()
    created_by_username = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = GroupInvitation
        fields = ['id', 'group', 'group_name', 'invite_code', 'created_by', 'created_by_username',
                  'invited_user', 'is_used', 'used_by', 'used_at', 'expires_at', 'message',
                  'is_expired', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_group_name(self, obj):
        return obj.group.name
    
    def get_created_by_username(self, obj):
        return obj.created_by.username
    
    def get_is_expired(self, obj):
        return obj.is_expired()


class GroupQuestionsSerializer(serializers.Serializer):
    """Serializer for AI-generated questions."""
    questions = serializers.ListField(child=serializers.CharField(max_length=500))

class GroupAnswersSerializer(serializers.Serializer):
    """Serializer for user answers to AI questions."""
    answers = serializers.ListField(child=serializers.CharField(max_length=1000))

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'reason', 'details', 'created_at']
        read_only_fields = ['id', 'created_at']
