from rest_framework import serializers
from .models import CommunityGroup, Post, Comment, Reaction


class CommunityGroupSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = CommunityGroup
        fields = ['id', 'name', 'slug', 'description', 'group_type', 
                  'cover_image', 'member_count', 'is_member', 'is_active']

    def get_member_count(self, obj):
        return obj.members.count()

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False


class ReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reaction
        fields = ['id', 'reaction_type', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_name', 'content', 
                  'is_anonymous', 'parent', 'replies', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

    def get_author_name(self, obj):
        return 'Anonymous Member' if obj.is_anonymous else obj.author.username

    def get_replies(self, obj):
        if obj.parent is None:
            replies = obj.replies.filter(is_deleted=False)
            return CommentSerializer(replies, many=True, context=self.context).data
        return []


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    reactions_summary = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'group', 'author', 'author_name', 'content', 'image',
                  'is_anonymous', 'is_pinned', 'comments_count', 'reactions_summary',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return 'Anonymous Member' if obj.is_anonymous else obj.author.username

    def get_comments_count(self, obj):
        return obj.comments.filter(is_deleted=False).count()

    def get_reactions_summary(self, obj):
        reactions = obj.reactions.filter(is_deleted=False)
        summary = {}
        for r_type, _ in Reaction.REACTION_TYPES:
            summary[r_type] = reactions.filter(reaction_type=r_type).count()
        return summary
