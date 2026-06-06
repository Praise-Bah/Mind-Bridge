from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.community.models import CommunityGroup
from apps.community.ai_services import GroupApprovalAIService
import asyncio


class Command(BaseCommand):
    help = 'Evaluate a group using AI models'

    def add_arguments(self, parser):
        parser.add_argument('group_id', type=str, help='Group ID to evaluate')

    def handle(self, *args, **options):
        group_id = options['group_id']
        
        try:
            group = CommunityGroup.objects.get(id=group_id)
            
            if group.review_step != 'reviewing':
                self.stdout.write(
                    self.style.ERROR(f'Group {group_id} is not in reviewing step')
                )
                return
            
            self.stdout.write(f'Starting AI evaluation for group: {group.name}')
            
            # Run AI evaluation
            ai_service = GroupApprovalAIService()
            scores, total_score, summary = asyncio.run(
                ai_service.evaluate_group_request(
                    group.name,
                    group.description,
                    group.creation_reason,
                    group.ai_questions,
                    group.ai_answers
                )
            )
            
            # Update group with results
            group.ai_review_scores = scores
            group.ai_total_score = total_score
            group.ai_review_summary = summary
            group.review_step = 'complete'
            
            # Determine approval status
            if total_score >= 80:
                # Auto-approve
                group.is_approved = True
                group.approval_status = 'approved'
                group.approved_at = timezone.now()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Group {group.name} AUTO-APPROVED with score {total_score}'
                    )
                )
                
            elif total_score >= 50:
                # Requires manual review
                group.approval_status = 'pending'
                
                self.stdout.write(
                    self.style.WARNING(
                        f'Group {group.name} requires manual review with score {total_score}'
                    )
                )
                
                # Create admin notification for manual review
                self._create_admin_review_notification(group, scores, total_score)
                
            else:
                # Auto-reject
                group.is_approved = False
                group.approval_status = 'rejected'
                group.rejection_reason = f"AI evaluation score: {total_score}/100. {summary}"
                
                self.stdout.write(
                    self.style.ERROR(
                        f'Group {group.name} AUTO-REJECTED with score {total_score}'
                    )
                )
            
            group.save()
            
            from apps.notifications.publisher import publish_notification
            if group.is_approved and group.created_by_id:
                publish_notification(
                    user_id=group.created_by_id,
                    notification_type='group_approved',
                    title='Group Approved!',
                    message=f'Your group "{group.name}" has been approved and is now live.',
                    data={'group_id': str(group.id)},
                )
            elif group.approval_status == 'rejected' and group.created_by_id:
                publish_notification(
                    user_id=group.created_by_id,
                    notification_type='group_rejected',
                    title='Group Not Approved',
                    message=f'Your group "{group.name}" was not approved. {group.rejection_reason}',
                    data={'group_id': str(group.id)},
                )
            
            self.stdout.write(self.style.SUCCESS('AI evaluation completed'))
            
        except CommunityGroup.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Group with ID {group_id} not found')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during evaluation: {str(e)}')
            )
    
    def _create_admin_review_notification(self, group, scores, total_score):
        """Publish admin review notification events."""
        try:
            from apps.notifications.publisher import publish_notification
            from django.contrib.auth import get_user_model

            User = get_user_model()
            creator_name = group.created_by.username if group.created_by else 'Unknown'
            scores_text = ', '.join(f"{s['model']}: {s['score']}/100" for s in scores)
            admin_ids = User.objects.filter(is_staff=True, is_active=True).values_list('id', flat=True)
            for admin_id in admin_ids:
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
            self.stdout.write(f'Admin review notifications published for {len(admin_ids)} admin users')
        except Exception as e:
            self.stdout.write(f'Error publishing admin notifications: {e}')
    
    def _format_answers(self, questions, answers):
        """Format Q&A for email."""
        formatted = []
        for i, (q, a) in enumerate(zip(questions, answers), 1):
            formatted.append(f"{i}. Q: {q}")
            formatted.append(f"   A: {a}")
        return "\n".join(formatted)
