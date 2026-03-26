from agents.movement_agent import analyze_movement
from agents.coaching_agent import generate_feedback
from agents.voice_agent import generate_voice

def run_agents(angles, targets):
    # 1. Movement
    analysis = analyze_movement(angles, targets)

    # 2. Coaching (LLM)
    feedback = generate_feedback(analysis)

    # 3. Voice (OpenAI TTS)
    audio = generate_voice(feedback)

    return {
        "analysis": analysis,
        "feedback": feedback,
        "audio": audio
    }