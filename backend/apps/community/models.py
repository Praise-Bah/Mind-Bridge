from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid
from apps.users.models import BaseModel


class CommunityGroup(BaseModel):
    """Community support groups - both predefined and user-created."""
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
    
    VISIBILITY_CHOICES = [
        ('public', 'Public - Anyone can join'),
        ('private', 'Private - Invite only'),
    ]
    
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    group_type = models.CharField(max_length=20, choices=GROUP_TYPES, blank=True, null=True)
    custom_type = models.CharField(max_length=50, blank=True, help_text="Custom type for user-created groups")
    cover_image = models.ImageField(upload_to='group_covers/', blank=True, null=True)
    
    # User creation fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='created_groups'
    )
    is_user_created = models.BooleanField(default=False)
    
    # Approval workflow
    is_approved = models.BooleanField(default=True)  # Default True for predefined groups
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='approved')
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_groups'
    )
    rejection_reason = models.TextField(blank=True)
    
    # AI Review fields
    creation_reason = models.TextField(help_text="User's reason for creating this group")
    ai_questions = models.JSONField(default=dict, blank=True, help_text="AI-generated questions")
    ai_answers = models.JSONField(default=dict, blank=True, help_text="User answers to AI questions")
    ai_review_scores = models.JSONField(default=list, blank=True, help_text="Individual AI model scores")
    ai_total_score = models.IntegerField(null=True, blank=True, help_text="Combined AI score")
    ai_review_summary = models.TextField(blank=True, help_text="AI review summary")
    review_step = models.CharField(
        max_length=20, 
        choices=[
            ('reason', 'Reason Submitted'),
            ('questions', 'Questions Generated'),
            ('reviewing', 'AI Reviewing'),
            ('complete', 'Review Complete')
        ],
        default='reason'
    )
    
    # Visibility and access
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='public')
    invite_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        through='GroupMembership',
        related_name='joined_groups'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'community_groups'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_approved', 'is_deleted'], name='group_approved_deleted_idx'),
            models.Index(fields=['approval_status'], name='group_approval_status_idx'),
        ]

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Set approval_status based on is_approved for consistency
        if self.is_user_created:
            if self.is_approved and not self.approved_at:
                self.approved_at = timezone.now()
                self.approval_status = 'approved'
            elif not self.is_approved:
                self.approved_at = None
                self.approval_status = 'pending'
        super().save(*args, **kwargs)


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
    MOOD_TAGS = [
        ('anxious', 'Anxious'),
        ('sad', 'Sad'),
        ('angry', 'Angry'),
        ('overwhelmed', 'Overwhelmed'),
        ('hopeful', 'Hopeful'),
        ('grateful', 'Grateful'),
        ('calm', 'Calm'),
        ('happy', 'Happy'),
    ]

    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    mood_tag = models.CharField(max_length=20, choices=MOOD_TAGS, blank=True, null=True)
    is_anonymous = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    is_reported = models.BooleanField(default=False)
    
    # Message expiration fields
    is_saved = models.BooleanField(default=False, help_text="Saved messages won't be auto-deleted")
    expires_at = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="Messages auto-delete after 48 hours unless saved"
    )

    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['group', 'is_deleted', 'created_at'], name='post_group_deleted_created_idx'),
        ]

    def __str__(self):
        return f"Post by {self.author.username} in {self.group.name}"
    
    def save(self, *args, **kwargs):
        # Set expiration time for new posts (48 hours from creation)
        if not self.expires_at and not self.pk:
            from django.utils import timezone
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(hours=48)
        super().save(*args, **kwargs)


class Comment(BaseModel):
    """Comment on a post."""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    is_anonymous = models.BooleanField(default=False)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    # Message expiration fields
    is_saved = models.BooleanField(default=False, help_text="Saved comments won't be auto-deleted")
    expires_at = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="Comments auto-delete after 48 hours unless saved"
    )

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']
    
    def save(self, *args, **kwargs):
        # Set expiration time for new comments (48 hours from creation)
        if not self.expires_at and not self.pk:
            from django.utils import timezone
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(hours=48)
        super().save(*args, **kwargs)


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


class Report(BaseModel):
    """Moderation reports on posts or comments."""
    REASON_CHOICES = [
        ('hate_speech', 'Hate Speech'),
        ('spam', 'Spam'),
        ('harmful', 'Harmful Content'),
        ('other', 'Other'),
    ]

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports_made')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    details = models.TextField(blank=True)
    is_resolved = models.BooleanField(default=False)

    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']


class GroupInvitation(BaseModel):
    """Invitations for private groups."""
    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name='invitations')
    invite_code = models.UUIDField(default=uuid.uuid4, unique=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations')
    invited_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='received_invitations'
    )
    is_used = models.BooleanField(default=False)
    used_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='used_invitations'
    )
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(
        help_text="Invitation expires after 7 days"
    )
    message = models.TextField(blank=True, help_text="Personal message for the invitee")

    class Meta:
        db_table = 'group_invitations'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Set expiration time for new invitations (7 days from creation)
        if not self.expires_at and not self.pk:
            from django.utils import timezone
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
