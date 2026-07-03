"""4-classifier content moderation pipeline for community posts and comments.

Classifiers:
1. Toxicity Classifier (weight: 0.35) — hate speech, harassment, threats
2. Mental Health Sensitivity (weight: 0.30) — harmful advice, triggering content
3. Relevance Classifier (weight: 0.20) — on-topic for mental health community
4. Quality Classifier (weight: 0.15) — constructive, supportive content

Each classifier returns a score 0-100. The weighted average determines the action:
- >= 70: Auto-approve
- 30-69: Flag for admin review
- < 30: Auto-reject
"""
import json
import logging

import openai
from django.conf import settings

logger = logging.getLogger(__name__)

CLASSIFIER_WEIGHTS = {
    'toxicity': 0.35,
    'sensitivity': 0.30,
    'relevance': 0.20,
    'quality': 0.15,
}

TOXICITY_PROMPT = """You are a content safety classifier for a university mental health support community. Analyze this post for toxicity.

Score the content from 0-100 where:
- 100 = completely safe, no toxicity at all
- 70-99 = safe, minor concerns
- 30-69 = moderately concerning (passive aggression, mild hostility)
- 0-29 = toxic (hate speech, harassment, threats, bullying, slurs)

Consider the mental health context — expressions of emotional pain (e.g., "I feel worthless") are NOT toxic.

Post content: "{content}"
Group context: "{group_name}"

Respond with ONLY a JSON object:
{{"score": <0-100>, "reason": "<brief explanation>"}}"""

SENSITIVITY_PROMPT = """You are a mental health content sensitivity classifier for a university support community. Analyze this post for harmful mental health content.

Score from 0-100 where:
- 100 = completely safe, supportive content
- 70-99 = safe, contains emotional content but handled appropriately
- 30-69 = moderately concerning (could be triggering without context, unqualified medical advice)
- 0-29 = harmful (dangerous advice like "stop taking medication", glorifying self-harm, detailed methods of self-harm)

Important: Sharing personal struggles IS appropriate. Seeking support IS appropriate. The community is designed for this.

Post content: "{content}"
Group context: "{group_name}"

Respond with ONLY a JSON object:
{{"score": <0-100>, "reason": "<brief explanation>"}}"""

RELEVANCE_PROMPT = """You are a relevance classifier for a university mental health support community. Analyze whether this post is relevant to the community's purpose.

Score from 0-100 where:
- 100 = highly relevant (mental health, emotional wellbeing, university life, seeking support)
- 70-99 = mostly relevant (tangentially related to wellbeing or student life)
- 30-69 = somewhat off-topic but not harmful (general chat, unrelated questions)
- 0-29 = completely off-topic (spam, advertising, unrelated politics, promotional content)

Post content: "{content}"
Group context: "{group_name}"

Respond with ONLY a JSON object:
{{"score": <0-100>, "reason": "<brief explanation>"}}"""

QUALITY_PROMPT = """You are a content quality classifier for a university mental health support community. Analyze whether this post contributes positively.

Score from 0-100 where:
- 100 = excellent quality (thoughtful, supportive, encourages healthy discussion)
- 70-99 = good quality (genuine sharing or support)
- 30-69 = acceptable (short but not harmful, could be more constructive)
- 0-29 = poor quality (single word/emoji only, nonsensical, low effort spam)

Post content: "{content}"
Group context: "{group_name}"

Respond with ONLY a JSON object:
{{"score": <0-100>, "reason": "<brief explanation>"}}"""

CLASSIFIER_PROMPTS = {
    'toxicity': TOXICITY_PROMPT,
    'sensitivity': SENSITIVITY_PROMPT,
    'relevance': RELEVANCE_PROMPT,
    'quality': QUALITY_PROMPT,
}


class ContentModerationPipeline:
    """Runs 4 classifier LLM prompts and synthesizes a moderation decision."""

    def __init__(self):
        self.client = openai.OpenAI(
            api_key=getattr(settings, 'OPENROUTER_API_KEY', ''),
            base_url='https://openrouter.ai/api/v1',
            timeout=30,
            max_retries=1,
        )
        self.model = getattr(
            settings, 'OPENROUTER_MODEL', 'meta-llama/llama-3.1-8b-instruct'
        )

    def evaluate(self, content: str, group_name: str = 'General') -> dict:
        """Run the full 4-classifier pipeline on content.

        Args:
            content: The post or comment text to evaluate.
            group_name: The community group name for context.

        Returns:
            Dict with 'status' (approved/rejected/flagged),
            'scores' (per-classifier), 'weighted_score', and 'reasons'.
        """
        scores = {}
        reasons = {}

        for classifier_name, prompt_template in CLASSIFIER_PROMPTS.items():
            prompt = prompt_template.format(content=content, group_name=group_name)
            result = self._run_classifier(prompt, classifier_name)
            scores[classifier_name] = result['score']
            reasons[classifier_name] = result['reason']

        # Calculate weighted average
        weighted_score = sum(
            scores[name] * weight
            for name, weight in CLASSIFIER_WEIGHTS.items()
        )

        # Determine action
        if weighted_score >= 70:
            status = 'approved'
        elif weighted_score < 30:
            status = 'rejected'
        else:
            status = 'flagged'

        return {
            'status': status,
            'scores': scores,
            'reasons': reasons,
            'weighted_score': round(weighted_score, 1),
        }

    def _run_classifier(self, prompt: str, classifier_name: str) -> dict:
        """Run a single classifier prompt and parse the result."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=150,
                messages=[{'role': 'user', 'content': prompt}],
                extra_headers={
                    'HTTP-Referer': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                    'X-Title': 'MindBridge Content Moderation',
                },
            )
            raw = response.choices[0].message.content.strip()
            result = json.loads(raw)
            return {
                'score': max(0, min(100, int(result.get('score', 50)))),
                'reason': result.get('reason', ''),
            }
        except Exception as e:
            logger.error(f"Classifier '{classifier_name}' failed: {e}")
            # Default to safe on classifier failure — don't block content
            return {'score': 75, 'reason': f'Classifier error, defaulting to safe: {e}'}
