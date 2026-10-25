import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import User
from app.models_v2 import (
    KnowledgeBand,
    EngagementEvent,
    ADHDProfile,
    AIRecommendation,
    ConfusionBookmark,
    DiagnosticQuizItem
)
from app.services.ai_service import ai_service, _call_llm, client
from app.config import settings


# ==================== A. KNOWLEDGE-LEVEL CLUSTERING ====================

def evaluate_diagnostic_quiz(
    db: Session,
    user_id: uuid.UUID,
    topic_id: str,
    answers: Dict[str, str],
    topic_name: str = "General Topic"
) -> KnowledgeBand:
    """
    Grades diagnostic quiz responses and auto-assigns knowledge band:
    - Foundation: < 60%
    - On-Track: 60% - 84%
    - Advanced: >= 85%
    """
    items = db.query(DiagnosticQuizItem).filter(DiagnosticQuizItem.topic_id == topic_id).all()
    if not items:
        # Fallback if topic items not pre-seeded
        total_items = max(len(answers), 1)
        correct_count = len(answers)
        derived_topic_name = topic_name
    else:
        total_items = len(items)
        correct_count = 0
        derived_topic_name = items[0].topic_name
        for item in items:
            chosen = answers.get(item.id, "").strip()
            if chosen.lower() == item.correct_answer.strip().lower():
                correct_count += 1

    score_pct = round((correct_count / float(total_items)) * 100.0, 1)

    if score_pct < 60.0:
        band = "foundation"
    elif score_pct < 85.0:
        band = "on-track"
    else:
        band = "advanced"

    # Upsert knowledge band record
    existing = db.query(KnowledgeBand).filter(
        KnowledgeBand.user_id == user_id,
        KnowledgeBand.topic_id == topic_id
    ).first()

    if existing:
        existing.band = band
        existing.score = score_pct
        existing.assigned_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_band = KnowledgeBand(
            user_id=user_id,
            topic_id=topic_id,
            topic_name=derived_topic_name,
            band=band,
            score=score_pct,
            assigned_at=datetime.utcnow()
        )
        db.add(new_band)
        db.commit()
        db.refresh(new_band)
        return new_band


def get_banded_study_material(
    db: Session,
    user_id: uuid.UUID,
    topic_id: str,
    original_text: str,
    topic_name: str = ""
) -> Dict[str, Any]:
    """
    Adapts depth and pacing of study material based on the student's assigned knowledge band.
    Calls existing ai_service.simplify_study_material with depth parameters.
    """
    band_record = db.query(KnowledgeBand).filter(
        KnowledgeBand.user_id == user_id,
        KnowledgeBand.topic_id == topic_id
    ).first()

    band = band_record.band if band_record else "on-track"

    if band == "foundation":
        depth_level = "very_simple_step_by_step"
        system_instruction = (
            "You are an empathetic ADHD learning specialist. Rewrite this material for a student at the FOUNDATION band. "
            "Use ultra-concise sentences, step-by-step sequential bullet points, bold key terms, and visual metaphors. "
            "Produce 5-7 bite-sized summary bullets and 4 fundamental flashcards. "
            "Respond ONLY as JSON: {simplified_text, summary_bullets: [], flashcards: [{q,a}]}"
        )
    elif band == "advanced":
        depth_level = "deep_dive_analytical"
        system_instruction = (
            "You are an advanced academic mentor. Rewrite this material for an ADVANCED band student. "
            "Provide rigorous conceptual depth, underlying mechanisms, real-world applications, and higher-order synthesis. "
            "Include 6-8 deep takeaway bullets, 5 challenge flashcards, and 2 open-ended extension questions. "
            "Respond ONLY as JSON: {simplified_text, summary_bullets: [], flashcards: [{q,a}], challenge_questions: []}"
        )
    else: # on-track
        depth_level = "standard_balanced"
        system_instruction = (
            "You are an ADHD learning coach. Rewrite this study material for an ON-TRACK student. "
            "Provide a balanced, highly engaging summary with clear explanations, 6 high-impact bullets, and 5 active recall flashcards. "
            "Respond ONLY as JSON: {simplified_text, summary_bullets: [], flashcards: [{q,a}]}"
        )

    # Call LLM or provide structured fallback if no OpenAI key
    if client is None or not settings.openai_api_key:
        fallback_bullets = [
            f"Key concept 1 ({band.upper()} band): Core principles tailored to your pacing.",
            f"Key concept 2: Essential structural relationships and mechanics.",
            f"Key concept 3: Practical applications and memory aids."
        ]
        fallback_cards = [
            {"q": f"What is the main idea of {topic_name or topic_id}?", "a": "The fundamental concept governing this subject area."},
            {"q": "How can you apply this concept?", "a": "By breaking it into concrete steps."}
        ]
        return {
            "topic_id": topic_id,
            "topic_name": topic_name or topic_id,
            "band": band,
            "depth_level": depth_level,
            "simplified_text": f"[{band.upper()} BAND ADAPTATION]\n\n" + (original_text[:500] if original_text else "Study content tailored to your knowledge level."),
            "summary_bullets": fallback_bullets,
            "flashcards": fallback_cards,
            "challenge_questions": ["Explain how this principle connects to higher-level systems."] if band == "advanced" else None
        }

    try:
        raw = _call_llm(system_instruction, f"Topic: {topic_name or topic_id}\n\nContent:\n{original_text}")
        parsed = json.loads(raw)
        return {
            "topic_id": topic_id,
            "topic_name": topic_name or topic_id,
            "band": band,
            "depth_level": depth_level,
            "simplified_text": parsed.get("simplified_text", original_text),
            "summary_bullets": parsed.get("summary_bullets", []),
            "flashcards": parsed.get("flashcards", []),
            "challenge_questions": parsed.get("challenge_questions")
        }
    except Exception:
        # Fallback to existing simplifier
        res = ai_service.simplify_study_material(original_text, reading_level=band)
        return {
            "topic_id": topic_id,
            "topic_name": topic_name or topic_id,
            "band": band,
            "depth_level": depth_level,
            "simplified_text": res.get("simplified_text", original_text),
            "summary_bullets": res.get("summary_bullets", []),
            "flashcards": res.get("flashcards", []),
            "challenge_questions": None
        }


# ==================== C. POST-CLASS PERSONALIZED FOLLOW-UP ====================

def generate_followup(db: Session, user_id: uuid.UUID, session_id: str) -> AIRecommendation:
    """
    Generates personalized post-class follow-up:
    - If student was flagged mild_confusion/lost or added confusion bookmarks: generates simplified recap.
    - If student remained focused: generates extension/challenge item.
    Stores result in ai_recommendations with subtype 'recap' or 'challenge'.
    """
    # 1. Fetch student's events for this session
    events = db.query(EngagementEvent).filter(
        EngagementEvent.user_id == user_id,
        EngagementEvent.session_id == session_id
    ).all()

    # 2. Fetch student's bookmarks for this session
    bookmarks = db.query(ConfusionBookmark).filter(
        ConfusionBookmark.user_id == user_id,
        ConfusionBookmark.session_id == session_id
    ).all()

    confusion_events = [e for e in events if e.state in ("mild_confusion", "lost", "disengaged")]
    has_struggled = len(confusion_events) >= 2 or len(bookmarks) > 0

    if has_struggled:
        subtype = "recap"
        title = f"Personalized Post-Class Recap ({session_id})"
        bookmark_notes = [b.note for b in bookmarks if b.note]
        topics = list(set([b.topic_or_slide for b in bookmarks] + ["Lecture Topic"]))
        
        prompt_text = f"The student encountered confusion during lecture {session_id} on: {', '.join(topics)}. "
        if bookmark_notes:
            prompt_text += f"Student bookmarks note: {'; '.join(bookmark_notes)}. "

        if client and settings.openai_api_key:
            try:
                system = (
                    "You are a friendly ADHD study coach. Generate a 2-minute crystal-clear post-lecture RECAP for a student "
                    "who got slightly lost during a fast-paced live session. "
                    "Format in short, conversational bullet points, explain the core tricky concept simply, and provide 2 confidence-builder check questions. "
                    "Respond ONLY as JSON: {summary: string, simplified_takeaways: [], check_questions: [{q,a}]}"
                )
                raw = _call_llm(system, prompt_text)
                content = json.loads(raw)
            except Exception:
                content = {
                    "summary": "Here is a quick, bite-sized recap to clarify key points from today's live lecture.",
                    "simplified_takeaways": [
                        "Revisit the core definition in simple terms.",
                        "Break the multi-step problem into 2 easy stages.",
                        "Remember: asking questions or reviewing the recap reinforces your long-term memory."
                    ],
                    "check_questions": [{"q": "What is the primary takeaway?", "a": "Mastering the foundational principle."}]
                }
        else:
            content = {
                "summary": "Here is a quick, bite-sized recap to clarify key points from today's live lecture.",
                "simplified_takeaways": [
                    "Revisit the core concept in simple terms without information overload.",
                    "Break the complex problem into 2 easy sequential stages.",
                    "Your bookmarks have been saved for easy revision."
                ],
                "check_questions": [{"q": "What was the pivotal concept?", "a": "The core theorem introduced in section 2."}]
            }
    else:
        subtype = "challenge"
        title = f"Extension & Deep-Dive Challenge ({session_id})"
        if client and settings.openai_api_key:
            try:
                system = (
                    "You are an academic mentor. The student demonstrated sustained focus throughout the live session. "
                    "Generate an exciting extension CHALLENGE with 2 real-world synthesis questions and 1 intriguing rabbit-hole concept to explore. "
                    "Respond ONLY as JSON: {intro: string, challenge_tasks: [], exploration_idea: string}"
                )
                raw = _call_llm(system, f"Student mastered the live session {session_id}.")
                content = json.loads(raw)
            except Exception:
                content = {
                    "intro": "Great focus during today's session! Here is an extension challenge to stretch your mastery.",
                    "challenge_tasks": [
                        "How would you apply this principle if the boundary conditions were inverted?",
                        "Design a real-world scenario that combines this topic with an adjacent domain."
                    ],
                    "exploration_idea": "Investigate how contemporary research extends this foundational theory."
                }
        else:
            content = {
                "intro": "Great focus during today's session! Here is an extension challenge to stretch your mastery.",
                "challenge_tasks": [
                    "How would you apply this principle under inverted or extreme conditions?",
                    "Synthesize a real-world application connecting this to modern industry."
                ],
                "exploration_idea": "Explore recent publications extending this foundational model."
            }

    rec = AIRecommendation(
        user_id=user_id,
        session_id=session_id,
        type="followup",
        subtype=subtype,
        title=title,
        content=content,
        created_at=datetime.utcnow()
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


# ==================== D. ADHD FOCUS PATTERN ANALYSIS ====================

def analyze_focus_pattern(db: Session, user_id: uuid.UUID) -> ADHDProfile:
    """
    Analyzes historical engagement events for a student to compute personalized
    optimal focus span and break timing.
    Never compares against class average — strictly based on student's own trajectory.
    """
    # Fetch recent engagement events for this user (up to 200 events)
    events = db.query(EngagementEvent).filter(
        EngagementEvent.user_id == user_id
    ).order_by(EngagementEvent.timestamp.desc()).limit(200).all()

    profile = db.query(ADHDProfile).filter(ADHDProfile.user_id == user_id).first()
    if not profile:
        profile = ADHDProfile(
            user_id=user_id,
            focus_span_avg_minutes=18,
            preferred_break_interval=20,
            reduced_stimulation_enabled=False,
            chunking_preference="small",
            updated_at=datetime.utcnow()
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    if not events:
        return profile

    # Compute streak of 'focused' states before first 'disengaged' or 'mild_confusion'
    focus_intervals = []
    current_streak_seconds = 0

    for e in reversed(events):
        if e.state == "focused":
            current_streak_seconds += 10 # approximate 10s per tick
        else:
            if current_streak_seconds >= 60:
                focus_intervals.append(current_streak_seconds / 60.0)
            current_streak_seconds = 0

    if current_streak_seconds >= 60:
        focus_intervals.append(current_streak_seconds / 60.0)

    if focus_intervals:
        avg_span = round(sum(focus_intervals) / len(focus_intervals))
        # Clamp to realistic ADHD focus windows (10 to 45 mins)
        clamped_span = max(10, min(45, avg_span))
        profile.focus_span_avg_minutes = clamped_span
        profile.preferred_break_interval = max(10, clamped_span + 2)

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


def chunk_live_lecture_transcript(transcript_snippet: str, topic: str = "Lecture") -> Dict[str, Any]:
    """
    Auto-chunks a ~30 second transcription feed into 3-4 bullet points
    so a student who briefly lost focus can catch up instantly.
    """
    if client and settings.openai_api_key:
        try:
            system = (
                "You are an ADHD live note summarizer. Convert this raw 30-second live speech transcript snippet "
                "into 3 concise, easy-to-read bullet points and 1 one-liner takeaway. "
                "Respond ONLY as JSON: {key_points: [str, str, str], takeaway_one_liner: str}"
            )
            raw = _call_llm(system, f"Topic: {topic}\n\nTranscript snippet:\n{transcript_snippet}")
            parsed = json.loads(raw)
            return {
                "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
                "key_points": parsed.get("key_points", [transcript_snippet[:120]]),
                "takeaway_one_liner": parsed.get("takeaway_one_liner", "Core lecture point summarized.")
            }
        except Exception:
            pass

    # Heuristic fallback
    sentences = [s.strip() for s in transcript_snippet.replace("\n", " ").split(".") if len(s.strip()) > 10]
    bullets = sentences[:3] if sentences else ["Key concept discussed by teacher.", "Important mechanism demonstrated on board."]
    return {
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "key_points": bullets,
        "takeaway_one_liner": sentences[0] if sentences else "Live lecture points summarized in real-time."
    }
