# MindBridge - Project Knowledge & Development Status

> **Purpose:** This document provides a comprehensive snapshot of the MindBridge Mental Health Companion Platform, including VPS setup, development progress, architecture, blockers, and next steps. Feed this to an AI to get full context about the project.

---

## 1. Project Overview

**MindBridge** is a full-stack mental health companion platform connecting users with licensed professionals via real-time chat, an AI companion for immediate support, mood-based therapeutic video content, and community support groups.

### Key Features (Planned & Implemented)
- **Authentication & Onboarding** - JWT-based auth, user/professional registration, onboarding wizard
- **User Dashboard** - Mood tracking, quick actions, upcoming sessions, streak counter
- **Professional Chat** - Real-time WebSocket messaging with read receipts, typing indicators, file sharing
- **AI Companion** - Anthropic Claude integration with streaming responses, conversation history
- **Mood-Based Video System** - YouTube API + local video storage, mood-tagged content
- **Community & Groups** - Posts, comments, reactions, anonymous posting, reports
- **Find a Professional / Booking** - Directory, filtering, availability calendar, session booking
- **User Profile & Journal** - Mood heatmap calendar, journal entries, achievements
- **Notifications & Email** - WebSocket real-time notifications, Celery Beat scheduled daily emails
- **Admin Panel** - User management, professional approval, moderation queue, analytics
- **Professional Dashboard** - Today's sessions, patient list, availability manager, session notes, earnings

---

## 2. Technology Stack

### Backend
| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Framework | Django | 5.0.4 | |
| API | Django REST Framework | 3.15.1 | |
| WebSockets | Django Channels | 4.1.0 | Real-time chat |
| Auth | SimpleJWT | 5.3.1 | JWT tokens |
| Database | MySQL | 8.0 | Hosted on Ubuntu VPS |
| Cache/Broker | Redis | 7.x | Channels layer + Celery |
| Task Queue | Celery + Celery Beat | 5.3.6 | Async jobs + scheduled emails |
| AI | Anthropic Python SDK | 0.23.1 | Claude API |
| Email | SendGrid | 6.11.0 | Transactional + bulk |
| Videos | YouTube Data API v3 | v3 | Mood-based search |
| Storage | django-storages + boto3 | 1.14.2 | S3-compatible |
| Docs | drf-spectacular | 0.27.2 | OpenAPI/Swagger |
| Admin | django-debug-toolbar | 6.3.0 | Dev only |
| Server | Daphne | 4.1.0 | ASGI server |

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18.x |
| Language | TypeScript | |
| State | Redux Toolkit | |
| Routing | React Router | 6.x |
| HTTP | Axios | |
| Styling | Tailwind CSS | |
| Build | Vite | |

### Infrastructure
| Component | Technology | Notes |
|-----------|-----------|-------|
| VPS OS | Ubuntu Server | 22.04 LTS |
| Web Server | Nginx | 1.24 - Reverse proxy + SSL |
| App Server | Gunicorn + Daphne | WSGI + ASGI |
| SSL | Let's Encrypt + Certbot | Free HTTPS |
| Process Manager | Supervisor/systemd | Service lifecycle |

---

## 3. Development Progress

### 3.1 Backend Progress

#### Fully Implemented Apps
| App | Status | Key Models | API Endpoints |
|-----|--------|------------|---------------|
| **users** | 90% | User, UserMood | Auth (register/login/JWT), user profile, health check |
| **professionals** | 85% | ProfessionalProfile, Availability, Booking, Review, SessionNote | Professional listings, booking CRUD, availability, reviews, **pro dashboard endpoints** |
| **community** | 80% | Group, Post, Comment, Reaction, Report | Posts feed, comments, reactions, anonymous posting, reports |
| **videos** | 75% | Video, MoodTag, Bookmark | Video list, mood filtering, bookmarks, YouTube integration |
| **notifications** | 70% | Notification, Preference | List, mark read, preferences |
| **chat** | 65% | Conversation, Message | WebSocket consumers, conversation list, messages |
| **ai_assistant** | 60% | AISession, AIMessage | Chat sessions, Anthropic integration |
| **journals** | 70% | JournalEntry, MoodEntry | CRUD, mood tracking |
| **admin_panel** | 80% | ModerationReport | Dashboard stats, user management, professional approval |
| **achievements** | 50% | Achievement, UserAchievement | Basic badge system |

#### Backend Architecture Details
- **Settings:** Modular settings (`base.py`, `development.py`, `production.py`, `testing.py`)
- **Base Model:** `BaseModel` with UUID PK, timestamps, soft-delete (`is_deleted`)
- **Custom User:** Email-based login, `is_professional`, `is_staff`, `is_online`, `last_seen`
- **Soft Delete Pattern:** Used across most models with `is_deleted` field
- **Permissions:** `IsProfessional` permission for pro endpoints, `IsAdminUser` for admin
- **API Base Path:** `/api/v1/`
- **Pro API Path:** `/api/v1/pro/`

#### Professional Dashboard (Recently Added)
Implemented in `apps/professionals/views_pro.py` and `urls_pro.py`:
- `GET /api/v1/pro/today-sessions/` - Today's scheduled sessions with countdown
- `GET /api/v1/pro/patients/` - Patient list with last session date and mood trend
- `GET/POST /api/v1/pro/availability/` - Availability CRUD
- `GET/POST /api/v1/pro/notes/` - Session notes per patient
- `GET /api/v1/pro/earnings/` - Earnings summary with monthly breakdown
- `GET/PATCH /api/v1/pro/profile/` - Profile editor with FormData support

### 3.2 Frontend Progress

#### Implemented Pages
| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Login | `/login` | 90% | JWT auth, form validation |
| Register | `/register` | 90% | User/professional registration |
| Dashboard | `/dashboard` | 80% | Mood check-in, quick actions, streaks |
| Community | `/community` | 85% | Post feed, groups, reactions |
| Group Detail | `/community/:slug` | 75% | Group-specific posts |
| Chat | `/chat` | 70% | WebSocket messaging |
| Professionals | `/professionals` | 80% | Directory, filtering |
| Professional Detail | `/professionals/:id` | 75% | Profile, booking calendar |
| Bookings | `/bookings` | 70% | Session management |
| Videos | `/videos` | 80% | Mood filter, video cards |
| AI Companion | `/ai-companion` | 75% | Streaming chat, suggested prompts |
| Journal | `/journal` | 75% | Mood calendar, entries |
| Profile | `/profile` | 70% | User profile, achievements |
| Settings | `/settings` | 65% | Preferences, notifications |
| Notifications | `/notifications` | 70% | Notification list |
| Admin Panel | `/admin` | 80% | Stats, user management, moderation |
| **Pro Dashboard** | `/pro/dashboard` | 85% | 6-tab dashboard (NEW) |
| 404 | `*` | 100% | Not found page |

#### Frontend Architecture Details
- **State Management:** Redux Toolkit with auth slice
- **Route Guards:** `PrivateRoute`, `AdminRoute`, `ProRoute`
- **API Services:** Layered service modules (`services/api.ts`, `services/proDashboardService.ts`, `services/apiHelpers.ts`)
- **Types:** Centralized in `types/index.ts`
- **Components:** Reusable UI components in `components/` (Button, Modal, Card, Avatar, Sidebar)
- **Layout:** `MainLayout`, `AuthLayout` wrappers
- **Animations:** Custom CSS keyframes for earnings bar, calendar slot pulse

#### Recently Added (Pro Dashboard)
- `frontend/src/pages/pro/ProDashboard.tsx` - 6-tab professional dashboard
  - Tab 1: Today's Sessions (with countdown timer)
  - Tab 2: Patient List (with mood trend)
  - Tab 3: Availability Manager (weekly calendar grid)
  - Tab 4: Session Notes (rich text per patient)
  - Tab 5: Earnings Overview (monthly breakdown)
  - Tab 6: Profile Editor (FormData patch)
- `frontend/src/services/proDashboardService.ts` - All pro API calls
- `frontend/src/services/apiHelpers.ts` - `getList`, `patchForm`, `unwrapList` helpers
- `frontend/src/types/index.ts` - Added `SessionNote`, `PatientEntry`, `EarningsSummary`, `ProBooking`

### 3.3 API Endpoints Summary

All APIs are under `/api/v1/`:

```
auth/           -> JWT login, register, refresh, password reset
users/          -> User profile, moods, health check
chat/           -> Conversations, messages (WebSocket at /ws/)
community/      -> Groups, posts, comments, reactions, reports
professionals/  -> Professional directory, booking, availability
videos/         -> Video list, bookmarks, mood filtering
notifications/  -> Notifications, preferences
ai/             -> AI companion sessions
journals/       -> Journal entries, mood entries
achievements/   -> Achievements, badges
admin-panel/    -> Admin dashboard, moderation, stats
pro/            -> Professional dashboard endpoints
health/         -> Health check endpoint
```

---

## 4. VPS Setup & Infrastructure

### 4.1 Current VPS Status
- **VPS OS:** Ubuntu Server (ready)
- **MySQL:** Installed and configured
- **Database:** `mindbridge_db` created
- **User:** `mindbridge_user` created with full privileges
- **Remote Access:** MySQL configured for remote connections (`bind-address = 0.0.0.0`)
- **Firewall:** Port 3306 allowed through UFW

### 4.2 MySQL Setup Commands (Completed on VPS)
```bash
# MySQL installation and configuration
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation

# Database and user creation
sudo mysql -u root -p
CREATE DATABASE mindbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mindbridge_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON mindbridge_db.* TO 'mindbridge_user'@'%';
FLUSH PRIVILEGES;

# Remote access configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Changed: bind-address = 0.0.0.0
sudo systemctl restart mysql
```

### 4.3 Django Database Configuration
Updated `backend/core/settings/development.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config('DB_NAME', default='mindbridge_db'),
        'USER': config('DB_USER', default='mindbridge_user'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='3306'),
        'OPTIONS': {'charset': 'utf8mb4'},
    }
}
```

### 4.4 Environment Configuration
`.env` file contains:
```env
DB_NAME=mindbridge_db
DB_USER=mindbridge_user
DB_PASSWORD=<vps_mysql_password>
DB_HOST=<vps_public_ip>
DB_PORT=3306
```

### 4.5 Deployment Architecture (Planned)
```
User Browser
    |
    v
HTTPS (443)
    |
    v
Nginx (VPS)
    |---> /api/*  -> Gunicorn (Django REST, port 8000)
    |---> /ws/*   -> Daphne (Django Channels, port 8001)
    |---> /static/* -> Nginx serves React build
    |
    v
MySQL (localhost:3306)
Redis (localhost:6379)
```

---

## 5. Project File Structure

```
Mind-Bridge/
├── README.md
├── PROJECT_KNOWLEDGE.md          <- This file
├── _MConverter.eu_MindBridge_SRS.md  <- Full SRS document
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt          <- Updated for Python 3.13 compat
│   ├── .env                      <- Environment variables (gitignored)
│   ├── .env.example              <- Template for .env
│   ├── db.sqlite3               <- SQLite file (for local dev fallback)
│   │
│   ├── core/
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py          <- Base settings
│   │   │   ├── development.py   <- Dev settings (MySQL config updated)
│   │   │   ├── production.py    <- Prod settings
│   │   │   └── testing.py       <- Test settings
│   │   ├── urls.py              <- Main URL routing
│   │   ├── wsgi.py
│   │   ├── asgi.py
│   │   └── celery.py
│   │
│   └── apps/
│       ├── users/               <- Auth, User model, UserMood
│       ├── professionals/       <- Pro profiles, Booking, Availability, SessionNote
│       ├── chat/                <- WebSocket consumers, Conversation, Message
│       ├── community/           <- Groups, Posts, Comments, Reactions, Reports
│       ├── videos/              <- Video metadata, YouTube API, Bookmarks
│       ├── ai_assistant/        <- Anthropic Claude integration, AI sessions
│       ├── journals/            <- Journal entries, Mood tracking
│       ├── notifications/       <- In-app notifications, email triggers
│       ├── achievements/        <- Badges, achievements
│       └── admin_panel/         <- Admin views, moderation, analytics
│
└── frontend/
    ├── src/
    │   ├── App.tsx               <- Router with route guards
    │   ├── main.tsx
    │   ├── store/                <- Redux store config
    │   ├── types/index.ts        <- All TypeScript interfaces
    │   ├── services/
    │   │   ├── api.ts            <- Axios instance with interceptors
    │   │   ├── apiHelpers.ts   <- getList, patchForm, unwrapList helpers
    │   │   ├── proDashboardService.ts  <- Pro dashboard API calls
    │   │   └── [other services]
    │   ├── pages/
    │   │   ├── auth/             <- Login, Register
    │   │   ├── pro/              <- ProDashboard.tsx
    │   │   ├── admin/            <- AdminPage.tsx
    │   │   ├── professionals/    <- Directory, Detail, Bookings
    │   │   ├── community/        <- Feed, GroupDetail
    │   │   ├── chat/             <- ChatPage.tsx
    │   │   ├── videos/           <- VideosPage.tsx
    │   │   ├── ai/               <- AICompanionPage.tsx
    │   │   ├── journal/          <- JournalPage.tsx
    │   │   ├── profile/          <- ProfilePage.tsx
    │   │   ├── settings/         <- SettingsPage.tsx
    │   │   ├── notifications/    <- NotificationsPage.tsx
    │   │   ├── DashboardPage.tsx
    │   │   └── NotFoundPage.tsx
    │   ├── components/
    │   │   ├── layout/           <- MainLayout, AuthLayout, Sidebar
    │   │   ├── admin/            <- Admin components (StatCard, etc.)
    │   │   ├── community/        <- PostCard, CommentSection
    │   │   └── [other components]
    │   └── index.css             <- Global styles, animations
    ├── package.json
    └── vite.config.ts
```

---

## 6. Environment Setup Issues (Resolved & Current)

### 6.1 Resolved Issues
1. **Pillow 10.3.0 incompatible with Python 3.13** -> Updated to `Pillow>=10.4.0`
2. **mysqlclient 2.2.4 incompatible with Python 3.13** -> Updated to `mysqlclient>=2.2.8`
3. **django-debug-toolbar missing from requirements** -> Added `django-debug-toolbar==4.4.6`
4. **All dependencies now install successfully** via `pip install -r requirements.txt`

### 6.2 Current Blocker
**`ModuleNotFoundError: No module named 'openai'`**

The `ai_assistant` app imports `openai` module (in `services.py`), but the `requirements.txt` uses `anthropic==0.23.1` instead of the OpenAI SDK. This is a **dependency mismatch**.

**Fix needed:** Either:
- Add `openai` to `requirements.txt` (if the AI service actually uses OpenAI)
- OR refactor `ai_assistant/services.py` to use Anthropic SDK instead of OpenAI

---

## 7. DRY/KISS Refactoring Plan (In Progress)

The user approved a moderate refactoring to introduce base classes/mixins where it saves real repetition.

### 7.1 Frontend Refactoring
- **Created:** `frontend/src/services/apiHelpers.ts`
  - `unwrapList<T>(data)` - Unwraps paginated `{results: T}` or direct `T`
  - `getList<T>(url, params)` - GET + unwrap
  - `patchForm<T>(url, data)` - PATCH with multipart/form-data
- **Next:** Update all services to use these helpers (no response shape changes)

### 7.2 Backend Refactoring (Planned)
- **Soft-Delete Manager/QuerySet:** Add `active()` and `soft_delete()` helpers, keep `objects` unfiltered
- **SoftDeleteViewMixin:** Add `perform_destroy` logic for soft deletes
- **Target Views:** Apply to high-repetition apps (community, journals, notifications, ai)
- **Serializer Mixins:** Add display field mixins (include professional/admin serializers)

---

## 8. Testing Status

### Current Test Coverage
- **Backend:** Basic pytest setup with `pytest-django` and `factory-boy`
- **Frontend:** No automated tests configured yet
- **Manual Testing:** User can navigate all frontend pages, test API endpoints via Swagger UI at `/api/docs/`

### Testing Commands
```bash
# Backend tests
pytest

# Run specific app tests
pytest apps/users/tests.py
pytest apps/professionals/tests.py
```

---

## 9. Next Steps / Action Items

### Immediate (This Session)
1. [ ] **Fix `openai` module missing** - Add to requirements.txt or refactor to Anthropic
2. [ ] **Run `python manage.py migrate`** - Apply all migrations to MySQL VPS
3. [ ] **Create superuser** - `python manage.py createsuperuser` for admin access
4. [ ] **Test backend connection to VPS MySQL** - Verify database connectivity

### Short Term (Next Few Sessions)
5. [ ] **Complete DRY/KISS refactoring** - Frontend helpers + backend mixins
6. [ ] **Test all API endpoints** - Via Swagger UI or Postman
7. [ ] **Implement WebSocket chat** - Full real-time messaging
8. [ ] **Add AI companion streaming** - SSE with Anthropic API
9. [ ] **Configure Celery + Redis** - For async tasks and scheduled emails

### Medium Term (Deployment)
10. [ ] **Set up Nginx on VPS** - Reverse proxy configuration
11. [ ] **Build React for production** - `npm run build`
12. [ ] **Configure Gunicorn + Daphne** - Serve Django WSGI + ASGI
13. [ ] **Set up SSL with Let's Encrypt** - HTTPS certificates
14. [ ] **Configure Supervisor/systemd** - Auto-restart services
15. [ ] **Deploy static files** - Upload React build to VPS

---

## 10. Key Configuration Files

### Backend Requirements (requirements.txt)
```
Django==5.0.4
djangorestframework==3.15.1
django-cors-headers==4.3.1
django-filter==24.2
channels==4.1.0
channels-redis==4.2.0
daphne==4.1.0
djangorestframework-simplejwt==5.3.1
PyJWT==2.8.0
mysqlclient>=2.2.8
django-mysql==4.12.0
redis==5.0.3
celery==5.3.6
django-celery-beat==2.6.0
django-celery-results==2.5.1
anthropic==0.23.1
google-api-python-client==2.126.0
sendgrid==6.11.0
python-decouple==3.8
dj-database-url==2.1.0
Pillow>=10.4.0
django-storages==1.14.2
boto3==1.34.74
python-dateutil==2.9.0
pytz==2024.1
pytest==8.1.1
pytest-django==4.8.0
pytest-asyncio==0.23.6
factory-boy==3.3.0
faker==24.4.0
responses==0.25.0
fakeredis==2.21.3
black==24.3.0
flake8==7.0.0
isort==5.13.2
drf-spectacular==0.27.2
django-ratelimit==4.1.0
django-debug-toolbar==4.4.6
```

### Django Settings Key Values
- **Development DB:** MySQL (VPS) via environment variables
- **Production DB:** MySQL (VPS or managed)
- **Celery Broker:** Redis (`redis://localhost:6379/0`)
- **Channel Layers:** Redis
- **JWT Access Token:** 60 minutes
- **JWT Refresh Token:** 7 days
- **CORS:** `http://localhost:3000`, `http://127.0.0.1:3000`
- **Media Uploads:** `MEDIA_ROOT = BASE_DIR / 'media'`

### Frontend Package.json (Key Dependencies)
- `react`, `react-dom`, `react-router-dom`
- `@reduxjs/toolkit`, `react-redux`
- `axios`
- `tailwindcss`, `postcss`, `autoprefixer`
- `typescript`, `@types/react`, `@types/react-dom`
- `vite`

---

## 11. Important Notes for AI Assistants

### When Working on This Project:
1. **Backend changes** should follow Django best practices and PEP 8
2. **Frontend changes** use TypeScript, React functional components, and Tailwind CSS
3. **Database** is MySQL on a remote VPS - do not assume SQLite
4. **Soft delete** is the pattern used (`is_deleted` field) - do not hard-delete
5. **Authentication** is JWT-based via `Authorization: Bearer <token>` header
6. **Professional routes** require `is_professional=True` on the user
7. **Admin routes** require `is_staff=True`
8. **Environment variables** are loaded via `python-decouple` from `.env` file
9. **The user wants to be asked before making decisions** - do not assume
10. **The user prefers moderate refactoring** - DRY/KISS with base classes where it saves real repetition

### Current Environment:
- **Local OS:** Windows
- **Python:** 3.13.2 (this caused Pillow/mysqlclient build issues, now resolved)
- **Backend Virtual Environment:** `backend/venv/`
- **Frontend Dev Server:** `npm run dev` (port 3000)
- **Backend Dev Server:** `python manage.py runserver` (port 8000)

### Recent Work History:
- Professional Dashboard feature was recently added (frontend + backend)
- VPS MySQL setup was completed
- Requirements.txt was updated for Python 3.13 compatibility
- `django-debug-toolbar` was added to requirements
- `apiHelpers.ts` was created for frontend DRY refactoring

---

*Document Last Updated: May 30, 2026*
