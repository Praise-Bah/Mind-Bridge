from django.db import models
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from .models import AISession, AIMessage
from .serializers import (
    AISessionSerializer, AISessionListSerializer, ChatRequestSerializer,
    RateMessageSerializer, MoodAnalysisSerializer
)
from .services import AIService


class AISessionListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AISessionListSerializer
        return AISessionSerializer

    def get_queryset(self):
        return AISession.objects.filter(user=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AISessionDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = AISessionSerializer

    def get_queryset(self):
        return AISession.objects.filter(user=self.request.user, is_deleted=False)

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
            session = AISession.objects.get(id=session_id, user=request.user)
        else:
            session = AISession.objects.create(user=request.user, title=message[:50])

        AIMessage.objects.create(session=session, role='user', content=message)

        # Get all messages except the one we just created (exclude last message)
        all_messages = list(session.messages.order_by('created_at').values('role', 'content'))
        previous_messages = all_messages[:-1] if all_messages else []

        ai_service = AIService()
        response_text = ai_service.get_response(previous_messages, message)

        AIMessage.objects.create(session=session, role='assistant', content=response_text)

        return Response({
            'session_id': str(session.id),
            'response': response_text
        })


class ChatStreamView(APIView):
    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']
        session_id = serializer.validated_data.get('session_id')

        if session_id:
            session = AISession.objects.get(id=session_id, user=request.user)
        else:
            session = AISession.objects.create(user=request.user, title=message[:50])

        ai_service = AIService()
        distress_count = ai_service.detect_distress(message)
        
        AIMessage.objects.create(
            session=session, 
            role='user', 
            content=message,
            distress_indicators=distress_count
        )
        # Get all messages except the one we just created (exclude last message)
        all_messages = list(session.messages.order_by('created_at').values('role', 'content'))
        previous_messages = all_messages[:-1] if all_messages else []

        def stream_generator():
            full_response = ""
            for chunk in ai_service.stream_response(previous_messages, message):
                full_response += chunk
                yield f"data: {chunk}\n\n"
            
            AIMessage.objects.create(session=session, role='assistant', content=full_response)
            session.update_message_count()
            session.total_distress_indicators = session.messages.aggregate(
                total=models.Sum('distress_indicators')
            )['total'] or 0
            session.save(update_fields=['total_distress_indicators'])
            yield "data: [DONE]\n\n"

        return StreamingHttpResponse(
            stream_generator(),
            content_type='text/event-stream'
        )


class RateMessageView(APIView):
    def post(self, request, pk):
        message = get_object_or_404(AIMessage, pk=pk, session__user=request.user)
        serializer = RateMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        rating_value = 1 if serializer.validated_data['rating'] == 'up' else -1
        message.rating = rating_value
        message.save(update_fields=['rating'])
        
        return Response({'status': 'rated', 'rating': rating_value})


class SessionSummaryView(APIView):
    def get(self, request, pk):
        session = get_object_or_404(AISession, pk=pk, user=request.user)
        
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
            'created_at': session.created_at
        })


class MoodDetectionView(APIView):
    def post(self, request):
        serializer = MoodAnalysisSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        ai_service = AIService()
        mood_data = ai_service.analyze_mood(serializer.validated_data['message'])
        
        return Response(mood_data)


class AvailableModelsView(APIView):
    """Return list of available AI models for the frontend."""
    def get(self, request):
        models = AIService.get_available_models()
        return Response({'models': models})
