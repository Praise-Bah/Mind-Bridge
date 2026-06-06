"""AI services for community group evaluation — local copy using OpenRouter directly."""
import json
import asyncio
import openai
from typing import Dict, List, Tuple
from django.conf import settings


class AIService:
    def __init__(self, model_key: str = None):
        self.client = openai.OpenAI(
            api_key=getattr(settings, 'OPENROUTER_API_KEY', ''),
            base_url='https://openrouter.ai/api/v1',
        )
        if model_key and hasattr(settings, 'OPENROUTER_MODELS'):
            models = getattr(settings, 'OPENROUTER_MODELS', {})
            self.model = models.get(model_key, {}).get(
                'id', getattr(settings, 'OPENROUTER_MODEL', 'anthropic/claude-sonnet-4')
            )
        else:
            self.model = getattr(settings, 'OPENROUTER_MODEL', 'anthropic/claude-sonnet-4')

    def get_response(self, messages: list, user_message: str) -> str:
        conversation = [{'role': 'user', 'content': user_message}]
        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=1024,
            messages=conversation,
            extra_headers={
                'HTTP-Referer': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                'X-Title': 'MindBridge',
            },
        )
        return response.choices[0].message.content


class GroupApprovalAIService:
    def __init__(self):
        self.models = {
            'claude_sonnet': {'id': 'anthropic/claude-sonnet-4', 'weight': 0.30, 'name': 'Claude Sonnet'},
            'gpt4':          {'id': 'openai/gpt-4',              'weight': 0.25, 'name': 'GPT-4'},
            'gemini':        {'id': 'google/gemini-pro',          'weight': 0.25, 'name': 'Gemini Pro'},
            'llama3':        {'id': 'meta-llama/llama-3-70b-instruct', 'weight': 0.20, 'name': 'Llama 3'},
        }

    async def generate_questions(self, creation_reason: str) -> List[str]:
        prompt = f"""Based on this group creation reason for a mental health support community: "{creation_reason}"

Generate 3-5 specific, thoughtful questions to better understand:
1. The mental health focus and target audience
2. Safety considerations and moderation approach
3. Community value and intended outcomes

Return only the questions as a JSON array of strings."""

        try:
            service = AIService('claude_sonnet')
            response = await asyncio.to_thread(service.get_response, [], prompt)
            questions = json.loads(response)
            if isinstance(questions, list) and len(questions) >= 3:
                return questions[:5]
        except Exception:
            pass
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
        evaluation_prompt = f"""Evaluate this community group creation request for a mental health support platform:

Group Name: {group_name}
Description: {description}
Creation Reason: {creation_reason}

Questions and Answers:
{qa_pairs}

Respond ONLY with JSON: {{"mental_health_score": 0-100, "safety_score": 0-100, "community_value_score": 0-100, "user_qualification_score": 0-100, "overall_score": 0-100, "reasoning": "string", "approval": true/false}}"""

        tasks = [
            self._evaluate_with_model(key, cfg, evaluation_prompt)
            for key, cfg in self.models.items()
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        valid_scores = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                continue
            cfg = list(self.models.values())[i]
            try:
                evaluation = json.loads(result)
                if 'overall_score' in evaluation:
                    valid_scores.append({
                        'model': cfg['name'],
                        'score': evaluation['overall_score'],
                        'weight': cfg['weight'],
                        'reasoning': evaluation.get('reasoning', ''),
                        'details': evaluation,
                    })
            except (json.JSONDecodeError, KeyError):
                continue

        total_score, total_weight = 0, 0
        for sd in valid_scores:
            total_score += sd['score'] * sd['weight']
            total_weight += sd['weight']
        final_score = int(total_score / total_weight) if total_weight > 0 else 0

        return valid_scores, final_score, self._generate_summary(valid_scores, final_score)

    async def _evaluate_with_model(self, model_key: str, model_config: Dict, prompt: str) -> str:
        try:
            service = AIService(model_key)
            return await asyncio.to_thread(service.get_response, [], prompt)
        except Exception:
            return '{"overall_score": 0, "reasoning": "Error during evaluation"}'

    def _generate_summary(self, model_scores: List[Dict], final_score: int) -> str:
        if not model_scores:
            return 'Unable to complete evaluation due to technical issues.'
        status = 'Approved' if final_score >= 80 else 'Requires Review' if final_score >= 50 else 'Rejected'
        lines = [f'AI Evaluation Summary: {status}', f'Overall Score: {final_score}/100', '', 'Individual Model Scores:']
        for sd in model_scores:
            lines.append(f'- {sd["model"]}: {sd["score"]}/100')
        return '\n'.join(lines)
