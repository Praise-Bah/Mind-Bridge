"""Community service inbound event handlers."""
import logging
from mindbridge_common.events import publisher

logger = logging.getLogger(__name__)


def handle_user_registered(payload: dict):
    from apps.community.models import UserSnapshot
    user_id = payload.get('user_id')
    if not user_id:
        return
    UserSnapshot.objects.update_or_create(
        user_id=str(user_id),
        defaults={
            'username': payload.get('username', ''),
            'avatar_url': payload.get('avatar_url', ''),
            'anonymous_mode': payload.get('anonymous_mode', False),
            'is_online': payload.get('is_online', False),
            'is_staff': payload.get('is_staff', False),
        },
    )
    logger.debug('Upserted UserSnapshot for user %s', user_id)


def handle_user_profile_updated(payload: dict):
    handle_user_registered(payload)


def handle_ai_group_evaluation_complete(payload: dict):
    """Update CommunityGroup with AI evaluation results."""
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

    except CommunityGroup.DoesNotExist:
        logger.error('Received ai.group_evaluation_complete for unknown group %s', group_id)
    except Exception:
        logger.exception('Error handling ai.group_evaluation_complete for group %s', group_id)


def _publish_admin_review_notifications(group, payload):
    from apps.community.models import UserSnapshot

    scores = payload.get('ai_review_scores', [])
    total_score = payload.get('ai_total_score', 0)
    scores_text = ', '.join(f"{s['model']}: {s['score']}/100" for s in scores)
    creator_name = group.created_by.username if group.created_by else 'Unknown'

    admin_ids = UserSnapshot.objects.filter(is_staff=True).values_list('user_id', flat=True)
    for admin_id in admin_ids:
        try:
            publisher.publish('notification.create', {
                'user_id': str(admin_id),
                'notification_type': 'group_review_required',
                'title': f'Group Requires Manual Review: {group.name}',
                'message': (
                    f'Group "{group.name}" by {creator_name} needs manual review. '
                    f'AI Score: {total_score}/100. {scores_text}'
                ),
                'data': {
                    'group_id': str(group.id),
                    'group_name': group.name,
                    'created_by': creator_name,
                    'total_score': total_score,
                },
            }, service_origin='community-service')
        except Exception:
            pass

    logger.info('Published manual review notifications for %d admins for group %s', len(admin_ids), group.id)


EVENT_HANDLERS = {
    'mindbridge.events.user.registered': handle_user_registered,
    'mindbridge.events.user.profile_updated': handle_user_profile_updated,
    'mindbridge.events.ai.group_evaluation_complete': handle_ai_group_evaluation_complete,
}
