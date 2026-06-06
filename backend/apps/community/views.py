import re
import asyncio
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Count, Q, Prefetch
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CommunityGroup, GroupMembership, Post, Comment, Reaction, GroupInvitation
from .serializers import (
    CommunityGroupSerializer, CommunityGroupCreateSerializer, PostSerializer,
    CommentSerializer, ReportSerializer, GroupAnswersSerializer
)
from .ai_services import GroupApprovalAIService
from apps.notifications.publisher import publish_notification

User = get_user_model()

_GROUP_CACHE_TTL = 60  # 1 minute


def _post_queryset_base(qs):
    """Attach prefetches and annotations shared by all post list views."""
    return (
        qs.select_related('author', 'group')
        .prefetch_related(
            Prefetch(
                'reactions',
                queryset=Reaction.objects.filter(is_deleted=False),
                to_attr='prefetched_reactions',
            )
        )
        .annotate(comments_count_ann=Count('comments', filter=Q(comments__is_deleted=False), distinct=True))
    )


class CommunityGroupListView(generics.ListAPIView):
    """List all active and approved groups."""
    serializer_class = CommunityGroupSerializer

    def get_queryset(self):
        base = Q(is_active=True, is_deleted=False, is_approved=True)
        if self.request.user.is_authenticated:
            base = base | Q(
                created_by=self.request.user,
                is_user_created=True,
                is_active=True,
                is_deleted=False,
            )
        return (
            CommunityGroup.objects.filter(base)
            .select_related('created_by')
            .annotate(member_count_ann=Count('members', distinct=True))
            .order_by('-created_at')
        )

    def list(self, request, *args, **kwargs):
        page_num = request.query_params.get('page', '1')
        anon = not request.user.is_authenticated
        cache_key = f'community:groups:anon:{page_num}' if anon else None

        if cache_key:
            cached = cache.get(cache_key)
            if cached is not None:
                return Response(cached)

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        items = page if page is not None else list(queryset)

        context = self.get_serializer_context()
        if request.user.is_authenticated:
            group_ids = [g.id for g in items]
            memberships = GroupMembership.objects.filter(
                user=request.user, group_id__in=group_ids
            ).values_list('group_id', 'is_moderator')
            context['member_group_ids'] = {gid for gid, _ in memberships}
            context['moderator_group_ids'] = {gid for gid, is_mod in memberships if is_mod}

        serializer = CommunityGroupSerializer(items, many=True, context=context)
        if page is not None:
            response = self.get_paginated_response(serializer.data)
        else:
            response = Response(serializer.data)

        if cache_key:
            cache.set(cache_key, response.data, timeout=_GROUP_CACHE_TTL)
        return response


class CommunityGroupDetailView(generics.RetrieveAPIView):
    queryset = CommunityGroup.objects.filter(is_active=True, is_deleted=False)
    serializer_class = CommunityGroupSerializer
    lookup_field = 'slug'


class CreateGroupView(generics.CreateAPIView):
    """Create a new community group (requires AI approval)."""
    serializer_class = CommunityGroupCreateSerializer

    def create(self, request, *args, **kwargs):
        """Create group — AI questions are generated separately via GenerateQuestionsView."""
        return super().create(request, *args, **kwargs)


class GenerateQuestionsView(APIView):
    """Generate AI questions for an existing group."""
    
    def post(self, request, group_id):
        try:
            group = CommunityGroup.objects.get(id=group_id, created_by=request.user)

            if group.review_step != 'reason':
                return Response(
                    {'detail': 'Questions already generated or invalid step.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            creation_reason = request.data.get('creation_reason', '').strip()
            if not creation_reason:
                return Response(
                    {'detail': 'creation_reason is required to generate questions.'},
                    status=status.HTTP_400_BAD_REQUEST
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
            return Response(
                {'detail': 'Group not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'detail': f'Error generating questions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SubmitAnswersView(APIView):
    """Submit answers to AI questions and trigger evaluation."""
    
    def post(self, request, group_id):
        try:
            group = CommunityGroup.objects.get(id=group_id, created_by=request.user)
            
            if group.review_step != 'questions':
                return Response(
                    {'detail': 'Invalid step for submitting answers.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = GroupAnswersSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            answers = serializer.validated_data['answers']
            
            # Validate answers count
            if len(answers) != len(group.ai_questions):
                return Response(
                    {'detail': 'Please answer all questions.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update group with answers and start AI review
            group.ai_answers = answers
            group.review_step = 'reviewing'
            group.save()
            
            # Trigger AI evaluation in background
            self._trigger_ai_evaluation(group)
            
            return Response({
                'message': 'Answers submitted. AI evaluation in progress...',
                'review_step': 'reviewing'
            })
            
        except CommunityGroup.DoesNotExist:
            return Response(
                {'detail': 'Group not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def _trigger_ai_evaluation(self, group):
        """Dispatch AI evaluation to a Celery worker (replaces threading hack)."""
        from apps.community.tasks import evaluate_group_task
        evaluate_group_task.delay(str(group.id))


class GroupReviewStatusView(APIView):
    """Check the status of AI review for a group."""
    
    def get(self, request, group_id):
        try:
            group = CommunityGroup.objects.get(id=group_id, created_by=request.user)
            
            response_data = {
                'review_step': group.review_step,
                'ai_total_score': group.ai_total_score,
                'ai_review_summary': group.ai_review_summary,
                'approval_status': group.approval_status,
                'is_approved': group.is_approved
            }
            
            if group.review_step == 'complete':
                response_data['ai_review_scores'] = group.ai_review_scores
            
            return Response(response_data)
            
        except CommunityGroup.DoesNotExist:
            return Response(
                {'detail': 'Group not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class JoinGroupView(APIView):
    def post(self, request, slug):
        group = CommunityGroup.objects.get(slug=slug)
        
        # Check if group is private and require invite
        if group.visibility == 'private':
            return Response(
                {'detail': 'This is a private group. An invitation is required to join.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if group is approved
        if not group.is_approved:
            return Response(
                {'detail': 'This group is not yet approved.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        GroupMembership.objects.get_or_create(user=request.user, group=group)
        return Response({'status': 'joined'}, status=status.HTTP_200_OK)

    def delete(self, request, slug):
        group = CommunityGroup.objects.get(slug=slug)
        GroupMembership.objects.filter(user=request.user, group=group).delete()
        return Response({'status': 'left'}, status=status.HTTP_200_OK)


class JoinGroupByInviteView(APIView):
    """Join a private group using invite code."""
    def post(self, request, invite_code):
        try:
            invitation = GroupInvitation.objects.get(
                invite_code=invite_code,
                is_used=False
            )
            
            # Check if invitation is expired
            if invitation.is_expired():
                return Response(
                    {'detail': 'Invitation has expired.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Join the group
            group = invitation.group
            GroupMembership.objects.get_or_create(
                user=request.user,
                group=group
            )
            
            # Mark invitation as used
            invitation.is_used = True
            invitation.used_by = request.user
            invitation.used_at = timezone.now()
            invitation.save()
            
            return Response({
                'status': 'joined',
                'group_name': group.name
            }, status=status.HTTP_200_OK)
            
        except GroupInvitation.DoesNotExist:
            return Response(
                {'detail': 'Invalid invitation code.'},
                status=status.HTTP_404_NOT_FOUND
            )


class GenerateInviteView(APIView):
    """Generate invite link for a private group."""
    def post(self, request, slug):
        try:
            group = CommunityGroup.objects.get(slug=slug)
            
            # Check if user is group creator or moderator
            is_owner = group.created_by == request.user
            is_moderator = GroupMembership.objects.filter(
                user=request.user, 
                group=group, 
                is_moderator=True
            ).exists()
            
            if not (is_owner or is_moderator):
                return Response(
                    {'detail': 'Only group owners and moderators can generate invites.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create new invitation
            invitation = GroupInvitation.objects.create(
                group=group,
                created_by=request.user
            )
            
            # Generate invite URL
            invite_url = f"{request.build_absolute_uri('/')}community/join/{invitation.invite_code}/"
            
            return Response({
                'invite_code': str(invitation.invite_code),
                'invite_url': invite_url,
                'expires_at': invitation.expires_at
            }, status=status.HTTP_201_CREATED)
            
        except CommunityGroup.DoesNotExist:
            return Response(
                {'detail': 'Group not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class FeedView(generics.ListAPIView):
    """Public approved group posts visible to everyone; private joined group posts for members."""
    serializer_class = PostSerializer

    def get_queryset(self):
        public_posts = Post.objects.filter(
            group__is_approved=True,
            group__is_active=True,
            group__is_deleted=False,
            group__visibility='public',
            is_deleted=False,
        )

        if self.request.user.is_authenticated:
            joined_private = GroupMembership.objects.filter(
                user=self.request.user,
                group__visibility='private',
            ).values_list('group_id', flat=True)
            private_posts = Post.objects.filter(
                group_id__in=joined_private,
                is_deleted=False,
            )
            combined = (public_posts | private_posts).distinct()
        else:
            combined = public_posts

        return _post_queryset_base(combined).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        page_num = request.query_params.get('page', '1')
        anon = not request.user.is_authenticated
        cache_key = f'community:feed:anon:{page_num}' if anon else None

        if cache_key:
            cached = cache.get(cache_key)
            if cached is not None:
                return Response(cached)

        response = super().list(request, *args, **kwargs)

        if cache_key:
            cache.set(cache_key, response.data, timeout=30)
        return response


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        group_slug = self.kwargs.get('group_slug')
        return _post_queryset_base(
            Post.objects.filter(group__slug=group_slug, is_deleted=False)
        )

    def perform_create(self, serializer):
        group = CommunityGroup.objects.get(slug=self.kwargs['group_slug'])
        serializer.save(author=self.request.user, group=group)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        return Post.objects.filter(is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class PinPostView(APIView):
    """Toggle pin on a post — moderators only."""
    def post(self, request, post_id):
        post = Post.objects.get(id=post_id)
        is_mod = GroupMembership.objects.filter(
            user=request.user, group=post.group, is_moderator=True
        ).exists()
        if not is_mod:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        post.is_pinned = not post.is_pinned
        post.save()
        return Response({'is_pinned': post.is_pinned})


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        post_id = self.kwargs['post_id']
        return Comment.objects.filter(post_id=post_id, is_deleted=False, parent=None)

    def perform_create(self, serializer):
        post = Post.objects.get(id=self.kwargs['post_id'])
        comment = serializer.save(author=self.request.user, post=post)
        self._notify_mentions(comment)

    def _notify_mentions(self, comment):
        """Publish notification events for @mentioned users."""
        usernames = re.findall(r'@(\w+)', comment.content)
        if not usernames:
            return
        mentioned = User.objects.filter(username__in=usernames).exclude(id=comment.author_id)
        for user in mentioned:
            publish_notification(
                user_id=user.id,
                notification_type='mention',
                title=f'{comment.author.username} mentioned you',
                message=f'"{comment.content[:100]}"',
                data={'comment_id': str(comment.id), 'post_id': str(comment.post_id)},
            )


class ReactionToggleView(APIView):
    def post(self, request, post_id):
        reaction_type = request.data.get('reaction_type')
        post = Post.objects.get(id=post_id)

        reaction, created = Reaction.objects.get_or_create(
            post=post, user=request.user, reaction_type=reaction_type
        )
        if not created:
            reaction.delete()
            return Response({'status': 'removed'})
        return Response({'status': 'added'}, status=status.HTTP_201_CREATED)


class ReportPostView(APIView):
    def post(self, request, post_id):
        post = Post.objects.get(id=post_id)
        serializer = ReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(reporter=request.user, post=post)
        post.is_reported = True
        post.save()
        return Response({'status': 'reported'}, status=status.HTTP_201_CREATED)


class ReportCommentView(APIView):
    def post(self, request, comment_id):
        comment = Comment.objects.get(id=comment_id)
        serializer = ReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(reporter=request.user, comment=comment)
        return Response({'status': 'reported'}, status=status.HTTP_201_CREATED)


class SavePostView(APIView):
    """Save a post from auto-deletion."""
    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id, author=request.user)
            
            if post.author != request.user:
                return Response(
                    {'detail': 'You can only save your own posts.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            post.is_saved = True
            post.expires_at = None  # Remove expiration
            post.save()
            
            return Response({'status': 'saved'}, status=status.HTTP_200_OK)
            
        except Post.DoesNotExist:
            return Response(
                {'detail': 'Post not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class SaveCommentView(APIView):
    """Save a comment from auto-deletion."""
    def post(self, request, comment_id):
        try:
            comment = Comment.objects.get(id=comment_id, author=request.user)
            
            if comment.author != request.user:
                return Response(
                    {'detail': 'You can only save your own comments.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            comment.is_saved = True
            comment.expires_at = None  # Remove expiration
            comment.save()
            
            return Response({'status': 'saved'}, status=status.HTTP_200_OK)
            
        except Comment.DoesNotExist:
            return Response(
                {'detail': 'Comment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class SavedPostsView(generics.ListAPIView):
    """Get user's saved community posts."""
    serializer_class = PostSerializer

    def get_queryset(self):
        return Post.objects.filter(
            author=self.request.user,
            is_saved=True,
            is_deleted=False
        ).select_related('group').order_by('-created_at')
