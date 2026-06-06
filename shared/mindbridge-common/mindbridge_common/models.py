import uuid
from django.db import models


class BaseModel(models.Model):
    """Abstract base model with UUID PK, timestamps, and soft-delete.

    Extracted from apps/users/models.py so each SOA service can import
    this from mindbridge_common instead of importing across service boundaries.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True
