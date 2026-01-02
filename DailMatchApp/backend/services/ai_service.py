import requests
from typing import Dict, List, Optional


class DailyMatchAI:
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama2:7b-chat-q4_0"):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def is_available(self) -> bool:
        
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return r.status_code == 200
        except Exception:
            return False

    def _generate(self, prompt: str, system: str = "", max_tokens: int = 300) -> Optional[str]:
        """Low-level wrapper around Ollama's /api/generate endpoint."""
        try:
            r = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "system": system,
                    "stream": False,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": 0.7
                    }
                },
                timeout=30
            )
            if r.status_code == 200:
                data = r.json()
                return data.get("response", "").strip()
        except Exception as e:
            print(f"AI error: {e}")
        return None

    # ---------------------------------------------------------
    # Profile answer improvement
    # ---------------------------------------------------------

    def improve_prompt_answer(self, question: str, draft_answer: str) -> str:
        """
        Improve a dating profile answer.

        If AI not available, returns the original draft.
        """
        if not self.is_available():
            return draft_answer

        system = "You are a dating profile coach. Improve answers so they sound authentic, specific, and attractive, but not fake."
        prompt = f"""
Question: {question}

Original answer:
\"\"\"{draft_answer}\"\"\"

Instructions:
- Keep the same meaning
- Make it a bit more vivid and specific
- 1-3 sentences
- Keep it honest, no invented facts

Improved answer:
"""

        response = self._generate(prompt, system=system, max_tokens=120)
        if response and len(response) > 10:
            return response.strip().strip('"')
        return draft_answer

    # ---------------------------------------------------------
    # Ice-breaker generation
    # ---------------------------------------------------------

    def generate_icebreakers(
        self,
        my_profile: Dict,
        their_profile: Dict,
        count: int = 3
    ) -> List[str]:
        """
        Generate ice-breaker messages for starting a chat with their_profile,
        from the perspective of my_profile.
        """

        # Fallback if no AI
        if not self.is_available():
            name = their_profile.get("name", "there")
            return [
                f"Hey {name}! Your profile really stood out to me—how's your week going?",
                f"Hi {name}, I saw you're into {', '.join(their_profile.get('interests', [])[:1]) or 'interesting things'}. What got you into that?",
                f"Hey {name}, if we grabbed coffee tomorrow, what would you be most excited to talk about?"
            ][:count]

        # Prepare context
        my_name = my_profile.get("name", "I")
        their_name = their_profile.get("name", "you")
        my_interests = my_profile.get("interests", [])
        their_interests = their_profile.get("interests", [])

        my_prompts = my_profile.get("prompts", [])
        their_prompts = their_profile.get("prompts", [])

        system = (
            "You are an expert at starting natural, engaging conversations on dating apps. "
            "You write short, friendly, non-cringey openers that show you actually read their profile."
        )

        prompt = f"""
You are helping {my_name} send the first message to {their_name} on a dating app.

My profile:
- Name: {my_name}
- Interests: {', '.join(my_interests)}
- Prompts: {my_prompts}

Their profile:
- Name: {their_name}
- Interests: {', '.join(their_interests)}
- Prompts: {their_prompts}

Generate {count} different first messages that:
- Are 1-2 sentences each
- Reference something specific from their profile (interests or prompts)
- Sound casual and confident
- Ask a simple, easy-to-answer question
- Don't use emojis, unless it fits very naturally

Return ONLY the messages, one per line, no numbering, no extra text.
"""

        response = self._generate(prompt, system=system, max_tokens=200)
        if not response:
            return self.generate_icebreakers(my_profile, their_profile, count)  # fallback

        # Split lines, clean up
        lines = [line.strip() for line in response.split("\n") if line.strip()]
        # Remove numbering if model added it
        cleaned = []
        for line in lines:
            # Remove "1. ", "- ", etc.
            if line[0].isdigit() and (line[1:3] == ". " or line[1] == ')'):
                line = line.split(' ', 1)[1]
            if line.startswith("- "):
                line = line[2:]
            cleaned.append(line.strip('"'))

        # Ensure we return at most `count`
        if not cleaned:
            return self.generate_icebreakers(my_profile, their_profile, count)
        return cleaned[:count]
        