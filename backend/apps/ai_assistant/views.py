from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import StreamingHttpResponse
from .models import AISession, AIMessage
from .serializers import AISessionSerializer, AISessionListSerializer, ChatRequestSerializer
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

        previous_messages = list(session.messages.values('role', 'content')[:-1])

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

        AIMessage.objects.create(session=session, role='user', content=message)
        previous_messages = list(session.messages.values('role', 'content')[:-1])

        ai_service = AIService()

        def stream_generator():
            full_response = ""
            for chunk in ai_service.stream_response(previous_messages, message):
                full_response += chunk
                yield f"data: {chunk}\n\n"
            
            AIMessage.objects.create(session=session, role='assistant', content=full_response)
            yield f"data: [DONE]\n\n"

        return StreamingHttpResponse(
            stream_generator(),
            content_type='text/event-stream'
        )
