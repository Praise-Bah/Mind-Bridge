# MindBridge - Mental Health Support Platform

A comprehensive mental health support platform featuring AI-powered assistance, professional consultations, community support, and self-care tools.

## Features

- **AI Mental Health Assistant** - Claude-powered conversational support
- **Professional Consultations** - Book sessions with mental health professionals
- **Community Support** - Join support groups and connect with others
- **Video Resources** - Curated mental health content
- **Journaling** - Track your thoughts and emotional journey
- **Mood Tracking** - Monitor your mental wellbeing over time
- **Achievements & Streaks** - Gamified engagement system
- **Real-time Chat** - WebSocket-based messaging

## Tech Stack

### Backend
- **Framework**: Django 5.0 + Django REST Framework
- **Database**: MySQL 8.0
- **Cache/Queue**: Redis
- **WebSockets**: Django Channels
- **Task Queue**: Celery + Celery Beat
- **AI**: Anthropic Claude API
- **Authentication**: JWT (SimpleJWT)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit + React Query
- **Styling**: TailwindCSS
- **UI Components**: Radix UI
- **Icons**: Lucide React

## Project Structure

```
Mind-Bridge/
├── backend/
│   ├── apps/
│   │   ├── users/          # Authentication & user management
│   │   ├── chat/           # Real-time messaging
│   │   ├── community/      # Groups, posts, comments
│   │   ├── professionals/  # Professional profiles & bookings
│   │   ├── videos/         # Video content management
│   │   ├── notifications/  # Push notifications
│   │   ├── ai_assistant/   # AI chat integration
│   │   ├── journals/       # Journal entries
│   │   └── achievements/   # Gamification
│   ├── core/               # Django project settings
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store & slices
│   │   ├── types/          # TypeScript types
│   │   └── lib/            # Utilities
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL 8.0
- Redis

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Mind-Bridge
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
cp .env.example .env
# Edit .env with your configuration

# Create MySQL database
mysql -u root -p
> CREATE DATABASE mindbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> exit

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### 3. Start Redis (for Celery & Channels)

```bash
# Windows (using WSL or Docker):
redis-server

# macOS:
brew services start redis

# Linux:
sudo systemctl start redis
```

### 4. Start Celery Workers

```bash
# In a new terminal (with venv activated)
cd backend
celery -A core worker -l info

# In another terminal for scheduled tasks
celery -A core beat -l info
```

### 5. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1/
- **API Documentation**: http://localhost:8000/api/docs/
- **Admin Panel**: http://localhost:8000/admin/

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `DJANGO_ENV` | Environment (development/production/testing) |
| `SECRET_KEY` | Django secret key |
| `DB_NAME` | MySQL database name |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `REDIS_URL` | Redis connection URL |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `YOUTUBE_API_KEY` | YouTube Data API key |
| `SENDGRID_API_KEY` | SendGrid API key for emails |

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_WS_URL` | WebSocket server URL |

## API Endpoints

### Authentication
- `POST /api/v1/auth/register/` - User registration
- `POST /api/v1/auth/login/` - User login (JWT)
- `POST /api/v1/auth/refresh/` - Refresh token

### Users
- `GET /api/v1/users/profile/` - Get current user profile
- `PATCH /api/v1/users/profile/` - Update profile
- `GET /api/v1/users/moods/` - Get mood history

### Community
- `GET /api/v1/community/groups/` - List community groups
- `GET /api/v1/community/groups/{slug}/posts/` - Get group posts
- `POST /api/v1/community/groups/{slug}/posts/` - Create post

### Professionals
- `GET /api/v1/professionals/` - List professionals
- `GET /api/v1/professionals/{id}/availability/` - Get availability
- `POST /api/v1/professionals/bookings/` - Create booking

### AI Assistant
- `POST /api/v1/ai/chat/` - Send message to AI
- `GET /api/v1/ai/sessions/` - List AI sessions

## Development

### Running Tests

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm run test
```

### Linting

```bash
# Frontend
cd frontend
npm run lint
```

## Deployment

### Production Checklist

1. Set `DJANGO_ENV=production`
2. Set `DEBUG=False`
3. Configure secure `SECRET_KEY`
4. Set up SSL/TLS certificates
5. Configure production database
6. Set up Redis for production
7. Configure email service (SendGrid)
8. Set up static file serving
9. Configure CORS for production domains

## License

This project is proprietary and confidential.

## Support

For support, please contact the development team.