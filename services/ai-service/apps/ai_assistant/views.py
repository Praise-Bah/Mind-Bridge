from django.db import models
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404

from mindbridge_common.health import ServiceHealthView

from .models import AISession, AIMessage
from .serializers import (
    AISessionSerializer, AISessionListSerializer, ChatRequestSerializer,
    RateMessageSerializer, MoodAnalysisSerializer, MoodCheckinSerializer,
    SessionFeedbackSerializer,
)
from .crisis import CrisisDetector, CrisisEscalation
from .services import AIService


class AIServiceHealthView(ServiceHealthView):
    service_name = 'ai-service'


class AISessionListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AISessionListSerializer
        return AISessionSerializer

    def get_queryset(self):
        return AISession.objects.filter(user_id=self.request.user.user_id, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.user_id)


class AISessionDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = AISessionSerializer

    def get_queryset(self):
        return AISession.objects.filter(user_id=self.request.user.user_id, is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class ChatView(APIView):
    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']
        session_id = serializer.validated_data.get('session_id')

        if session_id:
            session = AISession.objects.get(id=session_id, user_id=request.user.user_id)
        else:
            session = AISession.objects.create(
                user_id=request.user.user_id, title=message[:50]
            )

        # Crisis detection on user message
        detector = CrisisDetector()
        crisis_analysis = detector.analyze(message)

        AIMessage.objects.create(
            session=session,
            role='user',
            content=message,
            distress_indicators=crisis_analysis['distress_score'],
            crisis_level=crisis_analysis['crisis_level'],
            detected_conditions=crisis_analysis['detected_conditions'],
        )

        all_messages = list(session.messages.order_by('created_at').values('role', 'content'))
        previous_messages = all_messages[:-1] if all_messages else []

        ai_service = AIService()
        retrieved_passages = ai_service._retrieve_context(message)
        response_text = ai_service.get_response(previous_messages, message, retrieved_passages)

        # Crisis escalation — prepend resources if needed, notify admins
        escalation = CrisisEscalation()
        response_text = escalation.process(
            crisis_analysis, response_text,
            user_id=str(request.user.user_id),
            session_id=str(session.id),
        )

        AIMessage.objects.create(session=session, role='assistant', content=response_text)

        return Response({
            'session_id': str(session.id),
            'response': response_text,
            'crisis_level': crisis_analysis['crisis_level'],
        })


class ChatStreamView(APIView):
    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']
        session_id = serializer.validated_data.get('session_id')

        if session_id:
            session = AISession.objects.get(id=session_id, user_id=request.user.user_id)
        else:
            session = AISession.objects.create(
                user_id=request.user.user_id, title=message[:50]
            )

        ai_service = AIService()

        # Crisis detection on user message
        detector = CrisisDetector()
        crisis_analysis = detector.analyze(message)

        AIMessage.objects.create(
            session=session,
            role='user',
            content=message,
            distress_indicators=crisis_analysis['distress_score'],
            crisis_level=crisis_analysis['crisis_level'],
            detected_conditions=crisis_analysis['detected_conditions'],
        )

        all_messages = list(session.messages.order_by('created_at').values('role', 'content'))
        previous_messages = all_messages[:-1] if all_messages else []
        retrieved_passages = ai_service._retrieve_context(message)

        escalation = CrisisEscalation()

        def stream_generator():
            full_response = ''
            for chunk in ai_service.get_streaming_response(previous_messages, message, retrieved_passages):
                full_response += chunk
                yield f'data: {chunk}\n\n'

            # Apply crisis escalation to the complete response
            full_response = escalation.process(
                crisis_analysis, full_response,
                user_id=str(request.user.user_id),
                session_id=str(session.id),
            )

            AIMessage.objects.create(
                session=session, role='assistant', content=full_response,
                crisis_level=crisis_analysis['crisis_level'],
                detected_conditions=crisis_analysis['detected_conditions'],
            )
            session.update_message_count()
            session.total_distress_indicators = session.messages.aggregate(
                total=models.Sum('distress_indicators')
            )['total'] or 0
            session.save(update_fields=['total_distress_indicators'])

            # Auto-classify topics every 5 messages
            if session.message_count % 5 == 0 and session.message_count > 0:
                all_msgs = list(session.messages.order_by('created_at').values('role', 'content'))
                session.topic_tags = ai_service.classify_topics(all_msgs)
                session.save(update_fields=['topic_tags'])

            yield 'data: [DONE]\n\n'

        return StreamingHttpResponse(stream_generator(), content_type='text/event-stream')


class RateMessageView(APIView):
    def post(self, request, pk):
        message = get_object_or_404(
            AIMessage, pk=pk, session__user_id=request.user.user_id
        )
        serializer = RateMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rating_value = 1 if serializer.validated_data['rating'] == 'up' else -1
        message.rating = rating_value
        message.save(update_fields=['rating'])
        return Response({'status': 'rated', 'rating': rating_value})


class SessionSummaryView(APIView):
    def get(self, request, pk):
        session = get_object_or_404(AISession, pk=pk, user_id=request.user.user_id)
        if not session.summary:
            ai_service = AIService()
            messages = list(session.messages.values('role', 'content'))
            session.summary = ai_service.generate_session_summary(messages)
            session.save(update_fields=['summary'])
        return Response({
            'session_id': str(session.id),
            'title': session.title,
            'summary': session.summary,
            'message_count': session.message_count,
            'created_at': session.created_at,
        })


class MoodDetectionView(APIView):
    def post(self, request):
        serializer = MoodAnalysisSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ai_service = AIService()
        mood_data = ai_service.analyze_mood(serializer.validated_data['message'])
        return Response(mood_data)


class MoodCheckinView(APIView):
    """Pre-session mood check-in — captures mood before AI conversation starts."""

    def post(self, request, pk):
        session = get_object_or_404(AISession, pk=pk, user_id=request.user.user_id)
        serializer = MoodCheckinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session.initial_mood = serializer.validated_data['mood']
        session.initial_mood_score = serializer.validated_data['mood_score']
        session.mood_checkin_completed = True
        session.save(update_fields=['initial_mood', 'initial_mood_score', 'mood_checkin_completed'])

        return Response({
            'status': 'mood_recorded',
            'session_id': str(session.id),
            'initial_mood': session.initial_mood,
            'initial_mood_score': session.initial_mood_score,
        })


class SessionFeedbackView(APIView):
    """Post-session feedback — captures user's rating and comments after session."""

    def post(self, request, pk):
        session = get_object_or_404(AISession, pk=pk, user_id=request.user.user_id)
        serializer = SessionFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session.feedback_rating = serializer.validated_data['rating']
        session.feedback_text = serializer.validated_data.get('text', '')
        session.save(update_fields=['feedback_rating', 'feedback_text'])

        return Response({
            'status': 'feedback_recorded',
            'session_id': str(session.id),
            'feedback_rating': session.feedback_rating,
        })


class AvailableModelsView(APIView):
    def get(self, request):
        available = AIService.get_available_models()
        return Response({'models': available})
