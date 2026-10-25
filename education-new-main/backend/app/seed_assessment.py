from sqlalchemy.orm import Session
from .models import AssessmentItem

SEED_ITEMS = [
    {
        "id": "seed-voice-1",
        "item_type": "voice_speak_once",
        "prompt_text": "Purple rocket orbit galaxy",
        "correct_answer": "Purple rocket orbit galaxy",
        "options": None,
        "display_seconds": None,
        "time_limit_seconds": None,
        "difficulty": "easy"
    },
    {
        "id": "seed-voice-2",
        "item_type": "voice_speak_once",
        "prompt_text": "Focus on the third blue book on the wooden shelf",
        "correct_answer": "Focus on the third blue book on the wooden shelf",
        "options": None,
        "display_seconds": None,
        "time_limit_seconds": None,
        "difficulty": "medium"
    },
    {
        "id": "seed-voice-3",
        "item_type": "voice_speak_once",
        "prompt_text": "Remember the sequence: seven, north, solar, forty-two, horizon",
        "correct_answer": "seven north solar forty-two horizon",
        "options": None,
        "display_seconds": None,
        "time_limit_seconds": None,
        "difficulty": "hard"
    },
    {
        "id": "seed-read-1",
        "item_type": "read_speak_once",
        "prompt_text": "Elephant, Mountain, Lantern",
        "correct_answer": "Elephant Mountain Lantern",
        "options": None,
        "display_seconds": 6,
        "time_limit_seconds": None,
        "difficulty": "easy"
    },
    {
        "id": "seed-read-2",
        "item_type": "read_speak_once",
        "prompt_text": "The silver submarine dived beneath fifty coral reefs.",
        "correct_answer": "The silver submarine dived beneath fifty coral reefs",
        "options": None,
        "display_seconds": 7,
        "time_limit_seconds": None,
        "difficulty": "medium"
    },
    {
        "id": "seed-read-3",
        "item_type": "read_speak_once",
        "prompt_text": "Quantum computers calculate parallel trajectories through encrypted optical fibers.",
        "correct_answer": "Quantum computers calculate parallel trajectories through encrypted optical fibers",
        "options": None,
        "display_seconds": 8,
        "time_limit_seconds": None,
        "difficulty": "hard"
    },
    {
        "id": "seed-timed-1",
        "item_type": "timed_answer",
        "prompt_text": "Which planet is closest to the Sun?",
        "correct_answer": "Mercury",
        "options": ["Venus", "Mercury", "Mars", "Jupiter"],
        "display_seconds": None,
        "time_limit_seconds": 12,
        "difficulty": "easy"
    },
    {
        "id": "seed-timed-2",
        "item_type": "timed_answer",
        "prompt_text": "If a train leaves at 2:15 PM and travels for 45 minutes, what time does it arrive?",
        "correct_answer": "3:00 PM",
        "options": ["2:45 PM", "3:00 PM", "3:15 PM", "3:30 PM"],
        "display_seconds": None,
        "time_limit_seconds": 15,
        "difficulty": "medium"
    },
    {
        "id": "seed-timed-3",
        "item_type": "timed_answer",
        "prompt_text": "Identify the odd one out in this pattern: Triangle, Square, Circle, Pentagon, Hexagon",
        "correct_answer": "Circle",
        "options": ["Triangle", "Square", "Circle", "Hexagon"],
        "display_seconds": None,
        "time_limit_seconds": 12,
        "difficulty": "medium"
    },
    {
        "id": "seed-timed-4",
        "item_type": "timed_answer",
        "prompt_text": "Rearrange the letters to form a learning concept: M - E - M - O - R - Y",
        "correct_answer": "memory",
        "options": None,
        "display_seconds": None,
        "time_limit_seconds": 15,
        "difficulty": "hard"
    }
]

def seed_assessment_items(db: Session):
    """Ensures default assessment bank items exist in the database."""
    count = db.query(AssessmentItem).count()
    if count == 0:
        for item_data in SEED_ITEMS:
            item = AssessmentItem(**item_data)
            db.add(item)
        db.commit()
