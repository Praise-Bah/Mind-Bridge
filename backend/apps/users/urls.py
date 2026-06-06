from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, PasswordChangeView, VerifyEmailView, ResendOTPView,
    ForgotPasswordView, VerifyResetCodeView, ResetPasswordView, GoogleAuthView,
    ProfessionalApplicationListView, ProfessionalApplicationDetailView,
    ApproveProfessionalView, RejectProfessionalView, MyApplicationView,
    PrivacySettingsView, AppearanceSettingsView, NotificationSettingsView,
    UserSessionListView, RevokeSessionView, DeactivateAccountView, DeleteAccountView
)

urlpatterns = [
    # Registration & Login
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Email Verification
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend_otp'),
    
    # Password Reset
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('verify-reset-code/', VerifyResetCodeView.as_view(), name='verify_reset_code'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    
    # Google OAuth
    path('google/', GoogleAuthView.as_view(), name='google_auth'),
    
    # Professional Applications (Admin)
    path('applications/', ProfessionalApplicationListView.as_view(), name='professional_applications'),
    path('applications/<uuid:pk>/', ProfessionalApplicationDetailView.as_view(), name='professional_application_detail'),
    path('applications/<uuid:pk>/approve/', ApproveProfessionalView.as_view(), name='approve_professional'),
    path('applications/<uuid:pk>/reject/', RejectProfessionalView.as_view(), name='reject_professional'),
    path('my-application/', MyApplicationView.as_view(), name='my_application'),
    
    # Settings
    path('settings/privacy/', PrivacySettingsView.as_view(), name='privacy_settings'),
    path('settings/appearance/', AppearanceSettingsView.as_view(), name='appearance_settings'),
    path('settings/notifications/', NotificationSettingsView.as_view(), name='notification_settings'),
    path('settings/sessions/', UserSessionListView.as_view(), name='user_sessions'),
    path('settings/sessions/<uuid:pk>/revoke/', RevokeSessionView.as_view(), name='revoke_session'),
    path('settings/deactivate/', DeactivateAccountView.as_view(), name='deactivate_account'),
    path('settings/delete/', DeleteAccountView.as_view(), name='delete_account'),
]
