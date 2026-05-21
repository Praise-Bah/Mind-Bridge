**SOFTWARE REQUIREMENTS SPECIFICATION**

**MindBridge Mental Health Companion Platform**

*A Comprehensive Full-Stack Web Application*

**Document Version:** 1.0 --- Final

**Status:** Approved for Development

**Date:** April 2025

**Classification:** Confidential

**Stack:** Django (Python) · React · MySQL · VPS

**Prepared By:** Technical Architecture Team

**Target Audience:** Developers, Project Managers, Stakeholders

**Table of Contents**

The following sections constitute the complete Software Requirements Specification for the MindBridge platform. Each section number corresponds to the headings in this document.

**1.** Introduction & Project Overview

**2.** System Overview & Architecture

**3.** Stakeholders & User Roles

**4.** Functional Requirements

> **4.1.** Authentication & Onboarding
>
> **4.2.** User Dashboard
>
> **4.3.** Professional Chat (Real-time)
>
> **4.4.** AI Companion
>
> **4.5.** Mood-Based Video System
>
> **4.6.** Community & Groups
>
> **4.7.** Find a Professional / Booking
>
> **4.8.** User Profile & Journal
>
> **4.9.** Notifications & Email System
>
> **4.10.** Admin Panel
>
> **4.11.** Professional Dashboard

**5.** Non-Functional Requirements

**6.** System Architecture & Technology Stack

**7.** Database Schema & Data Models

**8.** API Specification

**9.** Frontend Architecture

**10.** Security Requirements

**11.** Deployment & Infrastructure

**12.** Project File Structure

**13.** Development Roadmap & Milestones

**14.** Testing Strategy

**15.** Appendices

**1. Introduction & Project Overview**

**1.1 Purpose**

This Software Requirements Specification (SRS) document provides a complete, authoritative description of the MindBridge Mental Health Companion Platform. It defines all functional requirements, non-functional requirements, system constraints, database schemas, API contracts, deployment procedures, and development standards necessary to design, build, test, and maintain the platform.

This document is intended for all parties involved in the software development lifecycle including frontend engineers, backend engineers, database administrators, DevOps engineers, QA testers, project managers, and business stakeholders.

**1.2 Project Overview**

MindBridge is a full-stack web application that serves as a mental health companion and support platform. It connects users experiencing mental health challenges with licensed professionals via real-time chat, provides an AI-powered companion for immediate support when no professional is available, delivers mood-matched therapeutic video content, and facilitates community support groups of like-minded individuals.

The platform operates on a dedicated Virtual Private Server (VPS) hosting all application components including the React frontend, Django REST API backend, MySQL relational database, Redis cache/message broker, and Nginx reverse proxy with SSL termination.

**1.3 Scope**

- A responsive web application accessible via desktop and mobile browsers

- Real-time WebSocket-based chat between users and verified mental health professionals

- AI companion chat powered by the Anthropic Claude API with streaming responses

- Mood-based video content system with YouTube Data API v3 integration and optional local video storage

- Community groups with posts, reactions, comments, and anonymous posting

- Professional discovery and appointment booking system

- User mood journaling with calendar heatmap and mood analytics

- Daily email notification system powered by Celery Beat and SendGrid

- Full admin panel for user management, content moderation, and platform configuration

- Separate professional dashboard for session management and patient tracking

**1.4 Definitions, Acronyms, and Abbreviations**

| **Term / Acronym** | **Definition**                                            |
|--------------------|-----------------------------------------------------------|
| SRS                | Software Requirements Specification                       |
| API                | Application Programming Interface                         |
| REST               | Representational State Transfer                           |
| JWT                | JSON Web Token --- used for stateless authentication      |
| WebSocket          | Full-duplex communication protocol over TCP               |
| SSE                | Server-Sent Events --- one-way server-to-client streaming |
| VPS                | Virtual Private Server --- the self-managed cloud server  |
| ORM                | Object-Relational Mapper (Django\'s built-in ORM)         |
| CRUD               | Create, Read, Update, Delete --- basic data operations    |
| MFA                | Multi-Factor Authentication                               |
| GDPR               | General Data Protection Regulation                        |
| CDN                | Content Delivery Network                                  |
| DXA                | Document Exchange Architecture unit (1440 DXA = 1 inch)   |
| Celery             | Distributed task queue for Python asynchronous jobs       |
| ASGI               | Async Server Gateway Interface (used for WebSockets)      |
| Gunicorn           | Python WSGI HTTP server for serving Django                |
| Daphne             | Django Channels ASGI server for WebSocket support         |
| Redis              | In-memory data store used as cache and message broker     |
| Nginx              | High-performance reverse proxy and static file server     |
| OAuth2             | Open standard for access delegation (Google Sign-in)      |

**1.5 References**

- Django Documentation: https://docs.djangoproject.com/

- Django REST Framework: https://www.django-rest-framework.org/

- Django Channels: https://channels.readthedocs.io/

- React Documentation: https://react.dev/

- Anthropic API Reference: https://docs.anthropic.com/

- YouTube Data API v3: https://developers.google.com/youtube/v3

- SendGrid API: https://docs.sendgrid.com/

- Let\'s Encrypt: https://letsencrypt.org/

**2. System Overview & Architecture**

**2.1 High-Level Architecture**

MindBridge follows a three-tier web application architecture: a React single-page application (SPA) on the presentation tier, a Django REST API plus Django Channels on the application tier, and a MySQL relational database on the data tier. All three tiers run on a single VPS with Nginx as the entry point.

**2.2 Technology Stack Summary**

| **Layer**         | **Technology**           | **Version** | **Purpose**                  |
|-------------------|--------------------------|-------------|------------------------------|
| Frontend          | React                    | 18.x        | SPA user interface           |
| Frontend State    | Redux Toolkit            | 2.x         | Global state management      |
| Frontend Routing  | React Router             | 6.x         | Client-side routing          |
| Frontend HTTP     | Axios                    | 1.x         | REST API calls               |
| Frontend WS       | Native WebSocket API     | ---         | Real-time chat connection    |
| Backend Framework | Django                   | 4.2 LTS     | Core web framework           |
| Backend API       | Django REST Framework    | 3.15        | RESTful API layer            |
| Backend WS        | Django Channels          | 4.x         | WebSocket server             |
| Task Queue        | Celery + Celery Beat     | 5.x         | Async jobs & scheduling      |
| Cache / Broker    | Redis                    | 7.x         | Channels layer & caching     |
| Database          | MySQL                    | 8.0         | Primary relational store     |
| ORM               | Django ORM               | Built-in    | Database abstraction         |
| Auth              | SimpleJWT + OAuth2       | 5.x         | JWT tokens + Google SSO      |
| AI Integration    | Anthropic Python SDK     | Latest      | Claude AI companion          |
| Video API         | YouTube Data API v3      | v3          | Mood-based video search      |
| Email             | SendGrid + Django Email  | ---         | Transactional + bulk email   |
| Web Server        | Nginx                    | 1.24        | Reverse proxy + static files |
| App Server        | Gunicorn + Daphne        | 21.x / 4.x  | WSGI + ASGI serving          |
| Process Mgr       | Supervisor / systemd     | ---         | Service lifecycle            |
| SSL               | Let\'s Encrypt + Certbot | ---         | Free HTTPS certificates      |
| VPS OS            | Ubuntu Server            | 22.04 LTS   | Host operating system        |

**2.3 Component Interaction Flow**

1\. User\'s browser sends HTTPS requests to the VPS on port 443.

2\. Nginx terminates SSL and routes based on path prefix:

- Requests to /api/\* are proxied to Gunicorn (Django REST, port 8000)

- Requests to /ws/\* are proxied to Daphne (Django Channels, port 8001)

- All other requests serve the React static build from /var/www/mindbridge/

3\. Django REST Framework handles authentication (JWT), business logic, and database operations via the ORM.

4\. Django Channels manages WebSocket connections for real-time chat and live notifications, using Redis as the channel layer backend.

5\. Celery workers consume tasks from Redis queues for email sending, AI session summarisation, and scheduled daily notifications (triggered by Celery Beat).

6\. Outbound API calls from Django reach Anthropic (AI), YouTube (videos), and SendGrid (email) over HTTPS.

**2.4 Data Flow Diagram**

The following describes the primary data flows in the system:

| **Flow**            | **Source**     | **Destination** | **Protocol** | **Data**                                          |
|---------------------|----------------|-----------------|--------------|---------------------------------------------------|
| User authentication | React SPA      | Django REST     | HTTPS/REST   | credentials → JWT access + refresh tokens         |
| Dashboard data      | React SPA      | Django REST     | HTTPS/REST   | GET requests → JSON payloads                      |
| Real-time chat      | React SPA      | Django Channels | WebSocket    | chat messages → rooms → recipients                |
| AI companion        | React SPA      | Django REST     | HTTPS/SSE    | user messages → Anthropic API → streamed response |
| Video fetch         | Django REST    | YouTube API v3  | HTTPS/REST   | mood query → video list → cached in Redis         |
| Daily emails        | Celery Beat    | SendGrid API    | HTTPS/REST   | user data → HTML email → user inbox               |
| Community posts     | React SPA      | Django REST     | HTTPS/REST   | post payload → MySQL → notifications to followers |
| Notifications       | Django Signals | React SPA       | WebSocket    | event triggers → Redis → connected clients        |

**3. Stakeholders & User Roles**

**3.1 Stakeholder Summary**

| **Stakeholder**            | **Role in Project**                                      | **Primary Concerns**                                |
|----------------------------|----------------------------------------------------------|-----------------------------------------------------|
| Platform Owner / Admin     | Oversees the platform, manages professionals and content | Safety, compliance, revenue, user growth            |
| Mental Health Professional | Provides therapy/counselling sessions to users via chat  | Patient management, earnings, session quality       |
| Regular User (Patient)     | Seeks mental health support, content, and community      | Privacy, ease of use, immediate access to help      |
| Platform Moderator         | Moderates community content and enforces guidelines      | Reporting workflow, efficiency, accuracy            |
| Development Team           | Builds and maintains the platform                        | Clear specs, technical feasibility, maintainability |
| QA Team                    | Tests features and ensures quality                       | Test coverage, clear acceptance criteria            |

**3.2 User Role Definitions & Permissions**

**3.2.1 Regular User (Patient)**

The primary consumer of the platform. Registered users can access all mental wellness features.

| **Permission**                                 | **Allowed** |
|------------------------------------------------|-------------|
| Register, log in, manage account               | Yes         |
| Complete onboarding and set preferences        | Yes         |
| View dashboard, mood chart, streaks            | Yes         |
| Chat with verified mental health professionals | Yes         |
| Use AI companion (unlimited sessions)          | Yes         |
| Browse and watch mood-based videos             | Yes         |
| Join communities, post, react, comment         | Yes         |
| Post anonymously in communities                | Yes         |
| Book sessions with professionals               | Yes         |
| View own profile, journal, achievements        | Yes         |
| Manage notification preferences                | Yes         |
| Download own data (GDPR)                       | Yes         |
| Access other users\' private data              | No          |
| Access admin or professional features          | No          |

**3.2.2 Mental Health Professional**

A verified, credentialed mental health professional who has been approved by the admin.

| **Permission**                                    | **Allowed** |
|---------------------------------------------------|-------------|
| All Regular User permissions (own account)        | Yes         |
| Appear in professional discovery listings         | Yes         |
| Receive and manage chat sessions from users       | Yes         |
| Set availability calendar and session rates       | Yes         |
| Write private session notes per patient           | Yes         |
| View patient mood trend (consented patients only) | Yes         |
| View professional dashboard with earnings         | Yes         |
| Request payout for completed sessions             | Yes         |
| Upload credentials and intro video                | Yes         |
| Approve or reject session booking requests        | Yes         |
| Access admin panel                                | No          |
| Moderate community content                        | No          |

**3.2.3 Platform Administrator**

Full system access. Responsible for platform health, compliance, and configuration.

| **Permission**                                      | **Allowed** |
|-----------------------------------------------------|-------------|
| All user and professional permissions               | Yes         |
| Access admin panel at /admin                        | Yes         |
| Approve or reject professional sign-up applications | Yes         |
| View, ban, deactivate any user account              | Yes         |
| Delete any post, comment, or message                | Yes         |
| Manage curated video library (add/remove/tag)       | Yes         |
| Send broadcast emails to all users or segments      | Yes         |
| View platform analytics and statistics              | Yes         |
| Configure platform settings and feature flags       | Yes         |
| Export user data as CSV (GDPR compliance)           | Yes         |
| Access moderation report queue                      | Yes         |

**3.2.4 Moderator (Sub-role of Admin)**

Can moderate community content but cannot manage accounts or platform configuration.

**4. Functional Requirements**

This section specifies all functional requirements for the MindBridge platform, organised by feature module. Each requirement is assigned a unique ID in the format FR-\[MODULE\]-\[NUMBER\].

**4.1 Authentication & Onboarding**

**4.1.1 Registration**

| **ID**      | **Requirement**                                                                                                                             | **Priority** |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-AUTH-001 | The system shall allow new users to register with full name, email address, password, and role selection (user or professional).            | Must Have    |
| FR-AUTH-002 | The system shall validate the email address format before allowing registration.                                                            | Must Have    |
| FR-AUTH-003 | The system shall enforce a minimum password strength of 8 characters, at least one uppercase letter, one digit, and one special character.  | Must Have    |
| FR-AUTH-004 | The system shall display a real-time password strength meter during registration.                                                           | Should Have  |
| FR-AUTH-005 | The system shall send a 6-digit OTP verification email upon registration.                                                                   | Must Have    |
| FR-AUTH-006 | The system shall expire the OTP after 15 minutes and provide a resend option with a 60-second cooldown timer.                               | Must Have    |
| FR-AUTH-007 | The system shall allow registration via Google OAuth2 as an alternative to email/password.                                                  | Should Have  |
| FR-AUTH-008 | Professional registrants shall be required to upload credential documents during registration, subject to admin approval before activation. | Must Have    |

**4.1.2 Login & Session Management**

| **ID**      | **Requirement**                                                                                                   | **Priority** |
|-------------|-------------------------------------------------------------------------------------------------------------------|--------------|
| FR-AUTH-010 | The system shall authenticate users using JWT access tokens (15-minute expiry) and refresh tokens (7-day expiry). | Must Have    |
| FR-AUTH-011 | The system shall provide a \'Remember Me\' option extending the refresh token to 30 days.                         | Should Have  |
| FR-AUTH-012 | The system shall lock an account for 15 minutes after 5 consecutive failed login attempts.                        | Must Have    |
| FR-AUTH-013 | The system shall support password reset via email --- user receives a secure link valid for 1 hour.               | Must Have    |
| FR-AUTH-014 | The system shall allow users to view and revoke individual active sessions from the settings page.                | Should Have  |
| FR-AUTH-015 | The system shall support optional two-factor authentication (TOTP) via authenticator app.                         | Could Have   |

**4.1.3 Onboarding Wizard**

| **ID**         | **Requirement**                                                                                                                         | **Priority** |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-ONBOARD-001 | The system shall present a 5-step onboarding wizard to all newly registered users on first login.                                       | Must Have    |
| FR-ONBOARD-002 | Step 1 shall collect: avatar photo (optional), display name, date of birth, and country.                                                | Must Have    |
| FR-ONBOARD-003 | Step 2 shall present a mood picker with 5 options (Anxious, Sad, Calm, Happy, Overwhelmed) as visually distinct cards.                  | Must Have    |
| FR-ONBOARD-004 | Step 3 shall present multi-select wellness goal chips (stress, grief, relationships, self-growth, trauma, addiction, parenting, other). | Must Have    |
| FR-ONBOARD-005 | Step 4 shall allow setting of daily email notification time and toggle for push notifications.                                          | Must Have    |
| FR-ONBOARD-006 | Step 5 shall suggest community groups based on the goals selected in Step 3, allowing one-click joining.                                | Should Have  |
| FR-ONBOARD-007 | Each step shall allow the user to go back or skip, except the email verification step.                                                  | Must Have    |
| FR-ONBOARD-008 | Completing onboarding shall trigger a celebratory confetti animation and redirect to the dashboard.                                     | Should Have  |

**4.2 User Dashboard**

| **ID**      | **Requirement**                                                                                                                                     | **Priority** |
|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-DASH-001 | The dashboard shall display a daily mood check-in prompt at the top on the first visit of each day, presenting 5 animated emoji-style mood buttons. | Must Have    |
| FR-DASH-002 | The system shall store each mood check-in entry with timestamp and optional journal note.                                                           | Must Have    |
| FR-DASH-003 | The dashboard shall display a 7-day line chart of mood scores, with clickable data points linking to the corresponding journal entry.               | Must Have    |
| FR-DASH-004 | The dashboard shall display 4 quick-action cards: Chat with Professional, Talk to AI, Watch Video, Explore Community.                               | Must Have    |
| FR-DASH-005 | The dashboard shall display upcoming booked sessions with mental health professionals.                                                              | Must Have    |
| FR-DASH-006 | The dashboard shall show a preview of the 3 most recent posts from the user\'s joined community groups.                                             | Should Have  |
| FR-DASH-007 | The dashboard shall display one video recommendation automatically matched to today\'s logged mood.                                                 | Should Have  |
| FR-DASH-008 | The dashboard shall display a daily rotating affirmation card with a refresh button for a new affirmation.                                          | Could Have   |
| FR-DASH-009 | The dashboard shall display a consecutive check-in streak counter with a flame icon animation on milestones (7, 30, 100 days).                      | Should Have  |
| FR-DASH-010 | The notification bell in the top navigation shall display an unread badge count, incrementing in real-time via WebSocket.                           | Must Have    |

**4.3 Professional Chat (Real-time)**

| **ID**      | **Requirement**                                                                                                                                              | **Priority** |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-CHAT-001 | The system shall support real-time bidirectional messaging between users and professionals using Django Channels over WebSocket.                             | Must Have    |
| FR-CHAT-002 | The chat interface shall display a conversation list sidebar showing all active conversations with unread message count badges and the last message preview. | Must Have    |
| FR-CHAT-003 | Messages shall display timestamps, delivered tick, and read receipt (double tick turning teal when read).                                                    | Must Have    |
| FR-CHAT-004 | The system shall show a live typing indicator (animated 3-dot bounce) when the other participant is actively typing.                                         | Must Have    |
| FR-CHAT-005 | Users shall be able to send text messages, emoji (via picker), image/file attachments (max 10MB), and audio messages (max 2 minutes).                        | Must Have    |
| FR-CHAT-006 | Users shall be able to react to messages with 5 emotive reactions: Heart, Thumbs Up, Smile, Sad, Prayer.                                                     | Should Have  |
| FR-CHAT-007 | Users shall be able to quote-reply to any message in a conversation.                                                                                         | Should Have  |
| FR-CHAT-008 | Users shall be able to delete their own messages (soft delete --- shows \'Message deleted\' placeholder).                                                    | Must Have    |
| FR-CHAT-009 | Users shall be able to report any message to the moderation team.                                                                                            | Must Have    |
| FR-CHAT-010 | A persistent \'I need urgent help\' crisis button shall be visible in the chat header, triggering an escalation modal with emergency resources.              | Must Have    |
| FR-CHAT-011 | The system shall store all messages in MySQL with encryption at rest.                                                                                        | Must Have    |
| FR-CHAT-012 | Online presence (green dot) for professionals shall be displayed in real-time based on WebSocket connection status.                                          | Must Have    |
| FR-CHAT-013 | The system shall support pagination of message history loading 50 messages at a time with an infinite scroll pattern (load older messages on scroll up).     | Must Have    |

**4.4 AI Companion**

| **ID**    | **Requirement**                                                                                                                                                                                   | **Priority** |
|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-AI-001 | The AI companion shall use the Anthropic Claude API (claude-sonnet model) as its backend.                                                                                                         | Must Have    |
| FR-AI-002 | AI responses shall be streamed token-by-token to the frontend using Server-Sent Events (SSE) for a real-time feel.                                                                                | Must Have    |
| FR-AI-003 | The system shall prepend a mental health-specific system prompt to every AI session, instructing the AI to be compassionate, non-diagnostic, and to recommend professional help when appropriate. | Must Have    |
| FR-AI-004 | The AI companion page shall display 5 suggested prompt starters (e.g., \'I\'m feeling anxious today\', \'I had a difficult conversation\', \'Help me calm down\') when a new session begins.      | Should Have  |
| FR-AI-005 | The system shall maintain full conversation history within a session and pass it in every API call for contextual responses.                                                                      | Must Have    |
| FR-AI-006 | The AI shall detect emotional distress signals and trigger a \'Talk to a Professional\' banner recommendation after detecting 3+ distress indicators.                                             | Should Have  |
| FR-AI-007 | The AI companion interface shall include a \'Start breathing exercise\' button that triggers an animated expanding/contracting circle guide for a 4-7-8 breathing pattern.                        | Should Have  |
| FR-AI-008 | The system shall save an AI-generated session summary to the user\'s mood journal at the end of each session.                                                                                     | Should Have  |
| FR-AI-009 | Users shall be able to regenerate the last AI response and rate responses (thumbs up/down) for quality feedback.                                                                                  | Could Have   |
| FR-AI-010 | The system shall store all AI conversation sessions in MySQL, linked to the user account, searchable by date.                                                                                     | Must Have    |
| FR-AI-011 | If Anthropic API is unavailable, the system shall display a graceful fallback message and suggest switching to professional chat.                                                                 | Must Have    |

**4.5 Mood-Based Video System**

| **ID**       | **Requirement**                                                                                                                                                                | **Priority** |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-VIDEO-001 | The video page shall display a mood filter bar with 5 pill buttons: Calm, Anxiety Relief, Happy Boost, Grief Support, Overwhelm Reset.                                         | Must Have    |
| FR-VIDEO-002 | Selecting a mood filter shall fetch videos matching that mood, sourced from: (a) YouTube Data API v3, and (b) locally curated videos stored in MySQL.                          | Must Have    |
| FR-VIDEO-003 | YouTube API results shall be cached in Redis for 6 hours per mood category to avoid rate limit exhaustion.                                                                     | Must Have    |
| FR-VIDEO-004 | The system shall support local video storage: admins can upload video files to the VPS filesystem, and metadata (title, mood tags, description, file path) is stored in MySQL. | Must Have    |
| FR-VIDEO-005 | Each video card shall display: thumbnail, title, duration, mood tag badge, a save/bookmark button, and a watch progress indicator.                                             | Must Have    |
| FR-VIDEO-006 | Playing a video shall open an inline modal player (YouTube embed or HTML5 video for local files) with fullscreen support.                                                      | Must Have    |
| FR-VIDEO-007 | The system shall track watch completion per user per video and display a green checkmark badge on fully watched videos.                                                        | Should Have  |
| FR-VIDEO-008 | Users shall be able to bookmark/save videos to a personal saved list accessible under a dedicated tab.                                                                         | Must Have    |
| FR-VIDEO-009 | Users shall be able to share a video to a community post with a single click.                                                                                                  | Should Have  |
| FR-VIDEO-010 | The video page shall support infinite scroll, loading 12 videos per batch.                                                                                                     | Should Have  |
| FR-VIDEO-011 | The dashboard shall automatically recommend one video matched to the user\'s most recently logged mood.                                                                        | Should Have  |

**4.6 Community & Groups**

| **ID**      | **Requirement**                                                                                                                                                                                                              | **Priority** |
|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-COMM-001 | The community section shall provide a feed of posts from all groups the user has joined, displayed in reverse chronological order.                                                                                           | Must Have    |
| FR-COMM-002 | The system shall provide predefined community groups including: Anxiety Support, Grief & Loss, Depression, PTSD, Self-Growth, Stress Management, Relationship Issues, Addiction Recovery, Parenting Challenges, Mindfulness. | Must Have    |
| FR-COMM-003 | Users shall be able to join and leave groups at any time. Joined groups appear in the sidebar for quick access.                                                                                                              | Must Have    |
| FR-COMM-004 | Users shall be able to create posts with: text content, image attachment (max 5MB), mood tag, group selection, and anonymous toggle.                                                                                         | Must Have    |
| FR-COMM-005 | Posts shall support 6 emotional reactions: Heart (love), Hug (support), Fist (strength), Lightbulb (helpful), Prayer (solidarity), Sad Face (empathy). Each reaction type is counted separately.                             | Must Have    |
| FR-COMM-006 | Posts shall support threaded comments, nested one level deep (comments and replies). Reactions on comments shall be supported.                                                                                               | Must Have    |
| FR-COMM-007 | Anonymous posting shall hide the user\'s real name and avatar, replacing them with \'Anonymous Member\' and a generic avatar. The real identity is stored in the database for moderation purposes only.                      | Must Have    |
| FR-COMM-008 | Users shall be able to @mention other community members in comments, triggering a notification to the mentioned user.                                                                                                        | Should Have  |
| FR-COMM-009 | Any user shall be able to report a post or comment. Reports create a moderation ticket visible in the admin panel.                                                                                                           | Must Have    |
| FR-COMM-010 | Each group shall have a dedicated group page showing: group banner image, member count, group rules, pinned post, and the group-specific post feed.                                                                          | Must Have    |
| FR-COMM-011 | The system shall support infinite scroll on the community feed loading 10 posts per batch.                                                                                                                                   | Must Have    |
| FR-COMM-012 | Users shall be able to save any community post to their private journal.                                                                                                                                                     | Could Have   |

**4.7 Find a Professional / Booking System**

| **ID**      | **Requirement**                                                                                                                                                                                                                  | **Priority** |
|-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-BOOK-001 | The platform shall maintain a searchable directory of all approved mental health professionals.                                                                                                                                  | Must Have    |
| FR-BOOK-002 | Each professional listing shall display: profile photo, full name, professional title, specialisations (multi-select tags), languages spoken, session rate, star rating (average of reviews), and online availability indicator. | Must Have    |
| FR-BOOK-003 | Users shall be able to filter professionals by: specialisation, language, maximum session price, availability (available today / this week), gender preference, and minimum star rating.                                         | Must Have    |
| FR-BOOK-004 | Clicking a professional card shall open a full profile modal/page showing: full bio, academic credentials, years of experience, all client reviews, an optional intro video, and an availability calendar.                       | Must Have    |
| FR-BOOK-005 | The booking flow shall consist of: (1) Select date from availability calendar, (2) Select time slot, (3) Confirm booking with session description (optional), (4) Receive confirmation notification.                             | Must Have    |
| FR-BOOK-006 | Booked sessions shall appear on the user\'s dashboard under \'Upcoming Sessions\' and in the professional\'s dashboard.                                                                                                          | Must Have    |
| FR-BOOK-007 | The system shall send email reminders to both parties 24 hours and 1 hour before the scheduled session.                                                                                                                          | Must Have    |
| FR-BOOK-008 | Users shall be able to cancel a booking up to 2 hours before the session start time.                                                                                                                                             | Must Have    |
| FR-BOOK-009 | After a session, users shall be prompted to leave a star rating (1--5) and optional text review for the professional.                                                                                                            | Must Have    |
| FR-BOOK-010 | Users shall be able to bookmark/favourite professionals for quick future access.                                                                                                                                                 | Should Have  |

**4.8 User Profile & Mood Journal**

| **ID**      | **Requirement**                                                                                                                                                                                            | **Priority** |
|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-PROF-001 | The profile page shall display: avatar, display name, bio (editable), member since date, current streak, total sessions completed, and total AI sessions.                                                  | Must Have    |
| FR-PROF-002 | The mood journal shall display a calendar heatmap showing mood intensity for every day in the current and previous months.                                                                                 | Must Have    |
| FR-PROF-003 | Clicking a day on the heatmap shall open the journal entry for that day, showing mood score, mood label, and any journal note.                                                                             | Must Have    |
| FR-PROF-004 | Users shall be able to create, edit, and delete journal entries. Each entry has: date, mood score (1--5), mood label, and free-text note (up to 2000 characters).                                          | Must Have    |
| FR-PROF-005 | The profile shall display an achievements/badge wall. Badges are awarded for milestones such as: 7-day streak, first session booked, 30-day streak, community helper (10 helpful reactions received), etc. | Should Have  |
| FR-PROF-006 | The profile shall show a tabbed saved content section: Saved Videos \| Saved Posts.                                                                                                                        | Should Have  |
| FR-PROF-007 | The profile shall include a Goals Tracker section linked to the goals set during onboarding, with the ability to update progress.                                                                          | Could Have   |
| FR-PROF-008 | Users shall be able to request a full data export (GDPR Article 20) from the profile page. The system shall generate a downloadable ZIP containing all their data within 48 hours.                         | Must Have    |

**4.9 Notifications & Email System**

| **ID**       | **Requirement**                                                                                                                                                                                                                                                 | **Priority** |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-NOTIF-001 | The system shall support in-app real-time notifications delivered via WebSocket to connected clients.                                                                                                                                                           | Must Have    |
| FR-NOTIF-002 | The notifications centre shall list all notifications grouped as: Today, This Week, Older.                                                                                                                                                                      | Must Have    |
| FR-NOTIF-003 | The system shall generate notifications for: new chat message, session booking confirmation, session reminder (24h and 1h), community reaction, comment on own post, @mention, new professional reply, daily mood check-in prompt.                              | Must Have    |
| FR-NOTIF-004 | Users shall be able to mark individual notifications or all notifications as read.                                                                                                                                                                              | Must Have    |
| FR-NOTIF-005 | Users shall be able to delete individual notifications.                                                                                                                                                                                                         | Must Have    |
| FR-NOTIF-006 | The system shall send a daily email notification at the user\'s configured time. The email shall include: personalised greeting, today\'s mood check-in prompt, one recommended video matched to yesterday\'s mood, and one community post from a joined group. | Must Have    |
| FR-NOTIF-007 | Daily emails shall be triggered by a Celery Beat scheduled task, respecting each user\'s chosen notification time and timezone.                                                                                                                                 | Must Have    |
| FR-NOTIF-008 | Users shall be able to granularly enable/disable each notification type (in-app and email independently) from the Settings page.                                                                                                                                | Must Have    |
| FR-NOTIF-009 | Transactional emails (OTP, password reset, booking confirmation) shall be sent immediately via SendGrid.                                                                                                                                                        | Must Have    |
| FR-NOTIF-010 | All email templates shall be responsive HTML, rendering correctly on mobile and desktop clients.                                                                                                                                                                | Must Have    |

**4.10 Admin Panel**

| **ID**       | **Requirement**                                                                                                                                                                                                          | **Priority** |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-ADMIN-001 | The admin panel shall be accessible only to users with the Administrator or Moderator role, at the route /admin.                                                                                                         | Must Have    |
| FR-ADMIN-002 | The admin overview dashboard shall display: total registered users, new users today, total professionals, active sessions today, total messages sent, and reported content awaiting review.                              | Must Have    |
| FR-ADMIN-003 | The user management table shall support search by name/email, filter by role, sort by registration date, and bulk actions (ban, deactivate, export).                                                                     | Must Have    |
| FR-ADMIN-004 | The professional approval queue shall display submitted applications with uploaded credential documents. Admins can approve (activates account) or reject with a written reason (sends email notification to applicant). | Must Have    |
| FR-ADMIN-005 | The content moderation queue shall display reported posts/comments with context. Moderators can: dismiss report, delete content, warn user, or ban user.                                                                 | Must Have    |
| FR-ADMIN-006 | The video management section shall allow admins to add curated videos (upload file or paste YouTube URL), assign mood tags, set a featured flag, and remove videos.                                                      | Must Have    |
| FR-ADMIN-007 | The email campaign tool shall allow admins to compose a broadcast email, select recipient segment (all users, users by mood group, professionals only), preview the email, and schedule or send immediately.             | Should Have  |

**4.11 Professional Dashboard**

| **ID**     | **Requirement**                                                                                                                                               | **Priority** |
|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| FR-PRO-001 | The professional dashboard shall display today\'s scheduled sessions in chronological order with a countdown timer for the next session.                      | Must Have    |
| FR-PRO-002 | The professional shall have a patient list showing all users who have booked sessions, with last session date and mood trend (if patient consented to share). | Must Have    |
| FR-PRO-003 | The availability manager shall be a weekly calendar grid where the professional clicks individual time slots to mark them as available or blocked.            | Must Have    |
| FR-PRO-004 | The system shall prevent double-booking by locking a time slot as soon as a booking is confirmed.                                                             | Must Have    |
| FR-PRO-005 | The professional shall be able to create private session notes per patient using a rich text editor. Notes are never visible to the patient.                  | Must Have    |
| FR-PRO-006 | The earnings overview shall display: sessions completed this month, total earnings, pending payout amount, and payout history.                                | Should Have  |
| FR-PRO-007 | The professional profile editor shall allow updating: bio, specialisation tags, languages, session rate, profile photo, and an optional intro video upload.   | Must Have    |
| FR-PRO-008 | The professional dashboard shall receive real-time notifications for: new booking request, session cancellation, new message from patient.                    | Must Have    |

**5. Non-Functional Requirements**

**5.1 Performance**

| **ID**       | **Requirement**                            | **Metric**                                         |
|--------------|--------------------------------------------|----------------------------------------------------|
| NFR-PERF-001 | API response time for all non-AI endpoints | \< 300ms (95th percentile)                         |
| NFR-PERF-002 | Page initial load time (React SPA bundle)  | \< 3 seconds on 4G connection                      |
| NFR-PERF-003 | WebSocket message delivery latency         | \< 100ms                                           |
| NFR-PERF-004 | AI companion first token response time     | \< 1.5 seconds                                     |
| NFR-PERF-005 | Video page load (12 cards with thumbnails) | \< 2 seconds                                       |
| NFR-PERF-006 | Database queries per API request (target)  | \< 5 queries (use select_related/prefetch_related) |
| NFR-PERF-007 | Concurrent WebSocket connections supported | \>= 500 simultaneous connections                   |

**5.2 Scalability**

- The application shall be architected to allow horizontal scaling by adding VPS nodes behind a load balancer without requiring code changes.

- The Redis channel layer shall support clustering for WebSocket scalability.

- MySQL shall be configured with read replicas support ready for future implementation.

- Static assets (React build, images) shall be served via Nginx with gzip compression and cache headers, enabling easy CDN offloading in the future.

**5.3 Availability & Reliability**

| **ID**        | **Requirement**                 | **Target**                                            |
|---------------|---------------------------------|-------------------------------------------------------|
| NFR-AVAIL-001 | Platform uptime SLA             | 99.5% monthly                                         |
| NFR-AVAIL-002 | Scheduled maintenance window    | \< 2 hours/month, announced 48h in advance            |
| NFR-AVAIL-003 | Automated daily database backup | mysqldump to /backups/, 30-day retention              |
| NFR-AVAIL-004 | Service restart on failure      | Managed by Supervisor (auto-restart policy)           |
| NFR-AVAIL-005 | Celery task failure handling    | Automatic retry (max 3 attempts, exponential backoff) |

**5.4 Security**

- All data in transit shall be encrypted via TLS 1.2+ (enforced by Nginx with Let\'s Encrypt certificate).

- Chat messages shall be encrypted at rest in MySQL using AES-256.

- Passwords shall be hashed using Django\'s default PBKDF2 algorithm (100,000 iterations).

- JWT tokens shall use RS256 asymmetric signing with a 2048-bit key pair.

- All API endpoints shall enforce authentication except public endpoints (landing page, professional listings for unauthenticated preview).

- SQL injection shall be prevented by exclusively using Django ORM parameterised queries. Raw SQL is prohibited.

- Cross-Site Scripting (XSS) shall be mitigated by React\'s built-in DOM escaping and Django\'s CSRF middleware.

- Rate limiting shall be applied: 100 requests/minute per authenticated user, 20/minute per IP for unauthenticated endpoints.

- File uploads shall be scanned for MIME type spoofing and limited to allowed types (images: jpg/png/webp, audio: mp3/ogg, documents: pdf).

**5.5 Usability**

- The platform shall comply with WCAG 2.1 Level AA accessibility standards.

- All interactive elements shall have visible focus indicators for keyboard navigation.

- The UI shall be fully responsive and usable on screens from 320px to 2560px wide.

- All error messages shall be written in plain language, not technical codes.

- No animation shall be essential to understanding the UI (all animated interactions shall have non-animated fallbacks).

**5.6 Maintainability**

- All Python code shall follow PEP 8 style guidelines, enforced via flake8.

- All JavaScript/TypeScript code shall follow ESLint Airbnb style guide.

- Code test coverage target: 80% for Django apps, 70% for React components.

- All external API calls shall be abstracted into service classes to allow easy swapping of providers.

- Environment configuration shall use .env files (python-decouple) --- no secrets in version control.

**6. System Architecture & Technology Stack Details**

**6.1 Backend Architecture --- Django**

**6.1.1 Django Project Structure**

The Django project follows a modular app-based structure. Each major feature domain is its own Django app with its own models, serializers, views, URLs, and tests.

| **Django App** | **Responsibility**                                                | **Key Models**                            |
|----------------|-------------------------------------------------------------------|-------------------------------------------|
| core           | Project settings, base models, common utilities, middleware       | TimeStampedModel, SoftDeleteModel         |
| accounts       | User registration, authentication, JWT, OAuth2, 2FA               | User, UserProfile, Session                |
| professionals  | Professional profiles, credentials, approval workflow             | Professional, Credential, Specialisation  |
| chat           | Real-time messaging, conversation management, WebSocket consumers | Conversation, Message, MessageReaction    |
| ai_companion   | Anthropic API integration, session management, summaries          | AISession, AIMessage                      |
| videos         | Video metadata, mood tagging, YouTube API integration, bookmarks  | Video, MoodTag, VideoWatch, VideoBookmark |
| community      | Groups, posts, comments, reactions, anonymous posts, reports      | Group, Post, Comment, Reaction, Report    |
| bookings       | Session scheduling, availability calendar, booking flow           | Availability, Booking, SessionNote        |
| journal        | Mood tracking, journal entries, mood analytics                    | MoodEntry, JournalNote                    |
| notifications  | In-app notifications, email triggers, push events                 | Notification, NotificationPreference      |
| admin_panel    | Platform management views, moderation queue, analytics            | ModerationReport, BroadcastEmail          |

**6.1.2 Middleware Stack (Order Matters)**

1.  SecurityMiddleware --- HTTPS redirect, HSTS headers

2.  SessionMiddleware

3.  CommonMiddleware

4.  CsrfViewMiddleware

5.  AuthenticationMiddleware

6.  RateLimitMiddleware (custom) --- throttle by user/IP

7.  MessageMiddleware

8.  XFrameOptionsMiddleware

**6.2 Frontend Architecture --- React**

**6.2.1 Directory Structure**

The React SPA is structured as follows:

| **Directory / File** | **Purpose**                                                        |
|----------------------|--------------------------------------------------------------------|
| src/api/             | Axios instance, API service modules (authApi.js, chatApi.js, etc.) |
| src/components/      | Reusable UI components (Button, Modal, Card, Avatar, etc.)         |
| src/features/        | Redux Toolkit feature slices (authSlice, chatSlice, etc.)          |
| src/hooks/           | Custom React hooks (useWebSocket, useAuth, useMood, etc.)          |
| src/layouts/         | Page layout wrappers (AuthLayout, DashboardLayout, AdminLayout)    |
| src/pages/           | One folder per route (Dashboard, Chat, Videos, Community, etc.)    |
| src/store/           | Redux store configuration                                          |
| src/utils/           | Helper functions (formatDate, moodToColor, tokenManager, etc.)     |
| src/assets/          | Static images, SVG icons, fonts                                    |
| src/styles/          | Global CSS variables, Tailwind config, component overrides         |
| src/App.jsx          | Root component with router and auth guard                          |
| src/main.jsx         | React DOM entry point                                              |

**6.2.2 State Management Strategy**

Redux Toolkit slices handle server-sourced state (user auth, chat messages, community posts, video lists). React local state (useState) is used for transient UI states (form inputs, modal open/close, hover states). React Query (TanStack Query) is used for server-side data fetching with automatic caching, background refetch, and optimistic updates for community reactions.

**6.3 WebSocket Architecture**

Django Channels handles all WebSocket connections. Each connected client joins one or more channel groups:

| **Channel Group Pattern** | **Subscribers**                     | **Events Sent**                                   |
|---------------------------|-------------------------------------|---------------------------------------------------|
| user\_{user_id}           | Individual user client              | New message, notification, presence update        |
| chat\_{conversation_id}   | Both participants in a conversation | Message, typing indicator, read receipt, reaction |
| community\_{group_id}     | All users with open community page  | New post, new reaction count                      |
| pro\_{professional_id}    | Professional\'s active client       | New booking request, cancellation, message        |

**7. Database Schema & Data Models**

All tables extend a base abstract model providing id (UUID primary key), created_at, updated_at, and is_deleted (soft delete flag). The database is MySQL 8.0 with InnoDB engine and utf8mb4 charset.

**7.1 Core Tables**

**7.1.1 users table**

| **Column**           | **Type**     | **Constraints**  | **Description**                            |
|----------------------|--------------|------------------|--------------------------------------------|
| id                   | CHAR(36)     | PK, NOT NULL     | UUID primary key                           |
| email                | VARCHAR(255) | UNIQUE, NOT NULL | User\'s login email                        |
| password_hash        | VARCHAR(255) | NOT NULL         | PBKDF2 hashed password                     |
| full_name            | VARCHAR(150) | NOT NULL         | Display name                               |
| role                 | ENUM         | NOT NULL         | user \| professional \| admin \| moderator |
| is_active            | BOOLEAN      | DEFAULT TRUE     | Account active state                       |
| is_verified          | BOOLEAN      | DEFAULT FALSE    | Email verified                             |
| avatar_url           | VARCHAR(500) | NULLABLE         | Profile photo path                         |
| date_of_birth        | DATE         | NULLABLE         | For age verification                       |
| country              | CHAR(2)      | NULLABLE         | ISO country code                           |
| timezone             | VARCHAR(50)  | DEFAULT UTC      | User\'s timezone for notifications         |
| notification_time    | TIME         | DEFAULT 08:00    | Daily email send time                      |
| is_anonymous_default | BOOLEAN      | DEFAULT FALSE    | Prefer anonymous posting                   |
| streak_count         | INTEGER      | DEFAULT 0        | Consecutive check-in days                  |
| last_checkin_date    | DATE         | NULLABLE         | Date of last mood check-in                 |
| google_id            | VARCHAR(255) | NULLABLE, UNIQUE | Google OAuth sub identifier                |
| created_at           | DATETIME     | NOT NULL         | Row creation timestamp                     |
| updated_at           | DATETIME     | NOT NULL         | Last update timestamp                      |
| is_deleted           | BOOLEAN      | DEFAULT FALSE    | Soft delete flag                           |

**7.1.2 professionals table**

| **Column**       | **Type**      | **Constraints** | **Description**                 |
|------------------|---------------|-----------------|---------------------------------|
| id               | CHAR(36)      | PK              | UUID                            |
| user_id          | CHAR(36)      | FK → users.id   | Linked user account             |
| title            | VARCHAR(100)  | NOT NULL        | e.g. Licensed Psychologist      |
| bio              | TEXT          | NULLABLE        | Professional biography          |
| years_experience | SMALLINT      | NOT NULL        | Years in practice               |
| session_rate     | DECIMAL(10,2) | NOT NULL        | Cost per session (USD)          |
| languages        | JSON          | NOT NULL        | Array of language codes         |
| specialisations  | JSON          | NOT NULL        | Array of specialisation tag IDs |
| is_approved      | BOOLEAN       | DEFAULT FALSE   | Admin approval status           |
| approval_date    | DATETIME      | NULLABLE        | When admin approved             |
| rejection_reason | TEXT          | NULLABLE        | Reason if rejected              |
| intro_video_url  | VARCHAR(500)  | NULLABLE        | Path to intro video             |
| average_rating   | DECIMAL(3,2)  | DEFAULT 0.00    | Computed average star rating    |
| total_sessions   | INTEGER       | DEFAULT 0       | Completed session count         |
| is_online        | BOOLEAN       | DEFAULT FALSE   | Real-time presence flag         |
| created_at       | DATETIME      | NOT NULL        |                                 |

**7.1.3 conversations & messages tables**

| **Column**                    | **Type**     | **Constraints**            | **Description**                |
|-------------------------------|--------------|----------------------------|--------------------------------|
| conversations.id              | CHAR(36)     | PK                         | Unique conversation            |
| conversations.user_id         | CHAR(36)     | FK → users.id              | Patient participant            |
| conversations.professional_id | CHAR(36)     | FK → professionals.id      | Professional participant       |
| conversations.created_at      | DATETIME     | NOT NULL                   |                                |
| messages.id                   | CHAR(36)     | PK                         | Unique message                 |
| messages.conversation_id      | CHAR(36)     | FK → conversations.id      | Parent conversation            |
| messages.sender_id            | CHAR(36)     | FK → users.id              | Message author                 |
| messages.content              | TEXT         | NULLABLE                   | Message text (encrypted)       |
| messages.message_type         | ENUM         | NOT NULL                   | text \| image \| audio \| file |
| messages.attachment_url       | VARCHAR(500) | NULLABLE                   | File path for attachments      |
| messages.is_deleted           | BOOLEAN      | DEFAULT FALSE              | Soft delete                    |
| messages.delivered_at         | DATETIME     | NULLABLE                   | When delivered to recipient    |
| messages.read_at              | DATETIME     | NULLABLE                   | When marked as read            |
| messages.reply_to_id          | CHAR(36)     | FK → messages.id, NULLABLE | Quoted reply reference         |
| messages.created_at           | DATETIME     | NOT NULL                   |                                |

**7.1.4 ai_sessions & ai_messages tables**

| **Column**                | **Type**    | **Constraints**     | **Description**                        |
|---------------------------|-------------|---------------------|----------------------------------------|
| ai_sessions.id            | CHAR(36)    | PK                  | Unique AI session                      |
| ai_sessions.user_id       | CHAR(36)    | FK → users.id       | Session owner                          |
| ai_sessions.started_at    | DATETIME    | NOT NULL            | Session start time                     |
| ai_sessions.ended_at      | DATETIME    | NULLABLE            | Session end time                       |
| ai_sessions.summary       | TEXT        | NULLABLE            | AI-generated session summary           |
| ai_sessions.mood_detected | VARCHAR(50) | NULLABLE            | AI-detected primary mood               |
| ai_messages.id            | CHAR(36)    | PK                  | Unique message                         |
| ai_messages.session_id    | CHAR(36)    | FK → ai_sessions.id | Parent session                         |
| ai_messages.role          | ENUM        | NOT NULL            | user \| assistant                      |
| ai_messages.content       | TEXT        | NOT NULL            | Message content                        |
| ai_messages.token_count   | INTEGER     | NULLABLE            | Tokens used for this message           |
| ai_messages.rating        | SMALLINT    | NULLABLE            | User rating: 1 (thumbs up) / -1 (down) |
| ai_messages.created_at    | DATETIME    | NOT NULL            |                                        |

**7.1.5 videos & related tables**

| **Column**                  | **Type**     | **Constraints**  | **Description**                        |
|-----------------------------|--------------|------------------|----------------------------------------|
| videos.id                   | CHAR(36)     | PK               |                                        |
| videos.title                | VARCHAR(255) | NOT NULL         | Video title                            |
| videos.description          | TEXT         | NULLABLE         |                                        |
| videos.source               | ENUM         | NOT NULL         | youtube \| local                       |
| videos.youtube_id           | VARCHAR(50)  | NULLABLE, UNIQUE | YouTube video ID                       |
| videos.local_path           | VARCHAR(500) | NULLABLE         | Path for local videos                  |
| videos.thumbnail_url        | VARCHAR(500) | NOT NULL         |                                        |
| videos.duration_seconds     | INTEGER      | NOT NULL         | Video length                           |
| videos.is_featured          | BOOLEAN      | DEFAULT FALSE    | Show on hero section                   |
| videos.is_active            | BOOLEAN      | DEFAULT TRUE     |                                        |
| videos.created_at           | DATETIME     | NOT NULL         |                                        |
| video_mood_tags.video_id    | CHAR(36)     | FK → videos.id   | Many-to-many mood tagging              |
| video_mood_tags.mood        | ENUM         | NOT NULL         | calm\|anxious\|happy\|sad\|overwhelmed |
| video_watches.user_id       | CHAR(36)     | FK → users.id    | Watch tracking per user                |
| video_watches.video_id      | CHAR(36)     | FK → videos.id   |                                        |
| video_watches.watch_percent | TINYINT      | DEFAULT 0        | Completion percentage 0--100           |
| video_bookmarks.user_id     | CHAR(36)     | FK → users.id    | Saved videos per user                  |
| video_bookmarks.video_id    | CHAR(36)     | FK → videos.id   |                                        |

**7.1.6 community tables**

| **Column**                  | **Type**     | **Constraints**            | **Description**                              |
|-----------------------------|--------------|----------------------------|----------------------------------------------|
| groups.id                   | CHAR(36)     | PK                         |                                              |
| groups.name                 | VARCHAR(100) | UNIQUE, NOT NULL           | Group display name                           |
| groups.description          | TEXT         | NOT NULL                   |                                              |
| groups.banner_url           | VARCHAR(500) | NULLABLE                   |                                              |
| groups.rules                | TEXT         | NULLABLE                   | Community rules                              |
| groups.member_count         | INTEGER      | DEFAULT 0                  | Denormalized count                           |
| group_memberships.user_id   | CHAR(36)     | FK → users.id              | Many-to-many                                 |
| group_memberships.group_id  | CHAR(36)     | FK → groups.id             |                                              |
| group_memberships.joined_at | DATETIME     | NOT NULL                   |                                              |
| posts.id                    | CHAR(36)     | PK                         |                                              |
| posts.author_id             | CHAR(36)     | FK → users.id              | Real author always stored                    |
| posts.group_id              | CHAR(36)     | FK → groups.id             |                                              |
| posts.content               | TEXT         | NOT NULL                   | Post body                                    |
| posts.image_url             | VARCHAR(500) | NULLABLE                   |                                              |
| posts.mood_tag              | ENUM         | NULLABLE                   | calm\|anxious\|happy\|sad\|overwhelmed       |
| posts.is_anonymous          | BOOLEAN      | DEFAULT FALSE              | Hide author identity                         |
| posts.is_pinned             | BOOLEAN      | DEFAULT FALSE              | Pinned by moderator                          |
| comments.id                 | CHAR(36)     | PK                         |                                              |
| comments.post_id            | CHAR(36)     | FK → posts.id              |                                              |
| comments.author_id          | CHAR(36)     | FK → users.id              |                                              |
| comments.parent_id          | CHAR(36)     | FK → comments.id, NULLABLE | For nested replies                           |
| comments.content            | TEXT         | NOT NULL                   |                                              |
| reactions.entity_type       | ENUM         | NOT NULL                   | post \| comment \| message                   |
| reactions.entity_id         | CHAR(36)     | NOT NULL                   | ID of reacted entity                         |
| reactions.user_id           | CHAR(36)     | FK → users.id              |                                              |
| reactions.reaction_type     | ENUM         | NOT NULL                   | heart\|hug\|strength\|lightbulb\|prayer\|sad |

**7.1.7 bookings & availability tables**

| **Column**                         | **Type** | **Constraints**            | **Description**                          |
|------------------------------------|----------|----------------------------|------------------------------------------|
| availability_slots.id              | CHAR(36) | PK                         |                                          |
| availability_slots.professional_id | CHAR(36) | FK → professionals.id      |                                          |
| availability_slots.start_time      | DATETIME | NOT NULL                   | Slot start (UTC)                         |
| availability_slots.end_time        | DATETIME | NOT NULL                   | Slot end (UTC)                           |
| availability_slots.is_booked       | BOOLEAN  | DEFAULT FALSE              | Locked when booking confirmed            |
| bookings.id                        | CHAR(36) | PK                         |                                          |
| bookings.user_id                   | CHAR(36) | FK → users.id              |                                          |
| bookings.professional_id           | CHAR(36) | FK → professionals.id      |                                          |
| bookings.slot_id                   | CHAR(36) | FK → availability_slots.id |                                          |
| bookings.status                    | ENUM     | NOT NULL                   | pending\|confirmed\|cancelled\|completed |
| bookings.user_note                 | TEXT     | NULLABLE                   | What user wants to discuss               |
| bookings.cancelled_by              | CHAR(36) | FK → users.id, NULLABLE    | Who cancelled                            |
| bookings.cancelled_at              | DATETIME | NULLABLE                   |                                          |
| session_notes.id                   | CHAR(36) | PK                         |                                          |
| session_notes.booking_id           | CHAR(36) | FK → bookings.id           |                                          |
| session_notes.professional_id      | CHAR(36) | FK → professionals.id      |                                          |
| session_notes.content              | LONGTEXT | NOT NULL                   | Rich text notes (never shown to user)    |

**7.1.8 mood_entries & notifications tables**

| **Column**                 | **Type**     | **Constraints**   | **Description**                               |
|----------------------------|--------------|-------------------|-----------------------------------------------|
| mood_entries.id            | CHAR(36)     | PK                |                                               |
| mood_entries.user_id       | CHAR(36)     | FK → users.id     |                                               |
| mood_entries.mood_score    | TINYINT      | NOT NULL (1--5)   | 1=very bad, 5=very good                       |
| mood_entries.mood_label    | ENUM         | NOT NULL          | anxious\|sad\|calm\|happy\|overwhelmed        |
| mood_entries.journal_note  | TEXT         | NULLABLE          | Free text journal entry                       |
| mood_entries.entry_date    | DATE         | NOT NULL          |                                               |
| mood_entries.source        | ENUM         | DEFAULT dashboard | dashboard\|ai_session\|onboarding             |
| notifications.id           | CHAR(36)     | PK                |                                               |
| notifications.recipient_id | CHAR(36)     | FK → users.id     |                                               |
| notifications.type         | VARCHAR(50)  | NOT NULL          | message\|booking\|reaction\|mention\|reminder |
| notifications.title        | VARCHAR(255) | NOT NULL          | Short notification text                       |
| notifications.body         | TEXT         | NULLABLE          | Extended description                          |
| notifications.link         | VARCHAR(500) | NULLABLE          | Deep link URL                                 |
| notifications.is_read      | BOOLEAN      | DEFAULT FALSE     |                                               |
| notifications.created_at   | DATETIME     | NOT NULL          |                                               |

**8. API Specification**

All REST API endpoints are prefixed with /api/v1/. Authentication is enforced via JWT Bearer tokens in the Authorization header except where noted. All responses are JSON. HTTP status codes follow REST conventions.

**8.1 Authentication Endpoints**

| **Method** | **Endpoint**                  | **Auth Required** | **Description**                                             |
|------------|-------------------------------|-------------------|-------------------------------------------------------------|
| POST       | /auth/register/               | No                | Register new user. Body: {full_name, email, password, role} |
| POST       | /auth/login/                  | No                | Returns access + refresh JWT. Body: {email, password}       |
| POST       | /auth/token/refresh/          | No                | Refresh access token. Body: {refresh}                       |
| POST       | /auth/logout/                 | Yes               | Blacklist refresh token                                     |
| POST       | /auth/verify-email/           | No                | Verify OTP code. Body: {email, otp}                         |
| POST       | /auth/resend-otp/             | No                | Resend OTP. Body: {email}                                   |
| POST       | /auth/password-reset/request/ | No                | Send reset link. Body: {email}                              |
| POST       | /auth/password-reset/confirm/ | No                | Set new password. Body: {token, new_password}               |
| GET        | /auth/google/                 | No                | Redirect to Google OAuth2 consent screen                    |
| GET        | /auth/google/callback/        | No                | Google OAuth callback, returns JWT                          |

**8.2 User & Profile Endpoints**

| **Method** | **Endpoint**            | **Auth** | **Description**                              |
|------------|-------------------------|----------|----------------------------------------------|
| GET        | /users/me/              | Yes      | Get current user\'s full profile             |
| PATCH      | /users/me/              | Yes      | Update profile fields (partial update)       |
| POST       | /users/me/avatar/       | Yes      | Upload new avatar image                      |
| GET        | /users/me/mood-history/ | Yes      | Get mood entries (query param: days=7/30/90) |
| POST       | /users/me/mood/         | Yes      | Create mood check-in entry                   |
| GET        | /users/me/journal/      | Yes      | List journal entries                         |
| POST       | /users/me/journal/      | Yes      | Create journal entry                         |
| PATCH      | /users/me/journal/{id}/ | Yes      | Update journal entry                         |
| DELETE     | /users/me/journal/{id}/ | Yes      | Delete journal entry                         |
| GET        | /users/me/achievements/ | Yes      | List earned badges                           |
| GET        | /users/me/saved-videos/ | Yes      | List bookmarked videos                       |
| GET        | /users/me/saved-posts/  | Yes      | List saved community posts                   |
| POST       | /users/me/data-export/  | Yes      | Request GDPR data export (async)             |

**8.3 Chat Endpoints**

| **Method** | **Endpoint**                       | **Auth** | **Description**                                                  |
|------------|------------------------------------|----------|------------------------------------------------------------------|
| GET        | /chat/conversations/               | Yes      | List user\'s conversations with last message                     |
| POST       | /chat/conversations/               | Yes      | Start a new conversation. Body: {professional_id}                |
| GET        | /chat/conversations/{id}/messages/ | Yes      | Paginated message history (page_size=50)                         |
| POST       | /chat/conversations/{id}/messages/ | Yes      | Send message (REST fallback). Body: {content, type, reply_to_id} |
| PATCH      | /chat/messages/{id}/               | Yes      | Edit message content                                             |
| DELETE     | /chat/messages/{id}/               | Yes      | Soft-delete a message                                            |
| POST       | /chat/messages/{id}/react/         | Yes      | Add reaction. Body: {reaction_type}                              |
| DELETE     | /chat/messages/{id}/react/         | Yes      | Remove user\'s reaction from message                             |
| POST       | /chat/messages/{id}/report/        | Yes      | Report message to moderation                                     |

**8.4 AI Companion Endpoints**

| **Method** | **Endpoint**                | **Auth** | **Description**                                                  |
|------------|-----------------------------|----------|------------------------------------------------------------------|
| POST       | /ai/sessions/               | Yes      | Start a new AI session. Returns session ID.                      |
| GET        | /ai/sessions/               | Yes      | List past sessions (paginated, newest first)                     |
| GET        | /ai/sessions/{id}/messages/ | Yes      | Get messages in a specific session                               |
| POST       | /ai/sessions/{id}/chat/     | Yes      | Send message; returns SSE stream of AI response. Body: {message} |
| POST       | /ai/sessions/{id}/end/      | Yes      | End session; triggers summary generation async                   |
| PATCH      | /ai/messages/{id}/rate/     | Yes      | Rate AI message. Body: {rating: 1 or -1}                         |

**8.5 Video Endpoints**

| **Method** | **Endpoint**           | **Auth** | **Description**                                       |
|------------|------------------------|----------|-------------------------------------------------------|
| GET        | /videos/               | Yes      | List videos. Query params: mood, source, page, search |
| GET        | /videos/{id}/          | Yes      | Get single video details                              |
| POST       | /videos/{id}/watch/    | Yes      | Update watch progress. Body: {percent_watched}        |
| POST       | /videos/{id}/bookmark/ | Yes      | Bookmark a video                                      |
| DELETE     | /videos/{id}/bookmark/ | Yes      | Remove bookmark                                       |
| GET        | /videos/recommended/   | Yes      | Get 1 video matched to latest mood                    |
| POST       | /admin/videos/         | Admin    | Add a new curated video                               |
| PATCH      | /admin/videos/{id}/    | Admin    | Update video metadata / mood tags                     |
| DELETE     | /admin/videos/{id}/    | Admin    | Remove video from platform                            |

**8.6 Community Endpoints**

| **Method** | **Endpoint**                    | **Auth** | **Description**                                                             |
|------------|---------------------------------|----------|-----------------------------------------------------------------------------|
| GET        | /community/feed/                | Yes      | Paginated feed of posts from joined groups                                  |
| GET        | /community/groups/              | Yes      | List all available groups                                                   |
| POST       | /community/groups/{id}/join/    | Yes      | Join a group                                                                |
| DELETE     | /community/groups/{id}/leave/   | Yes      | Leave a group                                                               |
| GET        | /community/groups/{id}/posts/   | Yes      | Posts in a specific group                                                   |
| POST       | /community/posts/               | Yes      | Create a new post. Body: {content, group_id, image, mood_tag, is_anonymous} |
| PATCH      | /community/posts/{id}/          | Yes      | Edit own post                                                               |
| DELETE     | /community/posts/{id}/          | Yes      | Delete own post (or admin)                                                  |
| POST       | /community/posts/{id}/react/    | Yes      | Add/change reaction. Body: {reaction_type}                                  |
| DELETE     | /community/posts/{id}/react/    | Yes      | Remove own reaction                                                         |
| GET        | /community/posts/{id}/comments/ | Yes      | Get comments (nested)                                                       |
| POST       | /community/posts/{id}/comments/ | Yes      | Create comment. Body: {content, parent_id?}                                 |
| POST       | /community/posts/{id}/report/   | Yes      | Report post to moderation                                                   |
| POST       | /community/posts/{id}/save/     | Yes      | Save post to private journal                                                |

**8.7 Booking Endpoints**

| **Method** | **Endpoint**                                   | **Auth** | **Description**                                             |
|------------|------------------------------------------------|----------|-------------------------------------------------------------|
| GET        | /professionals/                                | Optional | Browse professional directory (filter params)               |
| GET        | /professionals/{id}/                           | Optional | Professional profile + reviews                              |
| GET        | /professionals/{id}/availability/              | Yes      | Available slots (query: from_date, to_date)                 |
| POST       | /bookings/                                     | Yes      | Create booking. Body: {professional_id, slot_id, user_note} |
| GET        | /bookings/                                     | Yes      | List user\'s bookings                                       |
| PATCH      | /bookings/{id}/cancel/                         | Yes      | Cancel booking (up to 2h before)                            |
| POST       | /bookings/{id}/review/                         | Yes      | Submit review. Body: {rating, comment}                      |
| POST       | /professionals/me/availability/                | Pro      | Professional sets availability slots                        |
| DELETE     | /professionals/me/availability/{slot_id}/      | Pro      | Remove availability slot                                    |
| GET        | /professionals/me/bookings/                    | Pro      | List professional\'s bookings                               |
| POST       | /professionals/me/sessions/{booking_id}/notes/ | Pro      | Create session note                                         |

**8.8 Notification Endpoints**

| **Method** | **Endpoint**                  | **Auth** | **Description**                             |
|------------|-------------------------------|----------|---------------------------------------------|
| GET        | /notifications/               | Yes      | List all notifications (paginated, grouped) |
| PATCH      | /notifications/{id}/read/     | Yes      | Mark single notification as read            |
| POST       | /notifications/mark-all-read/ | Yes      | Mark all notifications as read              |
| DELETE     | /notifications/{id}/          | Yes      | Delete a notification                       |
| GET        | /notifications/preferences/   | Yes      | Get notification preference settings        |
| PUT        | /notifications/preferences/   | Yes      | Update notification preferences             |

**8.9 WebSocket Endpoints**

| **URL Pattern**                       | **Consumer Class**   | **Auth** | **Events Handled**                        |
|---------------------------------------|----------------------|----------|-------------------------------------------|
| ws://\.../ws/chat/{conversation_id}/  | ChatConsumer         | JWT      | send_message, typing, read_receipt, react |
| ws://\.../ws/notifications/{user_id}/ | NotificationConsumer | JWT      | new_notification, mark_read               |
| ws://\.../ws/presence/                | PresenceConsumer     | JWT      | user_online, user_offline                 |

**9. Frontend Architecture**

**9.1 Routing Structure**

| **Route**                      | **Component**           | **Auth Guard**          | **Layout**       |
|--------------------------------|-------------------------|-------------------------|------------------|
| /                              | LandingPage             | No                      | PublicLayout     |
| /register                      | RegisterPage            | No (redirect if authed) | AuthLayout       |
| /login                         | LoginPage               | No (redirect if authed) | AuthLayout       |
| /verify-email                  | VerifyEmailPage         | No                      | AuthLayout       |
| /forgot-password               | ForgotPasswordPage      | No                      | AuthLayout       |
| /onboarding                    | OnboardingWizard        | Yes (unverified ok)     | OnboardingLayout |
| /dashboard                     | DashboardPage           | Yes                     | DashboardLayout  |
| /chat                          | ChatPage                | Yes                     | DashboardLayout  |
| /chat/:conversationId          | ChatConversationPage    | Yes                     | DashboardLayout  |
| /ai-companion                  | AICompanionPage         | Yes                     | DashboardLayout  |
| /ai-companion/:sessionId       | AISessionPage           | Yes                     | DashboardLayout  |
| /videos                        | VideosPage              | Yes                     | DashboardLayout  |
| /community                     | CommunityFeedPage       | Yes                     | DashboardLayout  |
| /community/groups/:groupId     | GroupPage               | Yes                     | DashboardLayout  |
| /professionals                 | ProfessionalsPage       | Yes                     | DashboardLayout  |
| /professionals/:professionalId | ProfessionalProfilePage | Yes                     | DashboardLayout  |
| /profile                       | ProfilePage             | Yes                     | DashboardLayout  |
| /profile/:userId               | PublicProfilePage       | Yes                     | DashboardLayout  |
| /notifications                 | NotificationsPage       | Yes                     | DashboardLayout  |
| /settings                      | SettingsPage            | Yes                     | DashboardLayout  |
| /admin                         | AdminDashboard          | Admin only              | AdminLayout      |
| /admin/users                   | AdminUsersPage          | Admin only              | AdminLayout      |
| /admin/professionals           | AdminProfessionalsPage  | Admin only              | AdminLayout      |
| /admin/moderation              | AdminModerationPage     | Admin only              | AdminLayout      |
| /admin/videos                  | AdminVideosPage         | Admin only              | AdminLayout      |
| /pro/dashboard                 | ProDashboardPage        | Pro only                | ProLayout        |
| /pro/availability              | ProAvailabilityPage     | Pro only                | ProLayout        |
| /pro/patients                  | ProPatientsPage         | Pro only                | ProLayout        |
| \*                             | NotFoundPage            | No                      | MinimalLayout    |

**9.2 Key Reusable Components**

| **Component**          | **Props / Description**                                                       |
|------------------------|-------------------------------------------------------------------------------|
| \<Button\>             | variant (primary\|secondary\|danger\|ghost), size, loading, disabled, onClick |
| \<Modal\>              | isOpen, onClose, title, size (sm\|md\|lg\|full), children                     |
| \<Avatar\>             | src, name (for initials fallback), size, showOnline (boolean)                 |
| \<MoodPicker\>         | value, onChange, layout (grid\|row), showLabels                               |
| \<VideoCard\>          | video object, onPlay, onBookmark, showProgress                                |
| \<ChatBubble\>         | message object, isSelf, onReact, onReply, onDelete                            |
| \<TypingIndicator\>    | isVisible --- animated 3-dot component                                        |
| \<ReactionPicker\>     | onSelect, reactions array, currentReaction                                    |
| \<ProfessionalCard\>   | professional object, onMessage, onBook, onFavourite                           |
| \<MoodChart\>          | entries array, days (7\|30\|90), onDataPointClick                             |
| \<MoodHeatmap\>        | entries array, year, month, onDayClick                                        |
| \<BreathingCircle\>    | active (boolean), pattern (4-7-8 \| box \| 4-4-4)                             |
| \<NotificationBell\>   | count, onOpen --- badge with pulse animation                                  |
| \<CrisisButton\>       | Persistent floating button visible in chat                                    |
| \<LoadingSpinner\>     | size, color, fullPage (boolean)                                               |
| \<ToastContainer\>     | Global toasts via toast() utility (success/error/info)                        |
| \<InfiniteScrollList\> | fetchFn, renderItem, pageSize --- generic scroll loader                       |
| \<StreamingText\>      | stream (SSE EventSource), onComplete --- renders AI tokens                    |

**9.3 Custom Hooks**

| **Hook**                      | **Returns / Purpose**                                        |
|-------------------------------|--------------------------------------------------------------|
| useAuth()                     | { user, isAuthenticated, login, logout, refreshToken }       |
| useWebSocket(url)             | { lastMessage, sendMessage, readyState, reconnect }          |
| useChat(conversationId)       | { messages, sendMessage, markRead, isTyping, setTyping }     |
| useNotifications()            | { notifications, unreadCount, markRead, deleteNotification } |
| useMoodHistory(days)          | { entries, chart data, isLoading }                           |
| useVideoSearch(mood, page)    | { videos, hasMore, isLoading, loadMore }                     |
| useProfessionals(filters)     | { professionals, total, isLoading, applyFilters }            |
| useStreamingAI(sessionId)     | { sendMessage, streamContent, isStreaming, stopStream }      |
| useBreathingExercise(pattern) | { phase, count, isActive, start, stop }                      |

**10. Security Requirements**

**10.1 Authentication Security**

| **Security Control**   | **Implementation**                                                                            |
|------------------------|-----------------------------------------------------------------------------------------------|
| JWT Token Signing      | RS256 with 2048-bit RSA key pair. Private key stored as environment variable.                 |
| Access Token Lifetime  | 15 minutes. Short window limits damage from token theft.                                      |
| Refresh Token Rotation | Each use of refresh token issues a new refresh token and revokes the old one.                 |
| Password Hashing       | Django PBKDF2-SHA256 with 100,000 iterations + per-user salt.                                 |
| Account Lockout        | 5 failed logins → 15-minute lockout. Tracked in Redis by email+IP.                            |
| OTP Security           | 6-digit OTP, BCrypt-hashed in DB, 15-minute TTL, single-use, rate-limited to 3 requests/hour. |
| Session Revocation     | Refresh token blacklist table in MySQL; checked on every token refresh.                       |

**10.2 API Security**

| **Security Control**     | **Implementation**                                                                                         |
|--------------------------|------------------------------------------------------------------------------------------------------------|
| Rate Limiting            | django-ratelimit: 100 req/min authenticated, 20 req/min unauthenticated (by IP)                            |
| CORS                     | django-cors-headers: only whitelist frontend origin. Credentials allowed only for own origin.              |
| CSRF Protection          | Django CSRF middleware enabled for session-authenticated views. JWT endpoints are exempt.                  |
| Input Validation         | DRF serializers validate all input. Custom validators for file types and sizes.                            |
| SQL Injection Prevention | Exclusively Django ORM. Raw SQL queries are banned by code review policy.                                  |
| XSS Prevention           | React escapes all rendered content. DRF outputs JSON (not HTML). Strict CSP headers via Nginx.             |
| File Upload Security     | MIME type validation (python-magic), extension whitelist, antivirus scan (ClamAV), stored outside web root |
| WebSocket Auth           | JWT token passed as query parameter on WebSocket handshake, validated in Channel middleware.               |

**10.3 Data Privacy (GDPR Compliance)**

- Users can request full data export (Article 20) --- delivered as ZIP within 48 hours.

- Users can request account deletion (Article 17) --- anonymises PII within 30 days.

- Anonymous community posts store real identity in DB for moderation but never expose it to other users.

- AI session transcripts are never shared with professionals without explicit user consent.

- Consent collection is explicit at registration --- separate checkboxes for terms, privacy policy, and marketing emails.

- Third-party integrations (Google, YouTube, Anthropic, SendGrid) are listed in the privacy policy.

**10.4 Infrastructure Security**

- VPS firewall (ufw): allow only 22 (SSH), 80 (HTTP), 443 (HTTPS). All other ports blocked.

- SSH access requires public key authentication. Password login disabled.

- Fail2ban monitors SSH login attempts and auto-bans IPs after 5 failures.

- MySQL binds to 127.0.0.1 only --- not accessible from external network.

- Redis binds to 127.0.0.1 only, requires password authentication.

- All environment secrets in /etc/mindbridge/.env (chmod 600, owned by app user).

- Daily automated security patches via unattended-upgrades (security-only updates).

**11. Deployment & Infrastructure**

**11.1 VPS Specifications (Minimum)**

|                       |                                                          |
|-----------------------|----------------------------------------------------------|
| CPU                   | 4 vCPU                                                   |
| RAM                   | 8 GB                                                     |
| Storage               | 100 GB SSD                                               |
| OS                    | Ubuntu Server 22.04 LTS                                  |
| Bandwidth             | Unmetered or \>= 1TB/month                               |
| Recommended Providers | Hetzner CX31, DigitalOcean Droplet (4GB+), Contabo VPS M |
| Backup                | Daily automated snapshot + mysqldump                     |

**11.2 Server Directory Layout**

| **Directory**                         | **Contents**                                             |
|---------------------------------------|----------------------------------------------------------|
| /var/www/mindbridge/                  | React production build (served by Nginx)                 |
| /home/mindbridge/app/                 | Django project root (Python virtual environment inside)  |
| /home/mindbridge/app/media/           | User-uploaded files (avatars, attachments, local videos) |
| /home/mindbridge/app/logs/            | Application logs (django.log, celery.log, error.log)     |
| /etc/nginx/sites-available/mindbridge | Nginx virtual host configuration                         |
| /etc/supervisor/conf.d/               | Supervisor configs for gunicorn, daphne, celery          |
| /backups/mysql/                       | Daily mysqldump files (30-day retention)                 |
| /etc/mindbridge/.env                  | Environment variables (secrets, API keys)                |
| /etc/letsencrypt/live/domain/         | SSL certificate and private key (managed by Certbot)     |

**11.3 Nginx Configuration Overview**

The Nginx configuration handles three concerns: SSL termination, routing to Django/React, and serving static/media files with caching headers.

| **Location Block** | **Action**                                                               |
|--------------------|--------------------------------------------------------------------------|
| / (default)        | Serve /var/www/mindbridge/index.html with try_files (SPA fallback)       |
| /static/           | Serve /var/www/mindbridge/static/ with 1-year Cache-Control immutable    |
| /media/            | Serve /home/mindbridge/app/media/ --- avatar images, attachments         |
| /api/              | proxy_pass http://127.0.0.1:8000 (Gunicorn Django)                       |
| /ws/               | proxy_pass http://127.0.0.1:8001 with upgrade headers (Daphne WebSocket) |

**11.4 Process Management (Supervisor)**

| **Process**   | **Command**                                                                                       | **Instances**      |
|---------------|---------------------------------------------------------------------------------------------------|--------------------|
| gunicorn      | gunicorn mindbridge.asgi:application -w 4 -k uvicorn.workers.UvicornWorker \--bind 127.0.0.1:8000 | 1 (4 workers)      |
| daphne        | daphne -b 127.0.0.1 -p 8001 mindbridge.asgi:application                                           | 1                  |
| celery-worker | celery -A mindbridge worker -l info -Q default,emails,ai                                          | 1 (autoscale 2--8) |
| celery-beat   | celery -A mindbridge beat -l info \--scheduler django_celery_beat.schedulers:DatabaseScheduler    | 1                  |

**11.5 CI/CD Deployment Process**

9.  Developer pushes to main branch on GitHub.

10. GitHub Actions workflow triggers: lint (flake8, ESLint), unit tests (pytest, Jest), build React.

11. On green: SSH into VPS, git pull, pip install -r requirements.txt, npm install && npm run build.

12. Run Django migrations: python manage.py migrate.

13. Collect static files: python manage.py collectstatic \--noinput.

14. Copy React build to /var/www/mindbridge/: cp -r build/\* /var/www/mindbridge/

15. Reload Gunicorn: supervisorctl restart gunicorn.

16. Reload Celery: supervisorctl restart celery-worker celery-beat.

17. Nginx reload: nginx -s reload.

18. Health check: curl https://yourdomain.com/api/v1/health/ --- expected 200 OK.

**12. Project File Structure**

The following represents the complete file and directory structure for the MindBridge project, covering both the Django backend and the React frontend.

**12.1 Backend (Django) --- Full File Structure**

| **Path**                           | **Purpose**                                               |
|------------------------------------|-----------------------------------------------------------|
| mindbridge/                        | Django project root                                       |
| mindbridge/settings/               | Settings split by environment                             |
| mindbridge/settings/base.py        | Common settings (installed apps, middleware, ORM)         |
| mindbridge/settings/development.py | Dev overrides (DEBUG=True, console email backend)         |
| mindbridge/settings/production.py  | Production settings (ALLOWED_HOSTS, SSL, logging)         |
| mindbridge/settings/testing.py     | Test settings (in-memory DB, mocked services)             |
| mindbridge/urls.py                 | Root URL config --- includes all app URL files            |
| mindbridge/asgi.py                 | ASGI entry point (HTTP + WebSocket routing)               |
| mindbridge/wsgi.py                 | WSGI entry point (HTTP only --- used by Gunicorn)         |
| mindbridge/celery.py               | Celery app configuration and task autodiscovery           |
| apps/accounts/models.py            | User, UserProfile models                                  |
| apps/accounts/serializers.py       | RegisterSerializer, LoginSerializer, ProfileSerializer    |
| apps/accounts/views.py             | Auth views (register, login, verify, reset, OAuth)        |
| apps/accounts/urls.py              | URL patterns for /api/v1/auth/                            |
| apps/accounts/services.py          | Business logic: create_user(), send_otp(), verify_token() |
| apps/accounts/tasks.py             | Celery tasks: send_verification_email()                   |
| apps/accounts/tests/test_models.py | Unit tests for User model                                 |
| apps/accounts/tests/test_views.py  | Integration tests for auth endpoints                      |
| apps/chat/models.py                | Conversation, Message, MessageReaction                    |
| apps/chat/consumers.py             | ChatConsumer (Django Channels WebSocket handler)          |
| apps/chat/serializers.py           | MessageSerializer, ConversationSerializer                 |
| apps/chat/views.py                 | REST views for conversation/message history               |
| apps/chat/routing.py               | WebSocket URL routing for chat consumers                  |
| apps/chat/tests/test_consumers.py  | WebSocket consumer tests                                  |
| apps/ai_companion/models.py        | AISession, AIMessage                                      |
| apps/ai_companion/services.py      | AnthropicService --- wraps API calls, streaming logic     |
| apps/ai_companion/views.py         | Chat endpoint with SSE streaming response                 |
| apps/ai_companion/tasks.py         | generate_session_summary() Celery task                    |
| apps/videos/models.py              | Video, MoodTag, VideoWatch, VideoBookmark                 |
| apps/videos/services.py            | YouTubeService --- API calls with Redis caching           |
| apps/videos/views.py               | Video list, bookmark, watch progress endpoints            |
| apps/community/models.py           | Group, Post, Comment, Reaction, Report                    |
| apps/community/views.py            | Feed, group, post, comment, reaction endpoints            |
| apps/community/signals.py          | Django signals: post_save → create notifications          |
| apps/bookings/models.py            | AvailabilitySlot, Booking, SessionNote, Review            |
| apps/bookings/views.py             | Booking CRUD, availability management                     |
| apps/bookings/tasks.py             | send_session_reminder() --- scheduled via Celery Beat     |
| apps/notifications/models.py       | Notification, NotificationPreference                      |
| apps/notifications/consumers.py    | NotificationConsumer, PresenceConsumer                    |
| apps/notifications/tasks.py        | send_daily_digest() --- Celery Beat scheduled task        |
| apps/professionals/models.py       | Professional, Credential, Specialisation                  |
| apps/professionals/views.py        | Directory listing, profile detail, approval flow          |
| apps/journal/models.py             | MoodEntry, JournalNote, Achievement, UserBadge            |
| apps/admin_panel/views.py          | Admin-only views for management and moderation            |
| requirements/base.txt              | Core dependencies (Django, DRF, Channels, etc.)           |
| requirements/production.txt        | Production-only: gunicorn, sentry-sdk, etc.               |
| requirements/development.txt       | Dev tools: django-debug-toolbar, factory-boy, etc.        |
| requirements/testing.txt           | Test: pytest-django, coverage, responses, etc.            |
| .env.example                       | Template for environment variables (no real values)       |
| pytest.ini                         | pytest configuration: test paths, coverage settings       |
| Makefile                           | Developer shortcuts: make run, make test, make migrate    |
| Dockerfile                         | Optional Docker container config for local dev            |
| docker-compose.yml                 | Local dev: Django + MySQL + Redis containers              |

**12.2 Frontend (React) --- Full File Structure**

| **Path**                                         | **Purpose**                                           |
|--------------------------------------------------|-------------------------------------------------------|
| mindbridge-frontend/                             | React project root                                    |
| public/index.html                                | HTML shell --- React mounts here                      |
| public/manifest.json                             | PWA manifest for mobile install                       |
| public/icons/                                    | App icons (192x192, 512x512)                          |
| src/main.jsx                                     | Entry point --- ReactDOM.createRoot, Redux Provider   |
| src/App.jsx                                      | Root router --- all \<Route\> definitions + AuthGuard |
| src/api/axiosInstance.js                         | Axios with JWT interceptor (auto-refresh on 401)      |
| src/api/authApi.js                               | Auth service: login(), register(), refresh()          |
| src/api/chatApi.js                               | Chat REST: getConversations(), getMessages(), etc.    |
| src/api/videosApi.js                             | Video fetch, bookmark, watch progress                 |
| src/api/communityApi.js                          | Posts, comments, reactions, groups                    |
| src/api/bookingsApi.js                           | Professional list, booking CRUD, availability         |
| src/api/aiApi.js                                 | AI session management, SSE streaming helper           |
| src/api/notificationsApi.js                      | Notification list, preferences, mark read             |
| src/store/index.js                               | Redux store with RTK slices combined                  |
| src/features/auth/authSlice.js                   | Redux slice: user, tokens, isAuthenticated            |
| src/features/chat/chatSlice.js                   | conversations\[\], activeConversation, messages{}     |
| src/features/notifications/notifSlice.js         | notifications\[\], unreadCount                        |
| src/hooks/useAuth.js                             | Auth state + actions hook                             |
| src/hooks/useWebSocket.js                        | WebSocket connection + message handler                |
| src/hooks/useChat.js                             | Full chat state for one conversation                  |
| src/hooks/useStreamingAI.js                      | SSE streaming hook for AI companion                   |
| src/hooks/useBreathingExercise.js                | Breathing phase timer state machine                   |
| src/hooks/useMoodHistory.js                      | Fetch + format mood data for chart/heatmap            |
| src/layouts/DashboardLayout.jsx                  | Sidebar + topbar wrapper for authed pages             |
| src/layouts/AuthLayout.jsx                       | Centred card layout for login/register                |
| src/layouts/AdminLayout.jsx                      | Admin sidebar + admin topbar                          |
| src/components/ui/Button.jsx                     | Core button --- variants, loading state               |
| src/components/ui/Modal.jsx                      | Overlay modal with focus trap                         |
| src/components/ui/Avatar.jsx                     | Photo or initials circle with online dot              |
| src/components/ui/Toast.jsx                      | Toast notification (success/error/info)               |
| src/components/ui/LoadingSpinner.jsx             | Animated spinner                                      |
| src/components/ui/InfiniteScrollList.jsx         | Generic infinite scroll wrapper                       |
| src/components/chat/ChatBubble.jsx               | Individual message bubble                             |
| src/components/chat/TypingIndicator.jsx          | 3-dot typing animation                                |
| src/components/chat/ReactionPicker.jsx           | Hover reaction bar                                    |
| src/components/chat/CrisisButton.jsx             | Persistent crisis help button                         |
| src/components/video/VideoCard.jsx               | Video thumbnail card                                  |
| src/components/video/VideoPlayer.jsx             | Modal video player (YouTube + local)                  |
| src/components/community/PostCard.jsx            | Community post with reactions                         |
| src/components/community/CommentThread.jsx       | Nested comments                                       |
| src/components/mood/MoodPicker.jsx               | 5-mood selection cards                                |
| src/components/mood/MoodChart.jsx                | 7/30/90-day chart (Recharts)                          |
| src/components/mood/MoodHeatmap.jsx              | Calendar heatmap grid                                 |
| src/components/mood/BreathingCircle.jsx          | Animated breathing guide                              |
| src/components/professional/ProfessionalCard.jsx | Pro listing card                                      |
| src/components/professional/BookingCalendar.jsx  | Date + slot picker                                    |
| src/pages/LandingPage.jsx                        | Public landing page                                   |
| src/pages/auth/RegisterPage.jsx                  | Registration form                                     |
| src/pages/auth/LoginPage.jsx                     | Login form                                            |
| src/pages/auth/VerifyEmailPage.jsx               | OTP entry                                             |
| src/pages/onboarding/OnboardingWizard.jsx        | 5-step onboarding                                     |
| src/pages/dashboard/DashboardPage.jsx            | Home dashboard                                        |
| src/pages/chat/ChatPage.jsx                      | Chat list + conversation view                         |
| src/pages/ai/AICompanionPage.jsx                 | AI chat interface                                     |
| src/pages/videos/VideosPage.jsx                  | Mood video browser                                    |
| src/pages/community/CommunityFeedPage.jsx        | Group feed                                            |
| src/pages/community/GroupPage.jsx                | Single group page                                     |
| src/pages/professionals/ProfessionalsPage.jsx    | Pro directory + filters                               |
| src/pages/profile/ProfilePage.jsx                | User profile + journal                                |
| src/pages/settings/SettingsPage.jsx              | Account + notification settings                       |
| src/pages/notifications/NotificationsPage.jsx    | Notification centre                                   |
| src/pages/admin/AdminDashboard.jsx               | Admin overview                                        |
| src/pages/admin/AdminUsersPage.jsx               | User management table                                 |
| src/pages/admin/AdminModerationPage.jsx          | Report queue                                          |
| src/pages/pro/ProDashboardPage.jsx               | Professional home                                     |
| src/pages/pro/ProAvailabilityPage.jsx            | Calendar availability manager                         |
| src/styles/globals.css                           | CSS variables, resets, Tailwind base                  |
| src/utils/tokenManager.js                        | Store/retrieve/clear JWT tokens (localStorage)        |
| src/utils/formatters.js                          | formatDate(), formatDuration(), moodToColor()         |
| src/utils/validators.js                          | Email/password/form validators                        |
| vite.config.js                                   | Vite bundler config --- proxy /api → backend in dev   |
| tailwind.config.js                               | Tailwind CSS configuration + colour palette           |
| .env.local                                       | VITE_API_BASE_URL, VITE_WS_BASE_URL                   |
| .eslintrc.json                                   | ESLint Airbnb config                                  |
| vitest.config.js                                 | Test runner config                                    |
| src/\_\_tests\_\_/                               | Component and page test files                         |

**13. Development Roadmap & Milestones**

Development is organised into 6 phases. Each phase builds on the previous. Estimated duration assumes a team of 2--3 full-stack developers.

| **Phase** | **Name**                       | **Duration** | **Deliverables**                                                                                                                                                                                            |
|-----------|--------------------------------|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1         | Foundation                     | 2 weeks      | VPS setup, Nginx, Django project scaffold, MySQL schema, React project scaffold with routing, authentication (register/login/JWT/OTP), CI/CD pipeline, .env config                                          |
| 2         | Core Chat & AI                 | 3 weeks      | Django Channels WebSocket chat, real-time typing/receipts/reactions, Anthropic AI integration with SSE streaming, AI session storage, breathing exercise component                                          |
| 3         | Videos & Community             | 3 weeks      | YouTube API integration with Redis caching, local video upload, mood filtering, video bookmarks/watch tracking. Community groups, posts, comments, 6-reaction system, anonymous posting, moderation reports |
| 4         | Professionals & Booking        | 3 weeks      | Professional directory with filter/search, full profile pages, availability calendar, booking flow, session reminders via Celery, session notes, reviews, professional dashboard                            |
| 5         | Notifications, Profile & Admin | 2 weeks      | Celery Beat daily email digest, in-app WebSocket notifications, notification preferences, user profile with mood heatmap and journal, achievements, admin panel, professional approval queue                |
| 6         | Polish, Testing & Launch       | 2 weeks      | End-to-end tests, security audit, performance optimisation, GDPR compliance (data export/delete), accessibility audit, mobile responsiveness, production deployment, monitoring setup (Sentry, UptimeRobot) |

**13.1 Priority Classification**

| **Priority** | **Definition**                                              | **Count of Requirements** |
|--------------|-------------------------------------------------------------|---------------------------|
| Must Have    | Core functionality --- platform cannot launch without these | \~65 requirements         |
| Should Have  | Important for good UX --- should be in v1 if time allows    | \~28 requirements         |
| Could Have   | Nice-to-have --- can be deferred to v1.1 or later           | \~10 requirements         |

**14. Testing Strategy**

**14.1 Testing Levels**

| **Test Level**    | **Tool**                          | **Target Coverage** | **What is Tested**                                                                              |
|-------------------|-----------------------------------|---------------------|-------------------------------------------------------------------------------------------------|
| Unit Tests        | pytest-django                     | 80% (Django apps)   | Individual model methods, serializer validation, utility functions, Celery tasks                |
| Component Tests   | Vitest + React Testing Library    | 70% (React)         | Individual React component rendering, user interaction (click, type, submit)                    |
| Integration Tests | pytest + APIClient                | All endpoints       | Full request/response cycle for each API endpoint including auth, permissions, input validation |
| WebSocket Tests   | pytest-asyncio + Channels Testing | Core consumers      | ChatConsumer: send/receive message, typing indicator, reaction, disconnect handling             |
| End-to-End Tests  | Playwright                        | Critical user paths | Register → onboard → check in mood → chat → book session → watch video → community post         |

**14.2 Critical Test Scenarios**

- A user cannot access another user\'s messages, AI sessions, or journal entries.

- A professional cannot view a patient\'s data unless a booking exists.

- Anonymous posts do not expose the author\'s real identity via any API response.

- Rate limiting correctly blocks after the threshold and resets after the window.

- JWT access token expiry forces a refresh and subsequent requests succeed automatically.

- WebSocket disconnection mid-message does not corrupt the message record in MySQL.

- Celery Beat daily email task sends to users at their configured time in their timezone.

- Booking double-booking is prevented --- concurrent POST requests for the same slot result in exactly one success.

**14.3 Test Environment**

Tests run against an isolated in-memory SQLite database (testing.py settings) with all external services mocked: Anthropic API (responses library), YouTube API (fixtures), SendGrid (mail.outbox), and Redis (fakeredis). This ensures tests are fast, deterministic, and free of side effects.

**15. Appendices**

**Appendix A --- Environment Variables Reference**

| **Variable**         | **Required** | **Description**                                |
|----------------------|--------------|------------------------------------------------|
| SECRET_KEY           | Yes          | Django secret key (50+ char random string)     |
| DEBUG                | Yes          | True (development) / False (production)        |
| ALLOWED_HOSTS        | Yes          | Comma-separated list of allowed hostnames      |
| DB_NAME              | Yes          | MySQL database name                            |
| DB_USER              | Yes          | MySQL user                                     |
| DB_PASSWORD          | Yes          | MySQL password                                 |
| DB_HOST              | Yes          | 127.0.0.1 (local) or DB host                   |
| DB_PORT              | Yes          | 3306                                           |
| REDIS_URL            | Yes          | redis://:password@127.0.0.1:6379/0             |
| ANTHROPIC_API_KEY    | Yes          | sk-ant-\... from Anthropic console             |
| YOUTUBE_API_KEY      | Yes          | AIza\... from Google Cloud Console             |
| SENDGRID_API_KEY     | Yes          | SG\.... from SendGrid dashboard                |
| SENDGRID_FROM_EMAIL  | Yes          | noreply@yourdomain.com                         |
| JWT_PRIVATE_KEY      | Yes          | RSA private key (base64 encoded)               |
| JWT_PUBLIC_KEY       | Yes          | RSA public key (base64 encoded)                |
| GOOGLE_CLIENT_ID     | No           | OAuth2 client ID (if Google login enabled)     |
| GOOGLE_CLIENT_SECRET | No           | OAuth2 client secret                           |
| FRONTEND_URL         | Yes          | https://yourdomain.com (for CORS, email links) |
| VITE_API_BASE_URL    | Yes          | Frontend: https://yourdomain.com/api/v1        |
| VITE_WS_BASE_URL     | Yes          | Frontend: wss://yourdomain.com/ws              |

**Appendix B --- Mood Mapping Reference**

| **Mood Label** | **Score** | **Colour Code**   | **YouTube Search Query**                      | **AI System Hint**                                                   |
|----------------|-----------|-------------------|-----------------------------------------------|----------------------------------------------------------------------|
| Anxious        | 2         | \#F39C12 (amber)  | anxiety relief meditation breathing           | User may be experiencing anxiety. Prioritise grounding techniques.   |
| Sad            | 1         | \#2980B9 (blue)   | coping with sadness gentle motivation         | User seems sad. Be especially warm and suggest professional support. |
| Calm           | 4         | \#1ABC9C (teal)   | mindfulness calm peaceful nature sounds       | User is in a calm state. Good opportunity for reflection exercises.  |
| Happy          | 5         | \#27AE60 (green)  | uplifting motivation positive mental wellness | User feels good. Reinforce positive habits and celebrate progress.   |
| Overwhelmed    | 1         | \#8E44AD (purple) | overwhelm stress relief quick calm            | User may be overwhelmed. Offer breathing exercise immediately.       |

**Appendix C --- Celery Beat Scheduled Tasks**

| **Task Name**               | **Schedule**                                     | **Description**                                                                           |
|-----------------------------|--------------------------------------------------|-------------------------------------------------------------------------------------------|
| send_daily_digest           | Every minute (filters by user notification_time) | Check users whose notification_time matches current minute and timezone, send daily email |
| send_session_reminders_24h  | Every hour                                       | Find bookings starting in 24 hours, send reminder email to user and professional          |
| send_session_reminders_1h   | Every 15 minutes                                 | Find bookings starting in 1 hour, send final reminder                                     |
| update_professional_ratings | Daily at 02:00 UTC                               | Recalculate average_rating for all professionals from reviews                             |
| cleanup_expired_otps        | Every 30 minutes                                 | Delete OTP records older than 15 minutes from the DB                                      |
| cleanup_expired_tokens      | Daily at 03:00 UTC                               | Remove expired JWT blacklist entries                                                      |
| generate_daily_affirmations | Daily at 00:00 UTC                               | Pre-generate 5 affirmations for the day using AI (cached in Redis)                        |

**Appendix D --- Error Response Format**

All API errors follow a consistent JSON response format:

{ \"error\": { \"code\": \"VALIDATION_ERROR\", \"message\": \"Human-readable message\", \"details\": { \"field\": \[\"error detail\"\] } } }

| **HTTP Status** | **Error Code**        | **When It Occurs**                                                       |
|-----------------|-----------------------|--------------------------------------------------------------------------|
| 400             | VALIDATION_ERROR      | Request body fails serializer validation                                 |
| 401             | AUTHENTICATION_FAILED | Missing or invalid JWT token                                             |
| 401             | TOKEN_EXPIRED         | Access token has expired (client should refresh)                         |
| 403             | PERMISSION_DENIED     | Authenticated but not authorised for this resource                       |
| 404             | NOT_FOUND             | Requested resource does not exist                                        |
| 409             | CONFLICT              | Duplicate resource (e.g., email already registered, slot already booked) |
| 429             | RATE_LIMITED          | Too many requests --- retry after X seconds (in Retry-After header)      |
| 500             | INTERNAL_ERROR        | Unhandled server exception --- logged, returns generic message to client |
| 503             | SERVICE_UNAVAILABLE   | External dependency (Anthropic, YouTube) unreachable                     |

**Appendix E --- Third-Party Service Limits & Costs**

| **Service**          | **Free Tier**                     | **Cost at Scale**                                                               |
|----------------------|-----------------------------------|---------------------------------------------------------------------------------|
| Anthropic Claude API | None (pay-as-you-go)              | \~\$3/million input tokens (Sonnet). Budget \$0.01--\$0.05 per user AI session. |
| YouTube Data API v3  | 10,000 units/day free             | Each search costs 100 units. Cache aggressively. \$5 per 1,000 extra units.     |
| SendGrid             | 100 emails/day free               | \$19.95/month for 50,000 emails. Use for transactional + digest.                |
| Let\'s Encrypt SSL   | Free (cert renewal every 90 days) | Free --- automate renewal via cron + certbot renew.                             |
| Google OAuth2        | Free (standard quota)             | Free for most apps. Enterprise quotas available.                                |

**End of Document** --- MindBridge SRS v1.0 \| April 2025 \| Confidential
