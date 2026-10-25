# Antigravity Prompt — BrainGraph: Assessment Module

Paste this into Antigravity with the BrainGraph repo open as the workspace. It adds a new
**Assessment** feature on top of the existing scaffold: a short ADHD-style cognitive check-in
with three task types — one-time voice-and-speak, one-time read-and-speak, and timed answers.

---

```
You are working inside the existing "BrainGraph" full-stack project (React + Vite + Tailwind
frontend, FastAPI + SQLAlchemy backend, Supabase/Postgres database, OpenAI-backed AI service).
Do not restart the project — extend it. Read /docs/AI_FEATURES.md and
/backend/app/services/ai_service.py first so new AI calls follow the same pattern (JSON-mode
responses, server-side only, never expose API keys to the frontend).

GOAL
Add an "Assessment" section: a short, gamified cognitive check-in for ADHD students made of
three task types, used to calibrate their learning profile (focus_span_minutes,
preferred_content_style, difficulty_level on the `users` table).

TASK TYPES TO IMPLEMENT

1. One-time voice and speak
   - The app speaks a short phrase/instruction aloud via text-to-speech (Web Speech API
     `SpeechSynthesisUtterance` on the frontend) exactly ONCE — the play button becomes
     permanently disabled after first use, no replay allowed.
   - The student then repeats it back by speaking; capture via the Web Speech API
     `SpeechRecognition` / `webkitSpeechRecognition`, convert to text client-side.
   - Tests auditory working memory.

2. One-time read and speak
   - A short sentence/word list is displayed on screen for a fixed window (e.g. 5–8 seconds,
     configurable per item) and then hidden — cannot be redisplayed.
   - The student then recalls it out loud; capture via SpeechRecognition same as above.
   - Tests visual working memory.

3. Timed answer
   - A question (multiple choice or short text) is shown with a visible countdown (e.g.
     10–20 seconds depending on item difficulty).
   - Record elapsed response time in milliseconds and whether it was answered before time
     ran out; auto-submit (empty/blank) if the timer hits zero.
   - Tests processing speed / response latency under mild time pressure.

An "Assessment" is a short session (e.g. 6–10 items) mixing all three task types back to back,
ending in an AI-generated summary.

BACKEND WORK (/backend/app)

1. Add models to models.py (keep supabase_schema.sql in sync — see step 4):
   - AssessmentItem: id, item_type (enum: voice_speak_once / read_speak_once / timed_answer),
     prompt_text, correct_answer (nullable), options (JSON, nullable, for MCQ timed items),
     display_seconds (for read_speak_once), time_limit_seconds (for timed_answer),
     difficulty (easy/medium/hard). This is a static content bank, not user-specific — seed
     8-12 items covering all three types via a seed script or startup fixture.
   - AssessmentSession: id, user_id (FK), started_at, completed_at (nullable),
     status (in_progress/completed), overall_score (float, nullable),
     ai_summary (text, nullable).
   - AssessmentResponse: id, session_id (FK), item_id (FK), user_answer_text,
     response_time_ms, is_correct (bool, nullable), similarity_score (float, nullable —
     for the two speech-based types, since exact string match is too strict).

2. Add Pydantic schemas in schemas.py: AssessmentItemOut (never includes correct_answer),
   AssessmentResponseCreate, AssessmentResponseOut, AssessmentSessionOut,
   AssessmentSummaryOut (score breakdown by task type + ai_summary + recommended profile
   updates).

3. New router /backend/app/routers/assessment.py:
   - POST /api/assessment/start -> creates a session, returns session_id + ordered list of
     items (item content only, never correct_answer) drawn from the seeded bank.
   - POST /api/assessment/{session_id}/respond -> body: item_id, user_answer_text,
     response_time_ms. For voice_speak_once/read_speak_once, compute similarity_score
     against correct_answer (simple normalized token-overlap or difflib.SequenceMatcher
     ratio is fine — no AI call needed per-item, keep this fast/synchronous). For
     timed_answer, compute is_correct via exact/case-insensitive match or option match.
     Store the response, return immediate feedback (correct/similarity + response_time_ms).
   - POST /api/assessment/{session_id}/complete -> marks session completed, pulls all
     responses, calls a new `ai_service.summarize_assessment(...)` function, stores
     overall_score + ai_summary, and returns AssessmentSummaryOut. Also apply the AI's
     suggested focus_span_minutes / preferred_content_style / difficulty_level back onto
     the user's profile (with the student's confirmation on the frontend before saving —
     don't silently overwrite).
   - GET /api/assessment/history -> list past sessions for the trends view.
   - Register the router in main.py like the other routers.

4. Extend /database/supabase_schema.sql with assessment_items, assessment_sessions,
   assessment_responses tables mirroring the models above, plus RLS policies consistent
   with whatever auth strategy this repo ends up using (see the note already in that file
   about the Supabase Auth vs custom-JWT mismatch — don't add new policies that assume
   auth.uid() if that mismatch hasn't been resolved yet).

5. Add `summarize_assessment(responses: list, item_bank: dict) -> dict` to
   ai_service.py, following the same JSON-mode pattern as `generate_recommendations`.
   Input: per-item type, correctness/similarity, response times. Output JSON:
   {overall_score, per_type_breakdown: {voice_speak_once, read_speak_once, timed_answer},
   ai_summary (2-3 plain-language sentences, encouraging tone, no clinical/diagnostic
   language — this is a learning-style check-in, NOT a medical ADHD diagnosis), 
   recommended_focus_span_minutes, recommended_content_style, recommended_difficulty_level}.
   IMPORTANT: the summary must never claim to diagnose ADHD or any condition — frame
   everything as "learning style" and "study pacing" observations only.

FRONTEND WORK (/frontend/src)

1. Add a `useSpeech` hook (src/hooks/useSpeech.js):
   - `speak(text)` wrapping SpeechSynthesisUtterance, resolves a promise on `onend`.
   - `startListening()` / `stopListening()` wrapping SpeechRecognition /
     webkitSpeechRecognition, exposing `transcript`, `listening` state, and graceful
     fallback messaging if the browser doesn't support the API (Safari/Firefox gaps).

2. Add three task components in src/components/assessment/:
   - VoiceSpeakOnceTask.jsx — "Play" button (auto-disables after one play via `speak()`),
     then a "Record your answer" mic button using `startListening()`, shows live transcript,
     "Submit" button.
   - ReadSpeakOnceTask.jsx — displays `prompt_text` for `display_seconds` with a visible
     shrinking progress bar, then auto-hides it and reveals the mic recorder, same
     transcript/submit flow.
   - TimedAnswerTask.jsx — shows the question (+ options if MCQ, else a text input), a
     visible countdown bar for `time_limit_seconds`, records elapsed ms from mount to
     submit/timeout, auto-submits blank on timeout.
   - All three take (item, onSubmit) props and call onSubmit({ item_id, user_answer_text,
     response_time_ms }) — keep them presentational, no direct API calls inside.

3. Add src/pages/Assessment.jsx:
   - On mount, POST /api/assessment/start, store session_id + items.
   - Render one item at a time based on `item.item_type` (switch across the three
     components above), advancing on each submit, calling POST
     /api/assessment/{session_id}/respond, and showing brief per-item feedback
     (correct/needs work) before advancing.
   - After the last item, call POST /api/assessment/{session_id}/complete and render a
     results screen: score breakdown by task type (reuse Chart.js — a simple bar chart
     fits the existing Progress.jsx pattern), the AI summary text, and a confirm/dismiss
     control before applying suggested profile changes (PATCH /api/auth/me — add this
     endpoint if it doesn't exist yet).

4. Add a route `/assessment` in App.jsx (wrapped in the existing `Private` guard) and a
   "Assessment" link in Navbar.jsx, matching the existing nav item styling.

5. Match existing visual language: rounded-2xl cards, `brain`/`focus` Tailwind palette from
   tailwind.config.js, same button/input classes already used in Tasks.jsx and
   StudyMaterials.jsx. Don't introduce new design patterns.

CONSTRAINTS
- Never claim medical/clinical diagnosis anywhere in copy, UI labels, or AI-generated text —
  this is a learning-style check-in, not an ADHD diagnostic tool. Add a short disclaimer on
  the Assessment start screen saying so.
- Speech features must degrade gracefully with a clear message (not a silent failure) on
  browsers without SpeechRecognition support.
- Keep per-item scoring (similarity/correctness) synchronous and AI-free; only the final
  session summary should call the LLM, to keep the assessment flow fast and low-cost.
- correct_answer and options must never be sent to the frontend before a response is
  submitted for that item (avoid leaking answers in the network tab).
- Update /docs/AI_FEATURES.md with a new "Assessment & Adaptive Calibration" section
  describing what you built.

Start by proposing the exact seed item bank (8-12 items across the three types with
difficulty levels) and the AssessmentSummaryOut JSON shape, then wait for confirmation
before writing code.
```

---

### Notes before you run this
- **Browser speech support**: `SpeechRecognition` is well-supported in Chrome/Edge but patchy
  in Safari and unsupported in Firefox as of last check — the prompt asks Antigravity to
  handle graceful fallback, but worth testing on your actual target browsers early.
- **No diagnosis language**: kept as a hard constraint throughout — this is framed as a
  learning-style/pacing check-in, not a clinical ADHD screener, to avoid overstating what an
  in-app quiz can responsibly claim.
- Same workspace tips as before: open the full repo root, point Antigravity at the existing
  `.env.example` files, and run backend/frontend dev servers in separate terminals so it can
  verify against real responses instead of guessing shapes.
