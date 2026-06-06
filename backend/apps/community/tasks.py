"""Community service Celery tasks.

Phase 1 change: evaluate_group_task now publishes a community.group_approval_requested
event and returns immediately. The AI service picks it up, evaluates, and publishes
ai.group_evaluation_complete back. The monolith's subscribe_events management command
receives that event and calls handle_ai_group_evaluation_complete.
"""
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
    """Publish community.group_approval_requested so the AI service evaluates the group.

    All evaluation data is included in the event payload so the AI service needs
    no access to the monolith's database.
    """
    from apps.community.models import CommunityGroup
    from mindbridge_common.events import publisher

    try:
        group = CommunityGroup.objects.get(id=group_id)

        if group.review_step != 'reviewing':
            logger.warning('Group %s not in reviewing step — skipping event publish', group_id)
            return

        payload = {
            'group_id': str(group.id),
            'group_name': group.name,
            'description': group.description,
            'creation_reason': group.creation_reason or '',
            'ai_questions': group.ai_questions or [],
            'ai_answers': group.ai_answers or [],
            'creator_user_id': str(group.created_by_id) if group.created_by_id else None,
        }

        publisher.publish(
            event_type='community.group_approval_requested',
            payload=payload,
            service_origin='community-service',
        )
        logger.info('Published group_approval_requested for group %s', group_id)

    except CommunityGroup.DoesNotExist:
        logger.error('Group %s not found — cannot publish evaluation event', group_id)
    except Exception as exc:
        logger.error('Failed to publish evaluation event for group %s: %s', group_id, exc, exc_info=True)
        countdown = 120 * (2 ** self.request.retries)
        raise self.retry(exc=exc, countdown=countdown)


@shared_task(
    queue='celery',
    acks_late=True,
)
def retry_pending_evaluations():
    """Re-publish events for groups stuck in 'reviewing' for more than 10 minutes.

    Run via Celery Beat every 5 minutes. Recovers from AI service outages.
    """
    from django.utils import timezone
    from datetime import timedelta
    from apps.community.models import CommunityGroup

    cutoff = timezone.now() - timedelta(minutes=10)
    stuck_groups = CommunityGroup.objects.filter(
        review_step='reviewing',
        updated_at__lt=cutoff,
        is_deleted=False,
    )

    count = 0
    for group in stuck_groups:
        logger.info('Re-publishing stuck evaluation for group %s', group.id)
        evaluate_group_task.delay(str(group.id))
        count += 1

    if count:
        logger.info('Retried %d stuck group evaluations', count)
