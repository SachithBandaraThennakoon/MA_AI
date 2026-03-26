import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_feedback(analysis):
    prompt = f"""
You are a martial arts coach.

Analyze this movement data and give short coaching advice:

{analysis}

Give:
- Clear corrections
- Simple language
- Max 1 sentences
- Max 7 words per sentence
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a professional martial arts coach."},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content