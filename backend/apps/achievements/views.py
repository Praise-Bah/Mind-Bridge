from django.core.cache import cache
from django.db.models import Count, Sum
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Achievement, UserAchievement, UserStreak
from .serializers import AchievementSerializer, UserAchievementSerializer, UserStreakSerializer


class AchievementListView(generics.ListAPIView):
    serializer_class = AchievementSerializer

    def get_queryset(self):
        return Achievement.objects.filter(is_deleted=False)

    def list(self, request, *args, **kwargs):
        cached = cache.get('achievements:list')
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set('achievements:list', response.data, timeout=3600)
        return response


class UserAchievementListView(generics.ListAPIView):
    serializer_class = UserAchievementSerializer

    def get_queryset(self):
        return UserAchievement.objects.filter(user=self.request.user).select_related('achievement')


class UserStreakView(APIView):
    def get(self, request):
        streak, _ = UserStreak.objects.get_or_create(user=request.user)
        serializer = UserStreakSerializer(streak)
        return Response(serializer.data)


class UserProgressView(APIView):
    def get(self, request):
        user = request.user
        streak, _ = UserStreak.objects.get_or_create(user=user)
        agg = UserAchievement.objects.filter(user=user).aggregate(
            earned=Count('id'),
            total_points=Sum('achievement__points'),
        )
        total_achievements = Achievement.objects.filter(is_deleted=False).count()
        return Response({
            'current_streak': streak.current_streak,
            'longest_streak': streak.longest_streak,
            'achievements_earned': agg['earned'] or 0,
            'achievements_total': total_achievements,
            'total_points': agg['total_points'] or 0,
        })
