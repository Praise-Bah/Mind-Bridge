from django.db import models
from mindbridge_common.models import BaseModel


class UserSnapshot(BaseModel):
    """Read-only replica of user data, populated from user.registered and
    user.profile_updated events published by the auth service (monolith).

    Seeded at deploy time via: python manage.py seed_snapshots
    """
    user_id = models.UUIDField(unique=True, db_index=True)
    username = models.CharField(max_length=150)
    avatar_url = models.CharField(max_length=500, blank=True)
    is_online = models.BooleanField(default=False)

    class Meta:
        db_table = 'user_snapshots'

    def __str__(self):
        return self.username


class Conversation(BaseModel):
    """Chat conversation between two or more users."""
    participants = models.ManyToManyField(UserSnapshot, related_name='conversations', blank=True)
    is_group = models.BooleanField(default=False)
    name = models.CharField(max_length=100, blank=True)
    last_message_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'conversations'
        ordering = ['-last_message_at']

    def __str__(self):
        return f"Conversation {self.id}"


class Message(BaseModel):
    """Individual chat message."""
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
        ('system', 'System'),
    ]

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(UserSnapshot, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender.username}"


class MessageRead(BaseModel):
    """Per-user read receipts for group chats."""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_receipts')
    user = models.ForeignKey(UserSnapshot, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'message_reads'
        unique_together = ['message', 'user']
