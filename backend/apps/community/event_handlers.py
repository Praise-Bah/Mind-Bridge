"""Community service event handlers (inbound events from other services).

Called by the subscribe_events management command when a Redis Pub/Sub message arrives.
"""
import logging
from apps.notifications.publisher import publish_notification

logger = logging.getLogger(__name__)


def handle_ai_group_evaluation_complete(payload: dict):
    """Update CommunityGroup with AI evaluation results and publish notification events.

    payload keys:
      group_id, creator_user_id, group_name, is_approved, approval_status,
      ai_total_score, ai_review_summary, ai_review_scores, rejection_reason
    """
    from django.utils import timezone
    from apps.community.models import CommunityGroup

    group_id = payload.get('group_id')
    try:
        group = CommunityGroup.objects.get(id=group_id)

        group.ai_review_scores = payload.get('ai_review_scores', [])
        group.ai_total_score = payload.get('ai_total_score', 0)
        group.ai_review_summary = payload.get('ai_review_summary', '')
        group.review_step = 'complete'

        approval_status = payload.get('approval_status', 'pending')
        group.approval_status = approval_status

        if approval_status == 'approved':
            group.is_approved = True
            group.approved_at = timezone.now()
            logger.info('Group %s AUTO-APPROVED (score %d)', group_id, group.ai_total_score)
        elif approval_status == 'rejected':
            group.is_approved = False
            group.rejection_reason = payload.get('rejection_reason', '')
            logger.info('Group %s AUTO-REJECTED (score %d)', group_id, group.ai_total_score)
        else:
            logger.info('Group %s requires MANUAL REVIEW (score %d)', group_id, group.ai_total_score)
            _publish_admin_review_notifications(group, payload)

        group.save()

        # Notify the group creator.
        # The notification service also subscribes to ai.group_evaluation_complete and
        # creates creator notifications for approved/rejected independently. This call
        # is intentionally omitted here to avoid duplicates — the notification service
        # owns notification creation for approved/rejected outcomes.
        # For the 'pending' (manual review) case we publish admin notifications ourselves
        # since this service has access to the admin user list.

    except CommunityGroup.DoesNotExist:
        logger.error('Received ai.group_evaluation_complete for unknown group %s', group_id)
    except Exception:
        logger.exception('Error handling ai.group_evaluation_complete for group %s', group_id)


def _publish_admin_review_notifications(group, payload):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    scores = payload.get('ai_review_scores', [])
    total_score = payload.get('ai_total_score', 0)
    scores_text = ', '.join(f"{s['model']}: {s['score']}/100" for s in scores)
    creator_name = group.created_by.username if group.created_by else 'Unknown'

    admin_users = User.objects.filter(is_staff=True, is_active=True).values_list('id', flat=True)
    for admin_id in admin_users:
        publish_notification(
            user_id=admin_id,
            notification_type='group_review_required',
            title=f'Group Requires Manual Review: {group.name}',
            message=(
                f'Group "{group.name}" by {creator_name} needs manual review. '
                f'AI Score: {total_score}/100. {scores_text}'
            ),
            data={
                'group_id': str(group.id),
                'group_name': group.name,
                'created_by': creator_name,
                'total_score': total_score,
                'scores': scores,
                'admin_link': f'/admin/community/communitygroup/{group.id}/change/',
            },
        )
    logger.info(
        'Published manual review notifications for %d admins for group %s',
        len(admin_users),
        group.id,
    )


# Map Redis Pub/Sub channel → handler
EVENT_HANDLERS = {
    'mindbridge.events.ai.group_evaluation_complete': handle_ai_group_evaluation_complete,
}
