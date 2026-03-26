from openai import OpenAI
from utils.config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)


def generate_feedback(analysis):
    prompt = f"""
You are a martial arts coach.

Based on the movement analysis below, give short and clear coaching feedback.

Analysis:
{analysis}

Rules:
- Be concise
- Give actionable advice
- Mention body parts
- Encourage improvement
- Focus on the most critical issues
- max 8 words per feedback point
- Provide 3 feedback points at most with good and bad points
- list feedback points with emojis (e.g. "👊", "🦵", "💪")
- bulet point format
- each point add new line
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert martial arts coach."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5
    )

    return response.choices[0].message.content