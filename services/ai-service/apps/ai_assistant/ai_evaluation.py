"""Multi-model AI evaluation for community group approval requests.

Moved from the monolith's community/ai_services.py into the AI service so
it runs in isolation. Receives all data from the event payload — no DB queries.
"""
import json
import asyncio
import logging
from typing import Dict, List, Tuple

from django.conf import settings

logger = logging.getLogger(__name__)


class GroupApprovalAIService:
    """Evaluates a community group creation request using multiple AI models."""

    def __init__(self):
        self.models = getattr(settings, 'OPENROUTER_MODELS', {
            'claude_sonnet': {'id': 'anthropic/claude-sonnet-4', 'weight': 0.30, 'name': 'Claude Sonnet'},
            'gpt4': {'id': 'openai/gpt-4', 'weight': 0.25, 'name': 'GPT-4'},
            'gemini': {'id': 'google/gemini-pro', 'weight': 0.25, 'name': 'Gemini Pro'},
            'llama3': {'id': 'meta-llama/llama-3-70b-instruct', 'weight': 0.20, 'name': 'Llama 3'},
        })

    async def generate_questions(self, creation_reason: str) -> List[str]:
        prompt = (
            f'Based on this group creation reason for a mental health support community: "{creation_reason}"\n\n'
            'Generate 3-5 specific, thoughtful questions to better understand:\n'
            '1. The mental health focus and target audience\n'
            '2. Safety considerations and moderation approach\n'
            '3. Community value and intended outcomes\n'
            '4. User\'s experience with the topic\n'
            '5. Specific support methods or approaches\n\n'
            'Return only the questions as a JSON array of strings.'
        )
        try:
            from .services import AIService
            service = AIService('claude_sonnet')
            response = await asyncio.to_thread(service.get_response, [], prompt)
            questions = json.loads(response)
            if isinstance(questions, list) and len(questions) >= 3:
                return questions[:5]
        except Exception as exc:
            logger.error('Error generating questions: %s', exc)

        return [
            'What specific mental health topics will this group focus on?',
            'How will you ensure member safety and appropriate discussions?',
            'What experience do you have with this mental health topic?',
            'What kind of support do you hope members will receive?',
            'How will you moderate discussions to keep them supportive?',
        ]

    async def evaluate_group_request(
        self,
        group_name: str,
        description: str,
        creation_reason: str,
        questions: List[str],
        answers: List[str],
    ) -> Tuple[List[Dict], int, str]:
        qa_pairs = '\n\n'.join(f'Q: {q}\nA: {a}' for q, a in zip(questions, answers))

        evaluation_prompt = (
            f'Evaluate this community group creation request for a mental health support platform:\n\n'
            f'Group Name: {group_name}\n'
            f'Description: {description}\n'
            f'Creation Reason: {creation_reason}\n\n'
            f'Questions and Answers:\n{qa_pairs}\n\n'
            'Please evaluate this request based on:\n'
            '1. Mental Health Appropriateness (0-100)\n'
            '2. Safety Considerations (0-100)\n'
            '3. Community Value (0-100)\n'
            '4. User Qualification (0-100)\n\n'
            'Provide your response in this exact JSON format:\n'
            '{"mental_health_score": <score>, "safety_score": <score>, '
            '"community_value_score": <score>, "user_qualification_score": <score>, '
            '"overall_score": <average>, "reasoning": "<brief explanation>", "approval": true/false}'
        )

        tasks = [
            self._evaluate_with_model(model_key, model_config, evaluation_prompt)
            for model_key, model_config in self.models.items()
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        valid_scores = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error('Error with model %s: %s', list(self.models.keys())[i], result)
                continue
            model_config = list(self.models.values())[i]
            try:
                evaluation = json.loads(result)
                if 'overall_score' in evaluation:
                    valid_scores.append({
                        'model': model_config['name'],
                        'score': evaluation['overall_score'],
                        'weight': model_config['weight'],
                        'reasoning': evaluation.get('reasoning', ''),
                        'details': evaluation,
                    })
            except (json.JSONDecodeError, KeyError) as exc:
                logger.error('Error parsing result from %s: %s', model_config['name'], exc)

        if not valid_scores:
            return [], 0, 'Unable to complete evaluation due to technical issues.'

        total_weight = sum(s['weight'] for s in valid_scores)
        final_score = int(sum(s['score'] * s['weight'] for s in valid_scores) / total_weight) if total_weight else 0

        return valid_scores, final_score, self._generate_summary(valid_scores, final_score)

    async def _evaluate_with_model(self, model_key: str, model_config: Dict, prompt: str) -> str:
        try:
            from .services import AIService
            service = AIService(model_key)
            return await asyncio.to_thread(service.get_response, [], prompt)
        except Exception as exc:
            logger.error('Error with %s: %s', model_config['name'], exc)
            return '{"overall_score": 0, "reasoning": "Error during evaluation"}'

    def _generate_summary(self, model_scores: List[Dict], final_score: int) -> str:
        approval_status = (
            'Approved' if final_score >= 80
            else 'Requires Review' if final_score >= 50
            else 'Rejected'
        )
        lines = [
            f'AI Evaluation Summary: {approval_status}',
            f'Overall Score: {final_score}/100',
            '',
            'Individual Model Scores:',
        ]
        for s in model_scores:
            lines.append(f"- {s['model']}: {s['score']}/100")

        reasonings = [s['reasoning'] for s in model_scores if s.get('reasoning')]
        if reasonings:
            lines.append('')
            lines.append('Key Considerations:')
            for r in reasonings[:2]:
                lines.append(f'- {r[:100]}{"..." if len(r) > 100 else ""}')

        return '\n'.join(lines)
