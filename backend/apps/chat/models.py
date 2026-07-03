from django.db import models
from django.conf import settings
from apps.users.models import BaseModel
from .encryption import encrypt_message, decrypt_message


class Conversation(BaseModel):
    """Chat conversation between users."""
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='conversations'
    )
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

    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='sent_messages'
    )
    content = models.TextField()
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    is_encrypted = models.BooleanField(default=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'is_read', 'is_deleted'], name='msg_conv_read_deleted_idx'),
        ]

    def __str__(self):
        return f"Message from {self.sender.username}"

    def save(self, *args, **kwargs):
        # Encrypt content before saving if not already encrypted
        if self.content and not self._state.adding is False:
            if not getattr(self, '_content_encrypted', False):
                self.content = encrypt_message(self.content)
                self.is_encrypted = True
                self._content_encrypted = True
        super().save(*args, **kwargs)

    @property
    def decrypted_content(self):
        """Return the decrypted message content."""
        if self.is_encrypted:
            return decrypt_message(self.content)
        return self.content


class MessageRead(BaseModel):
    """Track message read status for group chats."""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_receipts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'message_reads'
        unique_together = ['message', 'user']
