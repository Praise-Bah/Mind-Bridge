from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Achievement, UserAchievement, UserStreak
from .serializers import AchievementSerializer, UserAchievementSerializer, UserStreakSerializer


class AchievementListView(generics.ListAPIView):
    queryset = Achievement.objects.filter(is_deleted=False)
    serializer_class = AchievementSerializer


class UserAchievementListView(generics.ListAPIView):
    serializer_class = UserAchievementSerializer

    def get_queryset(self):
        return UserAchievement.objects.filter(
            user_id=str(self.request.user.user_id)
        ).select_related('achievement')


class UserStreakView(APIView):
    def get(self, request):
        streak, _ = UserStreak.objects.get_or_create(user_id=str(request.user.user_id))
        return Response(UserStreakSerializer(streak).data)


class UserProgressView(APIView):
    def get(self, request):
        user_id = str(request.user.user_id)
        streak, _ = UserStreak.objects.get_or_create(user_id=user_id)
        earned_achievements = UserAchievement.objects.filter(user_id=user_id)
        total_achievements = Achievement.objects.filter(is_deleted=False).count()
        total_points = sum(
            ua.achievement.points
            for ua in earned_achievements.select_related('achievement')
        )
        return Response({
            'current_streak': streak.current_streak,
            'longest_streak': streak.longest_streak,
            'achievements_earned': earned_achievements.count(),
            'achievements_total': total_achievements,
            'total_points': total_points,
        })
