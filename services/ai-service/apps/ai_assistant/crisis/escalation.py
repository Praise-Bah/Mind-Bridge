"""Crisis escalation — handles actions when a crisis is detected.

When a crisis-level message is detected, this module:
1. Prepends crisis resources to the AI response (code-level, not prompt-level)
2. Publishes a notification event to alert admins
"""
import logging

from .detector import CrisisLevel

logger = logging.getLogger(__name__)

CRISIS_RESOURCES = (
    "I hear you, and I want you to know that your life matters. What you're feeling "
    "right now is real, and you deserve support.\n\n"
    "Please reach out to someone who can help right now:\n\n"
    "SOS Aide Cameroon: 1510\n"
    "Crisis Text Line: Text HOME to 741741\n"
    "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/\n\n"
    "You can also connect with a professional on MindBridge who specializes in crisis support. "
    "You don't have to go through this alone.\n\n"
)

MODERATE_DISTRESS_NOTE = (
    "I'm here with you, and I want to make sure you're getting the support you need. "
    "If things feel overwhelming, MindBridge has professionals who are trained to help. "
    "You can find one in the Professionals section. "
    "And if you ever feel unsafe, please call SOS Aide Cameroon at 1510.\n\n"
)


class CrisisEscalation:
    """Handles escalation actions based on crisis detection results."""

    def process(
        self,
        crisis_analysis: dict,
        ai_response: str,
        user_id: str,
        session_id: str,
    ) -> str:
        """Process crisis analysis and modify the response if needed.

        Args:
            crisis_analysis: Output from CrisisDetector.analyze()
            ai_response: The AI-generated response text
            user_id: The user's UUID
            session_id: The AI session UUID

        Returns:
            Modified response with crisis resources prepended if necessary.
        """
        crisis_level = CrisisLevel(crisis_analysis['crisis_level'])

        if crisis_level == CrisisLevel.CRISIS:
            self._notify_admins(crisis_analysis, user_id, session_id)
            return CRISIS_RESOURCES + ai_response

        if crisis_level == CrisisLevel.MODERATE:
            return MODERATE_DISTRESS_NOTE + ai_response

        return ai_response

    def _notify_admins(
        self,
        crisis_analysis: dict,
        user_id: str,
        session_id: str,
    ) -> None:
        """Publish a notification event to alert admins about a crisis."""
        try:
            from django.conf import settings
            import redis
            import json

            redis_url = getattr(settings, 'REDIS_EVENT_BUS_URL', 'redis://localhost:6379/3')
            r = redis.from_url(redis_url)

            conditions = [c['condition'] for c in crisis_analysis.get('detected_conditions', [])]

            event = {
                'type': 'crisis.detected',
                'data': {
                    'user_id': str(user_id),
                    'session_id': str(session_id),
                    'crisis_level': crisis_analysis['crisis_level'],
                    'detected_conditions': conditions,
                },
            }
            r.publish('mindbridge.events.crisis.detected', json.dumps(event))
            logger.warning(
                f"CRISIS ALERT: user={user_id} session={session_id} "
                f"conditions={conditions}"
            )
        except Exception as e:
            logger.error(f"Failed to publish crisis notification: {e}")
