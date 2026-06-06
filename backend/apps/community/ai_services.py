import json
import asyncio
from typing import Dict, List, Tuple
from apps.ai_assistant.services import AIService


class GroupApprovalAIService:
    """AI service for evaluating community group creation requests."""
    
    def __init__(self):
        self.models = {
            'claude_sonnet': {
                'id': 'anthropic/claude-sonnet-4',
                'weight': 0.30,
                'name': 'Claude Sonnet'
            },
            'gpt4': {
                'id': 'openai/gpt-4',
                'weight': 0.25,
                'name': 'GPT-4'
            },
            'gemini': {
                'id': 'google/gemini-pro',
                'weight': 0.25,
                'name': 'Gemini Pro'
            },
            'llama3': {
                'id': 'meta-llama/llama-3-70b-instruct',
                'weight': 0.20,
                'name': 'Llama 3'
            }
        }
    
    async def generate_questions(self, creation_reason: str) -> List[str]:
        """Generate tailored questions based on the user's creation reason."""
        prompt = f"""
Based on this group creation reason for a mental health support community: "{creation_reason}"

Generate 3-5 specific, thoughtful questions to better understand:
1. The mental health focus and target audience
2. Safety considerations and moderation approach
3. Community value and intended outcomes
4. User's experience with the topic
5. Specific support methods or approaches

Return only the questions as a JSON array of strings. Each question should be clear, concise, and help evaluate the appropriateness of this community group.

Example format: ["What specific mental health topics will this group focus on?", "How will you ensure member safety and appropriate discussions?"]
"""
        
        try:
            service = AIService('claude_sonnet')
            response = await asyncio.to_thread(service.get_response, [], prompt)
            
            # Parse the JSON response
            questions = json.loads(response)
            if isinstance(questions, list) and len(questions) >= 3:
                return questions[:5]  # Limit to 5 questions
            else:
                # Fallback questions if parsing fails
                return [
                    "What specific mental health topics will this group focus on?",
                    "How will you ensure member safety and appropriate discussions?",
                    "What experience do you have with this mental health topic?",
                    "What kind of support do you hope members will receive?",
                    "How will you moderate discussions to keep them supportive?"
                ]
        except Exception as e:
            # Log error and return fallback questions
            print(f"Error generating questions: {e}")
            return [
                "What specific mental health topics will this group focus on?",
                "How will you ensure member safety and appropriate discussions?",
                "What experience do you have with this mental health topic?",
                "What kind of support do you hope members will receive?",
                "How will you moderate discussions to keep them supportive?"
            ]
    
    async def evaluate_group_request(
        self, 
        group_name: str,
        description: str,
        creation_reason: str,
        questions: List[str],
        answers: List[str]
    ) -> Tuple[List[Dict], int, str]:
        """Evaluate group request using multiple AI models."""
        
        # Prepare evaluation context
        qa_pairs = []
        for q, a in zip(questions, answers):
            qa_pairs.append(f"Q: {q}\nA: {a}")
        
        qa_context = "\n\n".join(qa_pairs)
        
        evaluation_prompt = f"""
Evaluate this community group creation request for a mental health support platform:

Group Name: {group_name}
Description: {description}
Creation Reason: {creation_reason}

Questions and Answers:
{qa_context}

Please evaluate this request based on:
1. Mental Health Appropriateness (0-100): Is this suitable for mental health support?
2. Safety Considerations (0-100): Are there adequate safety measures?
3. Community Value (0-100): Does this provide genuine value to members?
4. User Qualification (0-100): Does the creator seem qualified?

Provide your response in this exact JSON format:
{{
    "mental_health_score": <score>,
    "safety_score": <score>,
    "community_value_score": <score>,
    "user_qualification_score": <score>,
    "overall_score": <average>,
    "reasoning": "<brief explanation of your evaluation>",
    "approval": true/false
}}

Be thorough but fair. Focus on the potential for positive mental health support and community building.
"""
        
        # Evaluate with each model
        tasks = []
        
        for model_key, model_config in self.models.items():
            task = self._evaluate_with_model(model_key, model_config, evaluation_prompt)
            tasks.append(task)
        
        # Run evaluations concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        valid_scores = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"Error with model {list(self.models.keys())[i]}: {result}")
                continue
            
            model_key = list(self.models.keys())[i]
            model_config = self.models[model_key]
            
            try:
                evaluation = json.loads(result)
                if 'overall_score' in evaluation:
                    valid_scores.append({
                        'model': model_config['name'],
                        'score': evaluation['overall_score'],
                        'weight': model_config['weight'],
                        'reasoning': evaluation.get('reasoning', ''),
                        'details': evaluation
                    })
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Error parsing result from {model_config['name']}: {e}")
                continue
        
        # Calculate weighted score
        total_score = 0
        total_weight = 0
        
        for score_data in valid_scores:
            total_score += score_data['score'] * score_data['weight']
            total_weight += score_data['weight']
        
        if total_weight > 0:
            final_score = int(total_score / total_weight)
        else:
            final_score = 0
        
        # Generate summary
        summary = self._generate_summary(valid_scores, final_score)
        
        return valid_scores, final_score, summary
    
    async def _evaluate_with_model(self, model_key: str, model_config: Dict, prompt: str) -> str:
        """Evaluate with a specific AI model."""
        try:
            service = AIService(model_key)
            response = await asyncio.to_thread(service.get_response, [], prompt)
            return response
        except Exception as e:
            print(f"Error with {model_config['name']}: {e}")
            return '{"overall_score": 0, "reasoning": "Error during evaluation"}'
    
    def _generate_summary(self, model_scores: List[Dict], final_score: int) -> str:
        """Generate a summary of the AI evaluation."""
        if not model_scores:
            return "Unable to complete evaluation due to technical issues."
        
        approval_status = "Approved" if final_score >= 80 else "Requires Review" if final_score >= 50 else "Rejected"
        
        summary_parts = [
            f"AI Evaluation Summary: {approval_status}",
            f"Overall Score: {final_score}/100",
            "",
            "Individual Model Scores:"
        ]
        
        for score_data in model_scores:
            summary_parts.append(
                f"- {score_data['model']}: {score_data['score']}/100"
            )
        
        summary_parts.append("")
        
        # Add key reasoning points
        all_reasoning = []
        for score_data in model_scores:
            if score_data.get('reasoning'):
                all_reasoning.append(score_data['reasoning'])
        
        if all_reasoning:
            summary_parts.append("Key Considerations:")
            # Take first 2 reasoning points to keep it concise
            for reasoning in all_reasoning[:2]:
                if len(reasoning) > 100:
                    reasoning = reasoning[:100] + "..."
                summary_parts.append(f"- {reasoning}")
        
        return "\n".join(summary_parts)
