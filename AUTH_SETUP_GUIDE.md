# MindBridge Authentication Setup Guide

This guide explains how to set up the authentication features including Google OAuth, SendGrid email, and professional approval workflow.

---

## 1. Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "MindBridge" and create

### Step 2: Configure OAuth Consent Screen
1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select "External" user type
3. Fill in:
   - App name: `MindBridge`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if in testing mode

### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `MindBridge Web Client`
5. Add Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - Your production URL
6. Add Authorized redirect URIs:
   - `http://localhost:3000`
   - Your production URL
7. Click **Create** and copy the **Client ID** and **Client Secret**

### Step 4: Add to Environment Files

**Backend** (`backend/.env`):
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Frontend** (`frontend/.env`):
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## 2. SendGrid Email Setup

### Step 1: Create SendGrid Account
1. Go to [SendGrid](https://sendgrid.com/) and sign up
2. Complete email verification

### Step 2: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `MindBridge`
4. Permissions: **Full Access** or **Restricted Access** with Mail Send enabled
5. Copy the API key (shown only once!)

### Step 3: Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Choose **Single Sender Verification** (easiest for development)
3. Add your sender email (e.g., `noreply@yourdomain.com`)
4. Verify via the email link

### Step 4: Add to Backend Environment

**Backend** (`backend/.env`):
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Development Alternative (Console Email)
For local development without SendGrid, you can use Django's console email backend. Add to `backend/core/settings/development.py`:

```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

This prints emails to the terminal instead of sending them.

---

## 3. Professional Approval Workflow

### How It Works
1. User registers with role = "professional"
2. A `ProfessionalApplication` record is created with status = "pending"
3. User can log in but `is_professional = False` until approved
4. Admin reviews and approves/rejects via API or admin panel

### Admin API Endpoints

**List pending applications:**
```
GET /api/v1/auth/applications/?status=pending
Authorization: Bearer <admin_token>
```

**View application details:**
```
GET /api/v1/auth/applications/<uuid>/
Authorization: Bearer <admin_token>
```

**Approve application:**
```
POST /api/v1/auth/applications/<uuid>/approve/
Authorization: Bearer <admin_token>
```

**Reject application:**
```
POST /api/v1/auth/applications/<uuid>/reject/
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Optional rejection reason"
}
```

### Django Admin Panel
1. Run `python manage.py createsuperuser` to create an admin
2. Access `/admin/` and log in
3. Navigate to **Users** → **Professional Applications**
4. Review and update status manually

### Email Notifications
- On approval: User receives email confirming professional status
- On rejection: User receives email with optional reason

---

## 4. Testing the Auth Flow

### Registration Flow
1. Go to `/register`
2. Select role (User or Professional)
3. Fill in details and submit
4. Check terminal/email for 6-digit OTP
5. Enter OTP on verification page
6. Auto-redirected to dashboard

### Login Flow
1. Go to `/login`
2. Enter credentials or use Google Sign-In
3. Redirected to dashboard

### Password Reset Flow
1. Go to `/forgot-password`
2. Enter email
3. Check terminal/email for 6-digit code
4. Enter code and set new password

---

## 5. Environment Variables Summary

### Backend (`backend/.env`)
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# SendGrid Email
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)
```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## 6. Troubleshooting

### Google Sign-In Not Working
- Ensure `VITE_GOOGLE_CLIENT_ID` is set in frontend `.env`
- Check browser console for errors
- Verify authorized origins in Google Cloud Console

### Emails Not Sending
- Check `SENDGRID_API_KEY` is correct
- Verify sender email is authenticated in SendGrid
- For dev, use console email backend

### OTP Not Received
- Check spam folder
- Verify SendGrid sender is verified
- Check Django logs for email errors

### Professional Not Activated
- Ensure admin has approved the application
- Check `ProfessionalApplication.status` is "approved"
- Verify `User.is_professional` is True after approval
