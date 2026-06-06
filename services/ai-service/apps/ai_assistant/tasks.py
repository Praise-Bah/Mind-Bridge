"""AI service Celery tasks.

evaluate_group_task: runs the multi-model AI evaluation for a community group
and publishes the result back as an ai.group_evaluation_complete event.
All required data is passed in the payload — NO database queries to the monolith.
"""
import asyncio
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=120,
    queue='ai_tasks',
    acks_late=True,
    reject_on_worker_lost=True,
)
def evaluate_group_task(self, payload: dict):
    """Evaluate a community group using multi-model AI and publish the result.

    payload keys (all required — no DB queries):
      group_id, group_name, description, creation_reason,
      ai_questions (list), ai_answers (list), creator_user_id
    """
    group_id = payload.get('group_id')
    try:
        from .ai_evaluation import GroupApprovalAIService
        from mindbridge_common.events import publisher

        logger.info('AI evaluation starting for group %s', group_id)

        ai_service = GroupApprovalAIService()
        scores, total_score, summary = asyncio.run(
            ai_service.evaluate_group_request(
                group_name=payload['group_name'],
                description=payload.get('description', ''),
                creation_reason=payload.get('creation_reason', ''),
                questions=payload.get('ai_questions', []),
                answers=payload.get('ai_answers', []),
            )
        )

        if total_score >= 80:
            approval_status = 'approved'
            rejection_reason = ''
        elif total_score >= 50:
            approval_status = 'pending'
            rejection_reason = ''
        else:
            approval_status = 'rejected'
            rejection_reason = f'AI evaluation score: {total_score}/100. {summary}'

        result_payload = {
            'group_id': group_id,
            'creator_user_id': payload.get('creator_user_id'),
            'group_name': payload.get('group_name'),
            'is_approved': approval_status == 'approved',
            'approval_status': approval_status,
            'ai_total_score': total_score,
            'ai_review_summary': summary,
            'ai_review_scores': scores,
            'rejection_reason': rejection_reason,
        }

        publisher.publish(
            event_type='ai.group_evaluation_complete',
            payload=result_payload,
            service_origin='ai-service',
        )

        logger.info(
            'AI evaluation complete for group %s: score=%d status=%s',
            group_id, total_score, approval_status,
        )

    except Exception as exc:
        logger.error('AI evaluation failed for group %s: %s', group_id, exc, exc_info=True)
        countdown = 120 * (2 ** self.request.retries)
        raise self.retry(exc=exc, countdown=countdown)
