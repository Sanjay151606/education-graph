# Antigravity Prompt — Port English Proficiency Assessment into BrainGraph

You uploaded a 4-section English proficiency test (Next.js, localStorage-based, audio
recording via MediaRecorder + Web Speech TTS). It's saved as reference source at
`/reference/section-a.tsx`, `section-b.tsx`, `section-c.tsx`, `section-d.tsx` in the repo —
do not delete these; Antigravity should read them as the source of truth for exact question
content and behavior, then re-implement them properly inside BrainGraph's real stack
(React + Vite frontend, FastAPI + SQLAlchemy backend, Supabase Postgres + Storage).

This supersedes the task-type behavior described in `/docs/ANTIGRAVITY_PROMPT_ASSESSMENT.md`
for the voice-based tasks specifically: instead of live SpeechRecognition transcripts, use
the **record full audio, upload as a file, review later** approach these reference files
already implement — it's more reliable for a real spoken-assessment use case.

---

```
You are working inside the existing "BrainGraph" full-stack project (React + Vite + Tailwind
frontend, FastAPI + SQLAlchemy backend, Supabase Postgres + Storage, OpenAI-backed AI
service). Do not restart the project — extend it.

CONTEXT: READ THESE FIRST
- /reference/section-a.tsx — Section A "Reading & Listening": 18 Read-Aloud items (text shown,
  per-item countdown timer, record + upload audio) followed by 5 Listen-and-Repeat items
  (TTS plays the sentence ONCE via SpeechSynthesis, replay disabled after first play, then
  record + upload audio). Includes proctoring: mic-permission check on load, tab-switch
  detection via the Page Visibility API, warnings surfaced to the student, periodic
  localStorage progress autosave.
- /reference/section-b.tsx — Section B "Speaking": 4 topics, each with hint questions, a
  90-second silent preparation phase followed by a 60-second speaking phase, record + upload
  audio during the speaking phase only.
- /reference/section-c.tsx — Section C "Grammar": 34 multiple-choice questions across 5
  categories (Verb Forms, Tenses, Articles, Voice Change, Mixed/Prepositions/Agreement),
  untimed, answers autosaved as picked.
- /reference/section-d.tsx — Section D "Reading Comprehension via Listening": 4 passages, each
  read aloud ONCE via SpeechSynthesis (no pause/replay/rewind), questions only reveal after
  the passage finishes playing, 4 MCQ per passage (16 total).
- /docs/AI_FEATURES.md and /docs/ANTIGRAVITY_PROMPT_ASSESSMENT.md — existing Assessment
  module plan and AI feature conventions. Reconcile with this prompt (this one wins for the
  voice/audio tasks, as noted above).

GOAL
Rebuild these four sections as a real, backend-persisted BrainGraph assessment flow at
routes /assessment/section-a through /assessment/section-d, ending in a results/finish page,
using the exact question/passage/topic content from the reference files (do not alter the
text, options, or correct answers — port them verbatim into seed data).

BACKEND WORK (/backend/app)

1. Extend models.py with:
   - AssessmentSession: id, user_id, status (in_progress/completed), current_section
     (A/B/C/D), started_at, completed_at, tab_switch_count, warnings (JSON list),
     overall_score (nullable), ai_summary (nullable).
   - AssessmentItem: id, section (A/B/C/D), item_type (read_aloud / listen_repeat /
     speaking_prep / speaking_task / grammar_mcq / listening_comprehension), sequence_index,
     prompt_text (sentence/passage/topic), options (JSON, nullable — MCQ only), 
     correct_answer (nullable — MCQ only, never sent to frontend), hints (JSON, nullable —
     Section B only), time_limit_seconds (nullable), passage_group_id (nullable — groups
     Section D questions under their shared passage).
   - AssessmentResponse: id, session_id, item_id, response_type (audio / mcq_choice),
     audio_storage_path (nullable), mcq_choice (nullable), is_correct (nullable, MCQ only),
     response_time_ms (nullable), created_at.
   - Seed all 18+5 Section A items, 4 Section B topics (with hints), 34 Section C questions,
     4 Section D passages + 16 questions verbatim from the reference files, via a seed
     script run once at startup or via an Alembic/SQL seed file.

2. Add Supabase Storage integration for audio: a bucket (e.g. `assessment-audio`), private by
   default, one object per response keyed like
   `{user_id}/{session_id}/{item_id}.webm`. New endpoint
   POST /api/assessment/{session_id}/upload-audio (multipart form, item_id + audio blob) —
   uploads to Supabase Storage via the service-role key server-side (never expose that key to
   the frontend), stores the resulting path on the AssessmentResponse row, returns success.

3. New router /backend/app/routers/assessment.py:
   - POST /api/assessment/start -> creates a session, returns session_id + Section A items
     (never including correct_answer/options-with-answer for MCQ, and never the audio bucket
     path).
   - GET /api/assessment/{session_id}/section/{section} -> returns items for that section in
     sequence_index order.
   - POST /api/assessment/{session_id}/respond -> for MCQ items: body {item_id, mcq_choice,
     response_time_ms}, computes is_correct server-side, stores it, returns immediate
     correct/incorrect-free acknowledgment (don't leak the right answer back for ungraded
     display — Section C UI just shows "answer saved", matching the reference behavior).
     For audio items, this is a no-op placeholder — audio itself goes through the upload
     endpoint above; call this first to log response_time_ms/attempt metadata, then upload.
   - POST /api/assessment/{session_id}/tab-switch -> increments tab_switch_count and appends
     to warnings, called from the frontend's visibilitychange listener (mirrors the reference
     Section A behavior, but centralize it at the session level rather than per-section state
     so it persists across all four sections).
   - POST /api/assessment/{session_id}/complete -> marks completed, computes an MCQ-based
     partial score (Sections C + D are auto-gradable), leaves audio sections (A speaking
     portions + B) flagged as "pending review" since they need either manual grading or a
     Phase-2 transcription/scoring pass, and calls a new
     `ai_service.summarize_assessment_session(...)` to produce a plain-language,
     non-diagnostic summary (same constraint as ANTIGRAVITY_PROMPT_ASSESSMENT.md: never
     frame this as a clinical/medical diagnosis).
   - GET /api/assessment/{session_id}/results -> returns score breakdown, ai_summary, and
     signed/short-lived Supabase Storage URLs for the student's own recordings if they want
     to review them.
   - Register the router in main.py.

4. Extend /database/supabase_schema.sql with assessment_items, assessment_sessions,
   assessment_responses tables mirroring the models above (keep in sync), and document the
   `assessment-audio` Storage bucket + its access policy (private, readable only by the
   owning user and service role) at the top of the file.

FRONTEND WORK (/frontend/src)

1. Under src/pages/assessment/, create SectionA.jsx, SectionB.jsx, SectionC.jsx,
   SectionD.jsx, AssessmentIntro.jsx (disclaimer + mic permission check + "Start" button),
   and AssessmentResults.jsx — porting the UI/UX and logic from the four reference .tsx files
   as closely as possible, with these adaptations:
   - Replace `useRouter` from `next/navigation` with `useNavigate` from `react-router-dom`.
   - Replace all `localStorage`-only persistence with real API calls to the endpoints above
     (start session once in AssessmentIntro, fetch section items on each section's mount,
     POST responses/audio as the student progresses, POST tab-switch events, POST complete
     on the last section, render AssessmentResults from GET .../results).
   - Keep the client-side behaviors that don't need a backend round-trip exactly as-is: the
     per-item and per-phase timers, the one-time-only TTS playback gating (disable the button
     after first play, no replay), the prep-then-speak phase transition in Section B, the
     "questions hidden until passage audio finishes" gating in Section D, and the tab-switch
     Page Visibility listener (now also POSTing to the backend, not just local state).
   - Replace the ad-hoc Next.js `/api/uploadAudio` route usage with a call to
     POST /api/assessment/{session_id}/upload-audio.
   - Restyle using BrainGraph's existing Tailwind tokens (the `brain`/`focus` palette in
     tailwind.config.js and the rounded-2xl card / btn-primary/btn-secondary conventions
     already used in Tasks.jsx and StudyMaterials.jsx) instead of the reference files'
     inline blue/green/purple/orange utility classes — keep a distinct accent color per
     section for wayfinding, but define them as proper Tailwind theme extensions, not
     one-off hex/utility values.

2. Wire routes in App.jsx: /assessment (intro), /assessment/section-a, /section-b,
   /section-c, /section-d, /assessment/results — all wrapped in the existing `Private` route
   guard. Add an "Assessment" link in Navbar.jsx.

3. Add a `useAudioRecorder` hook (src/hooks/useAudioRecorder.js) wrapping
   `navigator.mediaDevices.getUserMedia` + `MediaRecorder`, exposing
   `startRecording()/stopRecording()/isRecording/audioBlob`, shared by SectionA and SectionB
   instead of duplicating the MediaRecorder logic in both files.

4. Add a `useOneTimeSpeech` hook (src/hooks/useOneTimeSpeech.js) wrapping
   SpeechSynthesisUtterance with a `played` flag that never resets for a given item, shared by
   Section A's listen-and-repeat items and Section D's passage playback.

CONSTRAINTS
- Do not change any question text, options, correct answers, topics, hints, or passages from
  the reference files — port the content verbatim into backend seed data.
- Never send `correct_answer` (Section C/D) to the frontend before a response is submitted.
- Audio upload uses the Supabase service-role key server-side only — never in frontend code
  or exposed via any API response.
- Keep the proctoring signals (mic check, tab-switch count/warnings) but do not silently
  auto-fail or lock out the student — mirror the reference behavior of just warning and
  logging, since punitive auto-actions need explicit product sign-off first.
- Follow the same "no clinical/diagnostic language" rule from
  /docs/ANTIGRAVITY_PROMPT_ASSESSMENT.md in any AI-generated summary text.
- Update /docs/AI_FEATURES.md with a new "English Proficiency Assessment" section describing
  what got built and which parts are auto-graded (Sections C, D) vs. pending-review
  (Sections A speaking items, B).

Start by proposing the SQLAlchemy models + seed data structure (confirm the item/response
schema matches all four section's needs) before writing any frontend code.
```

---

### Notes
- **Grading gap to flag for the product side**: Sections C and D are objectively auto-gradable
  (MCQ with known answers). Sections A's read-aloud/listen-repeat and all of Section B are
  **audio recordings with no automatic scoring** in the reference implementation — they just
  upload and sit there. The prompt marks these "pending review" rather than inventing a
  pronunciation/fluency scorer that wasn't asked for. If you want automatic grading there
  later (e.g. Whisper transcription + an LLM fluency/pronunciation rubric), that's a good
  Phase 2 addition worth its own prompt.
- **Proctoring is soft, not enforced** — tab-switch detection just logs and warns, exactly as
  in your reference files. If you want it to actually block/flag/invalidate a session at some
  threshold, that's a product decision the prompt deliberately leaves alone rather than
  assuming.
- Reference files are preserved unmodified in `/reference/` inside the project zip below, so
  Antigravity (or you) can diff the ported version against the original at any point.
