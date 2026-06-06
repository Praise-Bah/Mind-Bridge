"""
Admin-service aggregator views.
Each view calls the appropriate service's internal admin endpoint via HTTP,
using a circuit breaker for fault tolerance.
"""
import logging
from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
import requests

from .circuit_breakers import auth_cb, community_cb, professionals_cb, chat_cb, content_cb

log = logging.getLogger(__name__)

TIMEOUT = getattr(settings, 'INTERNAL_CALL_TIMEOUT', 10)


def _internal_headers():
    return {'X-Internal-Token': settings.INTERNAL_SERVICE_TOKEN}


def _call(cb, method: str, url: str, **kwargs):
    """Make an internal HTTP call guarded by a circuit breaker."""
    if not cb.is_available():
        log.warning('Circuit breaker OPEN for %s', cb.name)
        return None, 503
    try:
        resp = requests.request(
            method, url,
            headers=_internal_headers(),
            timeout=TIMEOUT,
            **kwargs,
        )
        cb.record_success()
        return resp, resp.status_code
    except requests.RequestException as exc:
        log.error('Internal call failed: %s — %s', url, exc)
        cb.record_failure()
        return None, 503


def _service_response(cb, method, url, request_data=None, params=None):
    """Forward a call and return a DRF Response."""
    kwargs = {}
    if params:
        kwargs['params'] = params
    if request_data is not None:
        kwargs['json'] = request_data
    resp, status = _call(cb, method, url, **kwargs)
    if resp is None:
        return Response({'error': f'Service unavailable'}, status=503)
    try:
        return Response(resp.json(), status=status)
    except ValueError:
        return Response({'error': 'invalid response from service'}, status=502)


# ── Stats (aggregated from all services) ─────────────────────────

class AdminStatsView(APIView):
    def get(self, request):
        auth_url = f"{settings.AUTH_SERVICE_INTERNAL_URL}/internal/admin/stats/"
        community_url = f"{settings.COMMUNITY_SERVICE_INTERNAL_URL}/internal/admin/stats/"
        professionals_url = f"{settings.PROFESSIONALS_SERVICE_INTERNAL_URL}/internal/admin/stats/"
        chat_url = f"{settings.CHAT_SERVICE_INTERNAL_URL}/internal/admin/stats/"

        auth_resp, _ = _call(auth_cb, 'GET', auth_url)
        community_resp, _ = _call(community_cb, 'GET', community_url)
        professionals_resp, _ = _call(professionals_cb, 'GET', professionals_url)
        chat_resp, _ = _call(chat_cb, 'GET', chat_url)

        stats = {}
        if auth_resp:
            try:
                stats.update(auth_resp.json())
            except ValueError:
                pass
        if community_resp:
            try:
                stats.update(community_resp.json())
            except ValueError:
                pass
        if professionals_resp:
            try:
                stats.update(professionals_resp.json())
            except ValueError:
                pass
        if chat_resp:
            try:
                stats.update(chat_resp.json())
            except ValueError:
                pass

        # Ensure all keys exist even when a service is down
        stats.setdefault('total_users', None)
        stats.setdefault('new_users_today', None)
        stats.setdefault('total_professionals', None)
        stats.setdefault('pending_professionals', None)
        stats.setdefault('active_sessions_today', None)
        stats.setdefault('total_messages', None)
        stats.setdefault('unresolved_reports', None)
        stats.setdefault('pending_groups', None)
        return Response(stats)


# ── User Management ──────────────────────────────────────────────

class AdminUserListView(APIView):
    def get(self, request):
        url = f"{settings.AUTH_SERVICE_INTERNAL_URL}/internal/admin/users/"
        return _service_response(auth_cb, 'GET', url, params=request.query_params)


class AdminUserExportView(APIView):
    def get(self, request):
        url = f"{settings.AUTH_SERVICE_INTERNAL_URL}/internal/admin/users/export/"
        if not auth_cb.is_available():
            return Response({'error': 'auth-service unavailable'}, status=503)
        try:
            resp = requests.get(url, headers=_internal_headers(), timeout=60, stream=True)
            auth_cb.record_success()
            streaming = StreamingHttpResponse(
                resp.iter_content(chunk_size=8192),
                content_type='text/csv',
            )
            streaming['Content-Disposition'] = 'attachment; filename="users.csv"'
            return streaming
        except requests.RequestException as exc:
            auth_cb.record_failure()
            return Response({'error': str(exc)}, status=503)


class AdminBanUserView(APIView):
    def post(self, request, pk):
        url = f"{settings.AUTH_SERVICE_INTERNAL_URL}/internal/admin/users/{pk}/ban/"
        return _service_response(auth_cb, 'POST', url)


class AdminActivateUserView(APIView):
    def post(self, request, pk):
        url = f"{settings.AUTH_SERVICE_INTERNAL_URL}/internal/admin/users/{pk}/activate/"
        return _service_response(auth_cb, 'POST', url)


# ── Professional Applications ────────────────────────────────────

class PendingProfessionalsView(APIView):
    def get(self, request):
        url = f"{settings.AUTH_SERVICE_INTERNAL_URL}/internal/admin/professionals/pending/"
        return _service_response(auth_cb, 'GET', url)


class ApproveProfessionalView(APIView):
    def post(self, request, pk):
        url = f"{settings.AUTH_SERVICE_INTERNAL_URL}/internal/admin/professionals/{pk}/approve/"
        resp = _service_response(auth_cb, 'POST', url)
        if resp.status_code == 200:
            # Send approval email via auth-service (it returns user info)
            try:
                from django.core.mail import send_mail
                data = resp.data
                user_name = data.get('user_name', '')
                user_email = data.get('user_email', '')
                if user_email:
                    send_mail(
                        subject='MindBridge — Professional Application Approved',
                        message=(
                            f'Hello {user_name},\n\n'
                            'Your application to become a professional on MindBridge has been approved. '
                            'You can now log in and start accepting bookings.\n\nThe MindBridge Team'
                        ),
                        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@mindbridge.com'),
                        recipient_list=[user_email],
                        fail_silently=True,
                    )
            except Exception:
                pass
        return resp


class RejectProfessionalView(APIView):
    def post(self, request, pk):
        url = f"{settings.AUTH_SERVICE_INTERNAL_URL}/internal/admin/professionals/{pk}/reject/"
        resp = _service_response(auth_cb, 'POST', url, request_data=request.data)
        if resp.status_code == 200:
            try:
                from django.core.mail import send_mail
                data = resp.data
                user_email = data.get('user_email', '')
                reason = request.data.get('reason', 'Not specified.')
                if user_email:
                    send_mail(
                        subject='MindBridge — Professional Application Update',
                        message=(
                            f'Hello,\n\n'
                            f'Unfortunately your application was not approved at this time.\n'
                            f'Reason: {reason}\n\nThe MindBridge Team'
                        ),
                        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@mindbridge.com'),
                        recipient_list=[user_email],
                        fail_silently=True,
                    )
            except Exception:
                pass
        return resp


# ── Community Group Review ───────────────────────────────────────

class PendingGroupsView(APIView):
    def get(self, request):
        url = f"{settings.COMMUNITY_SERVICE_INTERNAL_URL}/internal/admin/groups/pending/"
        return _service_response(community_cb, 'GET', url)


class ApproveGroupView(APIView):
    def post(self, request, pk):
        url = f"{settings.COMMUNITY_SERVICE_INTERNAL_URL}/internal/admin/groups/{pk}/approve/"
        return _service_response(community_cb, 'POST', url)


class RejectGroupView(APIView):
    def post(self, request, pk):
        url = f"{settings.COMMUNITY_SERVICE_INTERNAL_URL}/internal/admin/groups/{pk}/reject/"
        return _service_response(community_cb, 'POST', url, request_data=request.data)


# ── Content Moderation (Reports) ─────────────────────────────────

class ReportListView(APIView):
    def get(self, request):
        url = f"{settings.COMMUNITY_SERVICE_INTERNAL_URL}/internal/admin/reports/"
        return _service_response(community_cb, 'GET', url, params=request.query_params)


class DismissReportView(APIView):
    def post(self, request, pk):
        url = f"{settings.COMMUNITY_SERVICE_INTERNAL_URL}/internal/admin/reports/{pk}/dismiss/"
        return _service_response(community_cb, 'POST', url)


class DeleteReportContentView(APIView):
    def post(self, request, pk):
        url = f"{settings.COMMUNITY_SERVICE_INTERNAL_URL}/internal/admin/reports/{pk}/delete-content/"
        return _service_response(community_cb, 'POST', url)


class WarnReportedUserView(APIView):
    def post(self, request, pk):
        url = f"{settings.COMMUNITY_SERVICE_INTERNAL_URL}/internal/admin/reports/{pk}/warn-user/"
        return _service_response(community_cb, 'POST', url)


class BanReportedUserView(APIView):
    """
    Orchestrates: community-service marks report resolved + returns user_id,
    then admin-service calls auth-service to actually ban that user account.
    """
    def post(self, request, pk):
        # Step 1: community-service resolves the report and returns user_id
        community_url = f"{settings.COMMUNITY_SERVICE_INTERNAL_URL}/internal/admin/reports/{pk}/ban-user/"
        community_resp, community_status = _call(community_cb, 'POST', community_url)
        if community_resp is None:
            return Response({'error': 'community-service unavailable'}, status=503)
        try:
            data = community_resp.json()
        except ValueError:
            return Response({'error': 'invalid response from community-service'}, status=502)
        if community_status not in (200, 201):
            return Response(data, status=community_status)

        user_id = data.get('user_id')
        if not user_id:
            return Response({'status': 'report_resolved', 'user_id': None})

        # Step 2: ban the user in auth-service
        auth_url = f"{settings.AUTH_SERVICE_INTERNAL_URL}/internal/admin/users/{user_id}/ban/"
        _call(auth_cb, 'POST', auth_url)

        return Response({'status': 'banned', 'user_id': user_id})


# ── Video Management ──────────────────────────────────────────────

class AdminVideoListCreateView(APIView):
    def get(self, request):
        url = f"{settings.CONTENT_SERVICE_INTERNAL_URL}/internal/admin/videos/"
        return _service_response(content_cb, 'GET', url)

    def post(self, request):
        url = f"{settings.CONTENT_SERVICE_INTERNAL_URL}/internal/admin/videos/"
        return _service_response(content_cb, 'POST', url, request_data=request.data)


class AdminVideoDetailView(APIView):
    def get(self, request, pk):
        url = f"{settings.CONTENT_SERVICE_INTERNAL_URL}/internal/admin/videos/{pk}/"
        return _service_response(content_cb, 'GET', url)

    def put(self, request, pk):
        url = f"{settings.CONTENT_SERVICE_INTERNAL_URL}/internal/admin/videos/{pk}/"
        return _service_response(content_cb, 'PUT', url, request_data=request.data)

    def patch(self, request, pk):
        url = f"{settings.CONTENT_SERVICE_INTERNAL_URL}/internal/admin/videos/{pk}/"
        return _service_response(content_cb, 'PATCH', url, request_data=request.data)

    def delete(self, request, pk):
        url = f"{settings.CONTENT_SERVICE_INTERNAL_URL}/internal/admin/videos/{pk}/"
        return _service_response(content_cb, 'DELETE', url)


# ── Email Campaign ───────────────────────────────────────────────

class EmailCampaignView(APIView):
    def post(self, request):
        url = f"{settings.AUTH_SERVICE_INTERNAL_URL}/internal/admin/email-campaign/"
        return _service_response(auth_cb, 'POST', url, request_data=request.data)
