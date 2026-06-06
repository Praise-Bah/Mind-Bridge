"""Community service Celery tasks."""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=120,
    queue='celery',
    acks_late=True,
    reject_on_worker_lost=True,
)
def evaluate_group_task(self, group_id: str):
    """Publish community.group_approval_requested so the AI service evaluates the group."""
    from apps.community.models import CommunityGroup
    from mindbridge_common.events import publisher

    try:
        group = CommunityGroup.objects.get(id=group_id)

        if group.review_step != 'reviewing':
            logger.warning('Group %s not in reviewing step — skipping', group_id)
            return

        payload = {
            'group_id': str(group.id),
            'group_name': group.name,
            'description': group.description,
            'creation_reason': group.creation_reason or '',
            'ai_questions': group.ai_questions or [],
            'ai_answers': group.ai_answers or [],
            'creator_user_id': str(group.created_by.user_id) if group.created_by else None,
        }

        publisher.publish(
            event_type='community.group_approval_requested',
            payload=payload,
            service_origin='community-service',
        )
        logger.info('Published group_approval_requested for group %s', group_id)

    except CommunityGroup.DoesNotExist:
        logger.error('Group %s not found', group_id)
    except Exception as exc:
        logger.error('Failed to publish evaluation event for group %s: %s', group_id, exc, exc_info=True)
        countdown = 120 * (2 ** self.request.retries)
        raise self.retry(exc=exc, countdown=countdown)


@shared_task(queue='celery', acks_late=True)
def retry_pending_evaluations():
    """Re-publish events for groups stuck in 'reviewing' for >10 minutes."""
    from django.utils import timezone
    from datetime import timedelta
    from apps.community.models import CommunityGroup

    cutoff = timezone.now() - timedelta(minutes=10)
    stuck = CommunityGroup.objects.filter(
        review_step='reviewing', updated_at__lt=cutoff, is_deleted=False
    )
    for group in stuck:
        evaluate_group_task.delay(str(group.id))
    if stuck.count():
        logger.info('Retried %d stuck group evaluations', stuck.count())
