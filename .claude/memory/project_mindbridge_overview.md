---
name: project-mindbridge-overview
description: Core overview of the MindBridge mental health platform — tech stack, architecture, app structure, and current implementation status
metadata:
  type: project
---

MindBridge is a full-stack mental health companion platform. Django 5.0.4 REST API + Django Channels backend, React 18 + TypeScript frontend, MySQL (SQLite in dev), Redis, Celery.

**Why:** Solo/small-team project connecting users to mental health professionals via real-time chat, AI companion, mood-tracking, community groups, and video content.

**How to apply:** Always reference this when making architecture or tech decisions — the project is already well-structured; avoid introducing patterns that don't fit the existing style.

## Tech Stack
- **Backend:** Django 5.0.4, DRF 3.15, Django Channels 4.1, SimpleJWT, Celery + Beat
- **AI:** OpenRouter via OpenAI SDK (not Anthropic SDK directly) — supports Claude Sonnet 4, GPT-4o, Gemini Pro, Llama 3.1
- **Database:** SQLite (dev), MySQL (prod), Redis (channels + Celery broker)
- **Frontend:** React 18 + TypeScript, Redux Toolkit, React Router 6, Axios, Tailwind CSS, Vite
- **Email:** SendGrid (console backend in dev)
- **External:** YouTube Data API v3 (mood videos), Google OAuth2

## Backend Apps (all under backend/apps/)
| App | Key Models | Status |
|-----|-----------|--------|
| users | User (custom AbstractUser, email login, UUID PK), UserMood, EmailVerificationCode, PasswordResetToken, UserSession, UserGoal, ProfessionalApplication | ~90% |
| professionals | ProfessionalProfile, Availability, Booking, Review, FavouriteProfessional, SessionNote, Specialization | ~85% |
| chat | Conversation, Message, MessageRead + ChatConsumer (async WebSocket) | ~65% |
| community | CommunityGroup, GroupMembership, Post, Comment, Reaction, Report, GroupInvitation | ~80% |
| videos | Video, VideoCategory, VideoBookmark, WatchHistory, VideoRating | ~75% |
| notifications | Notification, NotificationPreference + signals push to WebSocket | ~70% |
| ai_assistant | AISession, AIMessage + OpenRouter via OpenAI SDK | ~60% |
| journals | JournalEntry, JournalPrompt | ~70% |
| achievements | Achievement, UserAchievement, UserStreak | ~50% |
| admin_panel | Admin management views | ~80% |

## URL Structure
All REST APIs: `/api/v1/` prefix
- auth/ → users.urls
- users/ → users.urls_users
- chat/ → chat.urls
- community/ → community.urls
- professionals/ → professionals.urls
- videos/ → videos.urls
- notifications/ → notifications.urls
- ai/ → ai_assistant.urls
- journals/ → journals.urls
- achievements/ → achievements.urls
- admin-panel/ → admin_panel.urls
- pro/ → professionals.urls_pro
- health/ → users.urls_health

WebSocket: ws/chat/{conversation_id}/, ws/notifications/{user_id}/

## Frontend Pages
Landing, Login, Register, VerifyEmail, ForgotPassword, ResetPassword, Dashboard, Community, GroupDetail, Chat, Professionals, ProfessionalDetail, Bookings, Videos, AICompanion, Journal, Profile, Settings, Notifications, Admin, ProDashboard

## Route Guards
- PrivateRoute: checks Redux `isAuthenticated`
- AdminRoute: checks `user.is_staff`
- ProRoute: checks `user.is_professional`
- PublicRoute: redirects authenticated users to /dashboard
