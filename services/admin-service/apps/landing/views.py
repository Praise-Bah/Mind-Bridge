from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def landing_data(request):
    return Response({
        'stats': {
            'active_users': '10K+',
            'professionals': '500+',
            'ai_support': '24/7',
        },
        'features': [
            {
                'icon': 'MessageCircle',
                'title': 'AI Companion',
                'description': '24/7 AI-powered support for when you need someone to talk to. Empathetic, understanding, and always available.',
                'color': 'from-cyan-500 to-blue-500',
            },
            {
                'icon': 'Brain',
                'title': 'Licensed Professionals',
                'description': 'Connect with verified mental health professionals for real-time chat sessions and personalized care.',
                'color': 'from-purple-500 to-pink-500',
            },
            {
                'icon': 'Video',
                'title': 'Mood-Based Videos',
                'description': 'Curated therapeutic content matched to your current mood. Meditation, relaxation, and motivational videos.',
                'color': 'from-blue-500 to-cyan-500',
            },
            {
                'icon': 'Users',
                'title': 'Community Support',
                'description': 'Join supportive groups with like-minded individuals. Share experiences, find understanding, heal together.',
                'color': 'from-pink-500 to-purple-500',
            },
        ],
        'testimonials': [
            {'id': 1, 'name': 'Sarah M.', 'role': 'User since 2024', 'avatar': 'SM', 'rating': 5,
             'content': 'MindBridge has been a lifeline for me. The AI companion is always there when I need someone to talk to, and connecting with a real therapist was seamless.'},
            {'id': 2, 'name': 'James K.', 'role': 'User since 2024', 'avatar': 'JK', 'rating': 5,
             'content': "The mood-based video recommendations are incredibly accurate. It's like the app knows exactly what I need to feel better."},
            {'id': 3, 'name': 'Emily R.', 'role': 'User since 2025', 'avatar': 'ER', 'rating': 5,
             'content': 'Finding a therapist who understands me was always hard. MindBridge made it easy to connect with the right professional.'},
            {'id': 4, 'name': 'Michael T.', 'role': 'User since 2024', 'avatar': 'MT', 'rating': 5,
             'content': "The community groups have helped me realize I'm not alone. Sharing experiences with others who understand is incredibly healing."},
            {'id': 5, 'name': 'Dr. Amanda L.', 'role': 'Licensed Therapist', 'avatar': 'AL', 'rating': 5,
             'content': "As a professional on MindBridge, I've been able to reach and help more people than ever before. The platform is intuitive and secure."},
        ],
    })
