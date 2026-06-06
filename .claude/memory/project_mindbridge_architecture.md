---
name: project-mindbridge-architecture
description: Deep architectural details of MindBridge — base models, AI integration, key patterns, known bugs, and important implementation nuances
metadata:
  type: project
---

Key architectural facts and known issues to be aware of when working on MindBridge.

**Why:** These details are non-obvious from the code structure and affect every change made to this codebase.

**How to apply:** Check this before implementing any feature — especially around AI, auth, notifications, or community groups.

## Base Patterns
- `BaseModel` (apps/users/models.py): abstract with UUID PK, `created_at`, `updated_at`, `is_deleted` (soft delete)
- All user-owned data uses `is_deleted=True` for soft delete, never hard-delete
- Custom `User` extends `AbstractUser` with `email` as `USERNAME_FIELD` (still has `username` as REQUIRED_FIELD)
- JWT: 60-min access token, 7-day refresh with rotation/blacklisting

## AI Integration (Critical)
- Backend (`ai_assistant/services.py`): Uses **OpenAI SDK** pointed at OpenRouter base URL (`https://openrouter.ai/api/v1`)
- `requirements.txt` has BOTH `anthropic==0.23.1` AND `openai==1.35.0` — anthropic is vestigial/unused
- Model is configured via `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` env vars
- Available models: `anthropic/claude-sonnet-4`, `openai/gpt-4o`, `google/gemini-pro-1.5`, `meta-llama/llama-3.1-70b-instruct`
- Frontend (`aiService.ts`): Dual strategy — if `VITE_OPENROUTER_API_KEY` env var is set, calls OpenRouter DIRECTLY from browser (bypasses backend). Otherwise calls `/api/v1/ai/chat/`
- Streaming: Backend `ChatStreamView` returns `StreamingHttpResponse` with `text/event-stream`. Frontend `streamMessage()` uses `EventSource` with JWT token in query param (security: tokens in URL/logs)
- Community group AI approval uses 4 models in parallel (Claude 30%, GPT4 25%, Gemini 25%, Llama3 20%), score ≥ 80 = auto-approved

## Community Groups — AI Approval Workflow
1. User creates group → `CreateGroupView` calls `asyncio.run(ai_service.generate_questions())` (blocks sync thread)
2. User answers questions → `SubmitAnswersView` triggers `call_command('evaluate_group_ai', group_id)` in background
3. Weighted score from 4 AI models determines approval (≥80 approved, 50-79 review, <50 rejected)
4. `asyncio.run()` in sync Django views is problematic in environments with existing event loops

## Posts/Comments Auto-Expiry
- All Posts and Comments auto-expire after 48 hours (`expires_at` set in `save()`)
- `is_saved=True` + `expires_at=None` prevents deletion
- `SavePostView` only allows users to save their own posts
- Management command: `apps/community/management/commands/cleanup_expired_messages.py`

## Notification System
- `Notification` model in `notifications/models.py`
- Django signal `post_save` on Notification → pushes to `notifications_{user_id}` WebSocket group via `async_to_sync`
- Celery tasks: `notifications/tasks.py` for daily email digests
- `NotificationPreference` is get_or_create'd in the view

## Professional Dashboard (Pro)
- Separate `views_pro.py` + `urls_pro.py` under `/api/v1/pro/`
- Uses `IsProfessional` permission class (`professionals/permissions.py`)
- Monthly earnings uses `timedelta(days=28)` approximation — not exact months
- Booking creation notification uses wrong field: `recipient=` but Notification model has `user=`

## Known Bugs / Issues
1. **Notification field mismatch**: `professionals/views.py` line 89 creates Notification with `recipient=` kwarg but model uses `user=` field — will raise TypeError
2. **UserMoodCalendarView** (users/views.py ~line 443): calls `.values('recorded_date', 'mood_score', 'mood_type')` but `UserMood` has no `mood_type` field — will raise error
3. **SavePostView double-check**: filters by `Post.objects.get(id=post_id, author=request.user)` then checks `if post.author != request.user` — that branch can never be True
4. **asyncio.run() in sync views**: community/views.py calls `asyncio.run()` for AI — problematic in some deployment environments
5. **JWT access token mismatch**: SRS specifies 15 min, settings.py has 60 min
6. **CommunityGroupListView union query** can return duplicates when user's own approved groups overlap with public approved groups
7. **ai-companion-preview route** in App.tsx has no auth guard (deliberate for testing but is a security gap)
8. **VideoSearchView**: saves YouTube results to DB without checking `youtube_id` blank — could create invalid records

## Frontend State Management
- Redux Toolkit slices: `authSlice`, `chatSlice`, `notificationSlice`, `uiSlice`
- `authSlice` initializes `isAuthenticated: !!localStorage.getItem('token')` — no token validation on startup
- `fetchCurrentUser` thunk used to hydrate user object after login
- API service in `api.ts`: auto-refresh on 401, then redirect to /login on failure

## Settings
- Dev: `development.py` — SQLite, console email, debug toolbar
- Uses `python-decouple` for all env vars
- `OPENROUTER_MODELS` dict in base.py defines available AI models
- Channel layers: RedisChannelLayer via `REDIS_URL` env var
