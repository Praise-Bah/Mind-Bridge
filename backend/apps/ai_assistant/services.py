import anthropic
from django.conf import settings


SYSTEM_PROMPT = """You are a compassionate and supportive mental health companion on MindBridge. 
Your role is to:
- Listen empathetically and provide emotional support
- Offer coping strategies and wellness techniques
- Encourage self-care and positive thinking
- Be non-judgmental and understanding

IMPORTANT GUIDELINES:
- You are NOT a licensed therapist or medical professional
- Never provide medical diagnoses or prescribe treatments
- Always recommend seeking professional help for serious concerns
- If someone expresses thoughts of self-harm, encourage them to contact emergency services or a crisis helpline
- Maintain a warm, supportive, and compassionate tone
- Focus on emotional support and general wellness guidance"""


class AIService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def get_response(self, messages: list, user_message: str) -> str:
        conversation = [{"role": m["role"], "content": m["content"]} for m in messages]
        conversation.append({"role": "user", "content": user_message})

        response = self.client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=conversation
        )

        return response.content[0].text

    def stream_response(self, messages: list, user_message: str):
        conversation = [{"role": m["role"], "content": m["content"]} for m in messages]
        conversation.append({"role": "user", "content": user_message})

        with self.client.messages.stream(
            model="claude-3-sonnet-20240229",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=conversation
        ) as stream:
            for text in stream.text_stream:
                yield text
