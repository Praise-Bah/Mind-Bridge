"""Crisis detector — classifies messages by mental health condition and severity.

Detects 6 conditions: depression, anxiety, paranoia, burnout, suicidal ideation,
and general emotional distress. Classifies severity as normal, mild, moderate, or crisis.
"""
import re
from enum import Enum


class CrisisLevel(str, Enum):
    NORMAL = 'normal'
    MILD = 'mild_distress'
    MODERATE = 'moderate_distress'
    CRISIS = 'crisis'


# Condition-specific keyword/pattern sets
CONDITION_PATTERNS = {
    'suicidal_ideation': {
        'crisis': [
            r'\bwant to die\b', r'\bwant to kill myself\b', r'\bend my life\b',
            r'\bend it all\b', r'\bsuicid\w*\b', r'\bkill myself\b',
            r'\bbetter off dead\b', r"\bdon'?t want to (be here|live|exist)\b",
            r'\btake my (own )?life\b', r'\bjump off\b', r'\bslit my\b',
            r'\boverdose\b', r'\bhang myself\b',
        ],
        'moderate': [
            r'\bno reason to live\b', r'\bno point (in|to) (living|life)\b',
            r'\bwish i (was|were) dead\b', r'\bwish i (was|were)n\'?t (alive|here|born)\b',
            r"\bcan'?t go on\b", r'\bdisappear forever\b',
        ],
    },
    'depression': {
        'moderate': [
            r'\bhopeless\b', r'\bworthless\b', r'\bempty inside\b',
            r'\bno energy\b', r"\bcan'?t get out of bed\b",
            r'\bnothing matters\b', r'\bnobody cares\b',
            r'\bbetter off without me\b', r'\bfeel nothing\b',
        ],
        'mild': [
            r'\bfeeling (down|low|sad|blue)\b', r'\bdepressed\b',
            r'\bunmotivated\b', r'\blost interest\b', r'\bno motivation\b',
            r"\bcan'?t (enjoy|feel)\b", r'\bisolat\w+\b',
        ],
    },
    'anxiety': {
        'moderate': [
            r'\bpanic attack\b', r"\bcan'?t breathe\b", r"\bcan'?t stop (shaking|trembling)\b",
            r'\bheart (racing|pounding)\b', r'\bparalyz\w+ (by|with) fear\b',
            r'\bconstant dread\b', r'\bterrified\b',
        ],
        'mild': [
            r'\banxious\b', r'\bworried\b', r'\bnervous\b', r'\bstressed\b',
            r'\boverthinking\b', r'\brestless\b', r"\bcan'?t (relax|calm down|sleep)\b",
            r'\buneasy\b', r'\bon edge\b',
        ],
    },
    'paranoia': {
        'crisis': [
            r'\b(they|people|someone) (are|is) (watching|following|tracking) me\b',
            r'\beveryone is (against|plotting|conspiring)\b',
            r'\bbeing monitored\b', r'\bthey want to (hurt|kill|get) me\b',
            r'\bvoices (telling|saying|in my head)\b',
            r'\bsomeone is controlling\b',
        ],
        'moderate': [
            r'\bnobody can be trusted\b', r'\beveryone (hates|is lying)\b',
            r"\bcan'?t trust anyone\b", r'\bpeople are talking about me\b',
            r'\bbeing watched\b',
        ],
    },
    'burnout': {
        'moderate': [
            r'\bcompletely (exhausted|drained|burnt out)\b',
            r"\bcan'?t (take|handle|do) (it|this) anymore\b",
            r'\bfalling apart\b', r'\bat (my )?breaking point\b',
            r'\boverwhel\w+\b',
        ],
        'mild': [
            r'\b(burn|burnt) ?out\b', r'\bexhausted\b', r'\btoo (much|tired)\b',
            r'\bno (energy|strength) left\b', r'\bdrained\b',
            r'\brun(ning)? on (empty|fumes)\b',
        ],
    },
    'general_distress': {
        'moderate': [
            r'\bhurt myself\b', r'\bself[- ]?harm\b', r'\bcutting myself\b',
            r'\bgive up\b', r'\bbreaking down\b', r'\bcrying (all|every)\b',
        ],
        'mild': [
            r'\bstruggling\b', r'\bnot (okay|ok|fine|alright)\b',
            r'\bgoing through a (hard|tough|difficult) time\b',
            r'\bneed help\b', r'\bfeeling (lost|stuck|trapped)\b',
        ],
    },
}


class CrisisDetector:
    """Detects mental health conditions and crisis severity from message text."""

    def analyze(self, message: str) -> dict:
        """Analyze a message for mental health conditions and severity.

        Args:
            message: The user's message text.

        Returns:
            Dict with 'crisis_level', 'detected_conditions', and 'distress_score' keys.
        """
        message_lower = message.lower()
        detected_conditions = []
        max_level = CrisisLevel.NORMAL

        for condition, severity_patterns in CONDITION_PATTERNS.items():
            condition_level = self._check_condition(message_lower, severity_patterns)
            if condition_level != CrisisLevel.NORMAL:
                detected_conditions.append({
                    'condition': condition,
                    'severity': condition_level.value,
                })
                if self._severity_rank(condition_level) > self._severity_rank(max_level):
                    max_level = condition_level

        # Calculate a distress score (0-5) for backward compatibility
        distress_score = min(len(detected_conditions) + self._severity_rank(max_level), 5)

        return {
            'crisis_level': max_level.value,
            'detected_conditions': detected_conditions,
            'distress_score': distress_score,
        }

    def _check_condition(
        self, message: str, severity_patterns: dict[str, list[str]]
    ) -> CrisisLevel:
        """Check a message against a condition's patterns at each severity level."""
        # Check from highest severity to lowest
        for level_name in ['crisis', 'moderate', 'mild']:
            patterns = severity_patterns.get(level_name, [])
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    return CrisisLevel(level_name if level_name != 'crisis' else 'crisis')

        return CrisisLevel.NORMAL

    @staticmethod
    def _severity_rank(level: CrisisLevel) -> int:
        return {
            CrisisLevel.NORMAL: 0,
            CrisisLevel.MILD: 1,
            CrisisLevel.MODERATE: 2,
            CrisisLevel.CRISIS: 3,
        }[level]
