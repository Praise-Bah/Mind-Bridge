from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CommunityGroup, GroupMembership, Post, Comment, Reaction
from .serializers import CommunityGroupSerializer, PostSerializer, CommentSerializer, ReactionSerializer


class CommunityGroupListView(generics.ListAPIView):
    queryset = CommunityGroup.objects.filter(is_active=True, is_deleted=False)
    serializer_class = CommunityGroupSerializer


class CommunityGroupDetailView(generics.RetrieveAPIView):
    queryset = CommunityGroup.objects.filter(is_active=True, is_deleted=False)
    serializer_class = CommunityGroupSerializer
    lookup_field = 'slug'


class JoinGroupView(APIView):
    def post(self, request, slug):
        group = CommunityGroup.objects.get(slug=slug)
        GroupMembership.objects.get_or_create(user=request.user, group=group)
        return Response({'status': 'joined'}, status=status.HTTP_200_OK)

    def delete(self, request, slug):
        group = CommunityGroup.objects.get(slug=slug)
        GroupMembership.objects.filter(user=request.user, group=group).delete()
        return Response({'status': 'left'}, status=status.HTTP_200_OK)


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        group_slug = self.kwargs.get('group_slug')
        return Post.objects.filter(
            group__slug=group_slug, is_deleted=False
        ).select_related('author', 'group')

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


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        post_id = self.kwargs['post_id']
        return Comment.objects.filter(post_id=post_id, is_deleted=False, parent=None)

    def perform_create(self, serializer):
        post = Post.objects.get(id=self.kwargs['post_id'])
        serializer.save(author=self.request.user, post=post)


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
