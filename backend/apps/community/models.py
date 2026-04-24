from django.db import models
from django.conf import settings
from apps.users.models import BaseModel


class CommunityGroup(BaseModel):
    """Predefined community support groups."""
    GROUP_TYPES = [
        ('anxiety', 'Anxiety Support'),
        ('grief', 'Grief & Loss'),
        ('depression', 'Depression'),
        ('ptsd', 'PTSD'),
        ('self_growth', 'Self-Growth'),
        ('stress', 'Stress Management'),
        ('relationships', 'Relationship Issues'),
        ('addiction', 'Addiction Recovery'),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    group_type = models.CharField(max_length=20, choices=GROUP_TYPES)
    cover_image = models.ImageField(upload_to='group_covers/', blank=True, null=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        through='GroupMembership',
        related_name='joined_groups'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'community_groups'
        ordering = ['name']

    def __str__(self):
        return self.name


class GroupMembership(BaseModel):
    """Tracks user membership in groups."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_moderator = models.BooleanField(default=False)

    class Meta:
        db_table = 'group_memberships'
        unique_together = ['user', 'group']


class Post(BaseModel):
    """Community post in a group."""
    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    is_anonymous = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    is_reported = models.BooleanField(default=False)

    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.author.username} in {self.group.name}"


class Comment(BaseModel):
    """Comment on a post."""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    is_anonymous = models.BooleanField(default=False)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']


class Reaction(BaseModel):
    """Reactions on posts (6 types as per SRS)."""
    REACTION_TYPES = [
        ('heart', 'Heart (Love)'),
        ('hug', 'Hug (Support)'),
        ('fist', 'Fist (Strength)'),
        ('lightbulb', 'Lightbulb (Helpful)'),
        ('prayer', 'Prayer (Solidarity)'),
        ('sad', 'Sad Face (Empathy)'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=15, choices=REACTION_TYPES)

    class Meta:
        db_table = 'reactions'
        unique_together = ['post', 'user', 'reaction_type']
