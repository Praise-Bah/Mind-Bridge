import re
import asyncio
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import UserSnapshot, CommunityGroup, GroupMembership, Post, Comment, Reaction, GroupInvitation
from .serializers import (
    CommunityGroupSerializer, CommunityGroupCreateSerializer, PostSerializer,
    CommentSerializer, ReportSerializer, GroupAnswersSerializer,
)
from .ai_services import GroupApprovalAIService
from mindbridge_common.events import publisher


def _publish_notification(user_id, notification_type, title, message, data=None):
    try:
        publisher.publish('notification.create', {
            'user_id': str(user_id),
            'notification_type': notification_type,
            'title': title,
            'message': message,
            'data': data or {},
        }, service_origin='community-service')
    except Exception:
        pass


def _get_snapshot(user_id, username='') -> UserSnapshot:
    snap, _ = UserSnapshot.objects.get_or_create(
        user_id=str(user_id),
        defaults={'username': username or str(user_id)[:20]},
    )
    return snap


class CommunityGroupListView(generics.ListAPIView):
    serializer_class = CommunityGroupSerializer

    def get_queryset(self):
        queryset = CommunityGroup.objects.filter(
            is_active=True, is_deleted=False, is_approved=True
        )
        if hasattr(self.request.user, 'user_id'):
            user_groups = CommunityGroup.objects.filter(
                created_by__user_id=str(self.request.user.user_id),
                is_user_created=True,
                is_active=True,
                is_deleted=False,
            )
            queryset = (queryset | user_groups).distinct()
        return queryset.order_by('-created_at')


class CommunityGroupDetailView(generics.RetrieveAPIView):
    queryset = CommunityGroup.objects.filter(is_active=True, is_deleted=False)
    serializer_class = CommunityGroupSerializer
    lookup_field = 'slug'


class CreateGroupView(generics.CreateAPIView):
    serializer_class = CommunityGroupCreateSerializer


class GenerateQuestionsView(APIView):
    def post(self, request, group_id):
        try:
            group = CommunityGroup.objects.get(
                id=group_id, created_by__user_id=str(request.user.user_id)
            )
            if group.review_step != 'reason':
                return Response(
                    {'detail': 'Questions already generated or invalid step.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            creation_reason = request.data.get('creation_reason', '').strip()
            if not creation_reason:
                return Response(
                    {'detail': 'creation_reason is required.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            group.creation_reason = creation_reason
            group.save(update_fields=['creation_reason'])

            ai_service = GroupApprovalAIService()
            questions = asyncio.run(ai_service.generate_questions(creation_reason))

            group.ai_questions = questions
            group.review_step = 'questions'
            group.save(update_fields=['ai_questions', 'review_step'])

            return Response({'questions': questions})

        except CommunityGroup.DoesNotExist:
            return Response({'detail': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': f'Error generating questions: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubmitAnswersView(APIView):
    def post(self, request, group_id):
        try:
            group = CommunityGroup.objects.get(
                id=group_id, created_by__user_id=str(request.user.user_id)
            )
            if group.review_step != 'questions':
                return Response({'detail': 'Invalid step for submitting answers.'}, status=status.HTTP_400_BAD_REQUEST)

            serializer = GroupAnswersSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            answers = serializer.validated_data['answers']

            if len(answers) != len(group.ai_questions):
                return Response({'detail': 'Please answer all questions.'}, status=status.HTTP_400_BAD_REQUEST)

            group.ai_answers = answers
            group.review_step = 'reviewing'
            group.save()

            from .tasks import evaluate_group_task
            evaluate_group_task.delay(str(group.id))

            return Response({'message': 'Answers submitted. AI evaluation in progress...', 'review_step': 'reviewing'})

        except CommunityGroup.DoesNotExist:
            return Response({'detail': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)


class GroupReviewStatusView(APIView):
    def get(self, request, group_id):
        try:
            group = CommunityGroup.objects.get(
                id=group_id, created_by__user_id=str(request.user.user_id)
            )
            data = {
                'review_step': group.review_step,
                'ai_total_score': group.ai_total_score,
                'ai_review_summary': group.ai_review_summary,
                'approval_status': group.approval_status,
                'is_approved': group.is_approved,
            }
            if group.review_step == 'complete':
                data['ai_review_scores'] = group.ai_review_scores
            return Response(data)
        except CommunityGroup.DoesNotExist:
            return Response({'detail': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)


class JoinGroupView(APIView):
    def post(self, request, slug):
        group = CommunityGroup.objects.get(slug=slug)
        if group.visibility == 'private':
            return Response({'detail': 'Private group. Invitation required.'}, status=status.HTTP_403_FORBIDDEN)
        if not group.is_approved:
            return Response({'detail': 'Group not yet approved.'}, status=status.HTTP_403_FORBIDDEN)
        snapshot = _get_snapshot(request.user.user_id, request.user.username)
        GroupMembership.objects.get_or_create(user=snapshot, group=group)
        return Response({'status': 'joined'})

    def delete(self, request, slug):
        group = CommunityGroup.objects.get(slug=slug)
        GroupMembership.objects.filter(user__user_id=str(request.user.user_id), group=group).delete()
        return Response({'status': 'left'})


class JoinGroupByInviteView(APIView):
    def post(self, request, invite_code):
        try:
            invitation = GroupInvitation.objects.get(invite_code=invite_code, is_used=False)
            if invitation.is_expired():
                return Response({'detail': 'Invitation has expired.'}, status=status.HTTP_400_BAD_REQUEST)

            snapshot = _get_snapshot(request.user.user_id, request.user.username)
            GroupMembership.objects.get_or_create(user=snapshot, group=invitation.group)
            invitation.is_used = True
            invitation.used_by = snapshot
            invitation.used_at = timezone.now()
            invitation.save()

            return Response({'status': 'joined', 'group_name': invitation.group.name})
        except GroupInvitation.DoesNotExist:
            return Response({'detail': 'Invalid invitation code.'}, status=status.HTTP_404_NOT_FOUND)


class GenerateInviteView(APIView):
    def post(self, request, slug):
        try:
            group = CommunityGroup.objects.get(slug=slug)
            is_owner = group.created_by and str(group.created_by.user_id) == str(request.user.user_id)
            is_moderator = GroupMembership.objects.filter(
                user__user_id=str(request.user.user_id), group=group, is_moderator=True
            ).exists()
            if not (is_owner or is_moderator):
                return Response({'detail': 'Only owners and moderators can generate invites.'}, status=status.HTTP_403_FORBIDDEN)

            snapshot = _get_snapshot(request.user.user_id, request.user.username)
            invitation = GroupInvitation.objects.create(group=group, created_by=snapshot)
            invite_url = f"{request.build_absolute_uri('/')}community/join/{invitation.invite_code}/"
            return Response({
                'invite_code': str(invitation.invite_code),
                'invite_url': invite_url,
                'expires_at': invitation.expires_at,
            }, status=status.HTTP_201_CREATED)

        except CommunityGroup.DoesNotExist:
            return Response({'detail': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)


class FeedView(generics.ListAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        public_posts = Post.objects.filter(
            group__is_approved=True, group__is_active=True,
            group__is_deleted=False, group__visibility='public', is_deleted=False,
        )
        if hasattr(self.request.user, 'user_id'):
            joined_private = GroupMembership.objects.filter(
                user__user_id=str(self.request.user.user_id), group__visibility='private',
            ).values_list('group_id', flat=True)
            private_posts = Post.objects.filter(group_id__in=joined_private, is_deleted=False)
            combined = (public_posts | private_posts).distinct()
        else:
            combined = public_posts
        return combined.select_related('author', 'group').order_by('-created_at')


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        return Post.objects.filter(
            group__slug=self.kwargs['group_slug'], is_deleted=False
        ).select_related('author', 'group')

    def perform_create(self, serializer):
        group = CommunityGroup.objects.get(slug=self.kwargs['group_slug'])
        snapshot = _get_snapshot(self.request.user.user_id, self.request.user.username)
        serializer.save(author=snapshot, group=group)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        return Post.objects.filter(is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class PinPostView(APIView):
    def post(self, request, post_id):
        post = Post.objects.get(id=post_id)
        is_mod = GroupMembership.objects.filter(
            user__user_id=str(request.user.user_id), group=post.group, is_moderator=True
        ).exists()
        if not is_mod:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        post.is_pinned = not post.is_pinned
        post.save()
        return Response({'is_pinned': post.is_pinned})


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        return Comment.objects.filter(post_id=self.kwargs['post_id'], is_deleted=False, parent=None)

    def perform_create(self, serializer):
        post = Post.objects.get(id=self.kwargs['post_id'])
        snapshot = _get_snapshot(self.request.user.user_id, self.request.user.username)
        comment = serializer.save(author=snapshot, post=post)
        self._notify_mentions(comment)

    def _notify_mentions(self, comment):
        usernames = re.findall(r'@(\w+)', comment.content)
        if not usernames:
            return
        mentioned = UserSnapshot.objects.filter(username__in=usernames).exclude(
            user_id=comment.author.user_id
        )
        for snap in mentioned:
            _publish_notification(
                user_id=snap.user_id,
                notification_type='mention',
                title=f'{comment.author.username} mentioned you',
                message=f'"{comment.content[:100]}"',
                data={'comment_id': str(comment.id), 'post_id': str(comment.post_id)},
            )


class ReactionToggleView(APIView):
    def post(self, request, post_id):
        reaction_type = request.data.get('reaction_type')
        post = Post.objects.get(id=post_id)
        snapshot = _get_snapshot(request.user.user_id, request.user.username)
        reaction, created = Reaction.objects.get_or_create(
            post=post, user=snapshot, reaction_type=reaction_type
        )
        if not created:
            reaction.delete()
            return Response({'status': 'removed'})
        if str(post.author.user_id) != str(request.user.user_id):
            _publish_notification(
                user_id=post.author.user_id,
                notification_type='reaction',
                title=f'{snapshot.username} reacted to your post',
                message=f'"{post.content[:80]}"' if post.content else 'your post',
                data={'post_id': str(post.id), 'reaction_type': reaction_type},
            )
        return Response({'status': 'added'}, status=status.HTTP_201_CREATED)


class ReportPostView(APIView):
    def post(self, request, post_id):
        post = Post.objects.get(id=post_id)
        serializer = ReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        snapshot = _get_snapshot(request.user.user_id, request.user.username)
        serializer.save(reporter=snapshot, post=post)
        post.is_reported = True
        post.save()
        return Response({'status': 'reported'}, status=status.HTTP_201_CREATED)


class ReportCommentView(APIView):
    def post(self, request, comment_id):
        comment = Comment.objects.get(id=comment_id)
        serializer = ReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        snapshot = _get_snapshot(request.user.user_id, request.user.username)
        serializer.save(reporter=snapshot, comment=comment)
        return Response({'status': 'reported'}, status=status.HTTP_201_CREATED)


class SavePostView(APIView):
    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id, author__user_id=str(request.user.user_id))
            post.is_saved = True
            post.expires_at = None
            post.save()
            return Response({'status': 'saved'})
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)


class SaveCommentView(APIView):
    def post(self, request, comment_id):
        try:
            comment = Comment.objects.get(id=comment_id, author__user_id=str(request.user.user_id))
            comment.is_saved = True
            comment.expires_at = None
            comment.save()
            return Response({'status': 'saved'})
        except Comment.DoesNotExist:
            return Response({'detail': 'Comment not found.'}, status=status.HTTP_404_NOT_FOUND)


class SavedPostsView(generics.ListAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        return Post.objects.filter(
            author__user_id=str(self.request.user.user_id),
            is_saved=True,
            is_deleted=False,
        ).select_related('author', 'group').order_by('-created_at')
