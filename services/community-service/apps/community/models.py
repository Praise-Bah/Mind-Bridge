from django.db import models
from django.utils import timezone
import uuid
from mindbridge_common.models import BaseModel


class UserSnapshot(BaseModel):
    """Read-only replica of auth-service user data.
    Populated from user.registered / user.profile_updated events.
    """
    user_id = models.UUIDField(unique=True, db_index=True)
    username = models.CharField(max_length=150)
    avatar_url = models.CharField(max_length=500, blank=True)
    anonymous_mode = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    class Meta:
        db_table = 'user_snapshots'

    def __str__(self):
        return self.username


class CommunityGroup(BaseModel):
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
    custom_type = models.CharField(max_length=50, blank=True)
    cover_image = models.ImageField(upload_to='group_covers/', blank=True, null=True)

    created_by = models.ForeignKey(
        UserSnapshot,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_groups',
    )
    is_user_created = models.BooleanField(default=False)

    is_approved = models.BooleanField(default=True)
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='approved')
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        UserSnapshot,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_groups',
    )
    rejection_reason = models.TextField(blank=True)

    creation_reason = models.TextField(blank=True)
    ai_questions = models.JSONField(default=dict, blank=True)
    ai_answers = models.JSONField(default=dict, blank=True)
    ai_review_scores = models.JSONField(default=list, blank=True)
    ai_total_score = models.IntegerField(null=True, blank=True)
    ai_review_summary = models.TextField(blank=True)
    review_step = models.CharField(
        max_length=20,
        choices=[
            ('reason', 'Reason Submitted'),
            ('questions', 'Questions Generated'),
            ('reviewing', 'AI Reviewing'),
            ('complete', 'Review Complete'),
        ],
        default='reason',
    )

    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='public')
    invite_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    members = models.ManyToManyField(
        UserSnapshot,
        through='GroupMembership',
        related_name='joined_groups',
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'community_groups'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_user_created:
            if self.is_approved and not self.approved_at:
                self.approved_at = timezone.now()
                self.approval_status = 'approved'
            elif not self.is_approved:
                self.approved_at = None
                self.approval_status = 'pending'
        super().save(*args, **kwargs)


class GroupMembership(BaseModel):
    user = models.ForeignKey(UserSnapshot, on_delete=models.CASCADE)
    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_moderator = models.BooleanField(default=False)

    class Meta:
        db_table = 'group_memberships'
        unique_together = ['user', 'group']


class Post(BaseModel):
    MOOD_TAGS = [
        ('anxious', 'Anxious'), ('sad', 'Sad'), ('angry', 'Angry'),
        ('overwhelmed', 'Overwhelmed'), ('hopeful', 'Hopeful'),
        ('grateful', 'Grateful'), ('calm', 'Calm'), ('happy', 'Happy'),
    ]

    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(UserSnapshot, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    mood_tag = models.CharField(max_length=20, choices=MOOD_TAGS, blank=True, null=True)
    is_anonymous = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    is_reported = models.BooleanField(default=False)
    is_saved = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.expires_at and not self.pk:
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(hours=48)
        super().save(*args, **kwargs)


class Comment(BaseModel):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(UserSnapshot, on_delete=models.CASCADE)
    content = models.TextField()
    is_anonymous = models.BooleanField(default=False)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    is_saved = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']

    def save(self, *args, **kwargs):
        if not self.expires_at and not self.pk:
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(hours=48)
        super().save(*args, **kwargs)


class Reaction(BaseModel):
    REACTION_TYPES = [
        ('heart', 'Heart'), ('hug', 'Hug'), ('fist', 'Fist'),
        ('lightbulb', 'Lightbulb'), ('prayer', 'Prayer'), ('sad', 'Sad'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(UserSnapshot, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=15, choices=REACTION_TYPES)

    class Meta:
        db_table = 'reactions'
        unique_together = ['post', 'user', 'reaction_type']


class Report(BaseModel):
    REASON_CHOICES = [
        ('hate_speech', 'Hate Speech'), ('spam', 'Spam'),
        ('harmful', 'Harmful Content'), ('other', 'Other'),
    ]

    reporter = models.ForeignKey(UserSnapshot, on_delete=models.CASCADE, related_name='reports_made')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    details = models.TextField(blank=True)
    is_resolved = models.BooleanField(default=False)

    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']


class GroupInvitation(BaseModel):
    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name='invitations')
    invite_code = models.UUIDField(default=uuid.uuid4, unique=True)
    created_by = models.ForeignKey(UserSnapshot, on_delete=models.CASCADE, related_name='sent_invitations')
    invited_user = models.ForeignKey(
        UserSnapshot, on_delete=models.CASCADE, null=True, blank=True, related_name='received_invitations'
    )
    is_used = models.BooleanField(default=False)
    used_by = models.ForeignKey(
        UserSnapshot, on_delete=models.SET_NULL, null=True, blank=True, related_name='used_invitations'
    )
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    message = models.TextField(blank=True)

    class Meta:
        db_table = 'group_invitations'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.expires_at and not self.pk:
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at if self.expires_at else False
