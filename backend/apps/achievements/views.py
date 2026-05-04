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
        earned_achievements = UserAchievement.objects.filter(user=user).count()
        total_achievements = Achievement.objects.filter(is_deleted=False).count()
        total_points = sum(
            ua.achievement.points for ua in UserAchievement.objects.filter(user=user).select_related('achievement')
        )

        return Response({
            'current_streak': streak.current_streak,
            'longest_streak': streak.longest_streak,
            'achievements_earned': earned_achievements,
            'achievements_total': total_achievements,
            'total_points': total_points,
        })
