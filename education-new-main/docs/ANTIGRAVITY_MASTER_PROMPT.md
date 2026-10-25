# Antigravity Master Prompt — BrainGraph Full Build

This consolidates everything discussed for BrainGraph into one sequenced prompt: the base
scaffold gaps, the Supabase-Auth + Google + forgot-password migration, and the English
Proficiency Assessment port. Phases are ordered by dependency — auth first, since the
assessment tables key off `user_id`, then the scaffold gaps, then the assessment port.

Give Antigravity the whole thing at once, or paste one phase at a time if you'd rather review
each before moving on — either works, since each phase says what it depends on.

---

```
You are working inside the existing "BrainGraph" full-stack project — an AI-powered
education platform for students with ADHD. Stack: React + Vite + Tailwind frontend
(react-router-dom, axios, Chart.js), FastAPI + SQLAlchemy backend, Supabase Postgres +
Storage, OpenAI-backed AI service in /backend/app/services/ai_service.py. Do not restart the
project structure — extend what's there. Reference source files for the assessment content
live in /reference/section-a.tsx through section-d.tsx — read them before Phase 3.

Work through the phases below IN ORDER. Confirm your plan for each phase before writing code
for it, since later phases depend on earlier ones (Phase 3's assessment tables key off the
`user_id` shape Phase 1 establishes).

================================================================================
PHASE 1 — AUTH: SUPABASE AUTH MIGRATION, GOOGLE SIGN-IN, FORGOT PASSWORD
================================================================================
Read /backend/app/auth.py, /frontend/src/context/AuthContext.jsx, and
/database/supabase_schema.sql first.

Currently FastAPI issues its own JWTs and stores hashed passwords locally. Migrate this to
Supabase Auth entirely — it natively handles email/password, password-reset emails, and
Google OAuth, and this also resolves the RLS-policy mismatch already flagged in
supabase_schema.sql (those policies assume `auth.uid()` but nothing populates it under the
old scheme).

Backend:
1. Remove custom JWT issuance and local password hashing from auth.py. Add a
   `get_current_user` dependency that verifies the Supabase-issued JWT from the
   `Authorization: Bearer <token>` header (using the Supabase JWT secret) and extracts the
   Supabase user id + email. On first sight of a given Supabase user id, upsert a `users` row
   (id = Supabase auth user id, email, full_name from token metadata, default ADHD profile
   fields) so existing foreign keys (tasks, materials, progress_logs, etc.) keep working.
2. Drop `hashed_password` from the User model; `users.id` now equals the Supabase Auth user
   id instead of being independently generated.
3. Simplify routers/auth.py to GET /api/auth/me (existing profile fetch, now backed by
   Supabase-verified auth) and PATCH /api/auth/me (update focus_span_minutes,
   preferred_content_style, difficulty_level, reminders_enabled — add if missing). Remove
   /api/auth/register and /api/auth/login — those now happen client-side via the Supabase SDK.
4. Update supabase_schema.sql: drop `hashed_password`, make `users.id` reference
   `auth.users(id)`, rewrite RLS policies to use `auth.uid() = user_id` (now that it's
   actually true), and remove the old placeholder caveat comment.

Frontend:
5. Add src/api/supabaseClient.js using @supabase/supabase-js with
   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (already in .env.example).
6. Rewrite context/AuthContext.jsx around Supabase Auth: getSession() + onAuthStateChange on
   mount; login() -> signInWithPassword; register() -> signUp (pass full_name in
   options.data); loginWithGoogle() -> signInWithOAuth({ provider: 'google', options: {
   redirectTo: origin + '/dashboard' } }); requestPasswordReset(email) ->
   resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' });
   updatePassword(newPassword) -> updateUser({ password }); logout() -> signOut().
7. Update src/api/client.js to attach the Supabase session's access_token as the Bearer
   token on every request, replacing the old localStorage token lookup.
8. Redesign src/pages/Login.jsx: email/password fields, a "Forgot password?" link to
   /forgot-password, a divider, then a "Continue with Google" button (standard Google
   brand-guideline styling — don't recolor the G logo), keep the "Sign up" link, surface
   Supabase auth errors inline.
9. Add src/pages/ForgotPassword.jsx: email field + "Send reset link" button calling
   requestPasswordReset; show the same generic confirmation message regardless of whether
   the email is registered (don't leak account existence).
10. Add src/pages/ResetPassword.jsx: the redirectTo target from the reset email; wait for the
    PASSWORD_RECOVERY auth event before showing new-password + confirm fields; call
    updatePassword then redirect to /dashboard; show a friendly expired-link message if no
    valid recovery session is present.
11. Add public routes /forgot-password and /reset-password in App.jsx (not behind the
    Private guard). Match existing card/input/button styling throughout — no new design
    patterns.

Manual configuration this phase depends on (call these out in your response, don't try to
script them): enabling Google as a provider in the Supabase dashboard with a Google Cloud
OAuth Client ID/Secret, authorized redirect URI
`https://<project-ref>.supabase.co/auth/v1/callback` in Google Cloud, and allowlisting the
app's URLs (dev + prod) under Supabase's Authentication > URL Configuration.

Constraints: never store/transmit raw passwords in FastAPI; every existing endpoint using
`Depends(auth.get_current_user)` keeps its signature, only the dependency's internals change;
update backend/.env.example and frontend/.env.example for any new vars (e.g.
SUPABASE_JWT_SECRET); add a short /docs/AUTH.md noting the migration and the Google setup
dependency.

================================================================================
PHASE 2 — SCAFFOLD GAPS FROM THE ORIGINAL BUILD
================================================================================
Depends on Phase 1 (all endpoints below assume Supabase-verified auth).

1. Wire up the `focus_sessions` table properly: a router to create a session on Start, update
   it on Pause/Reset with actual_minutes + distractions_logged, call the existing
   distraction-risk feedback logic, and surface the resulting risk_label back to the
   FocusMode page as a toast/banner (currently the timer is client-side only and doesn't
   persist).
2. Add flashcard review mode to StudyMaterials.jsx: flip-card UI cycling through
   `material.flashcards`, a simple "easy/hard" self-rating that reorders harder cards sooner
   (spaced-repetition-lite, no need for a full SM-2 implementation).
3. Add input validation and inline error toasts across the Tasks, Study Materials, and
   Register forms — currently failures largely fail silently.
4. Add loading skeletons instead of blank states on Dashboard, Tasks, and Progress while data
   is in flight.
5. Write a minimal test suite: pytest for the FastAPI routers (task CRUD + auth dependency at
   minimum) and a couple of React Testing Library tests for the Login and Tasks pages.
6. Update /docs/AI_FEATURES.md if any of the above touches an AI-powered feature's behavior.

================================================================================
PHASE 3 — ENGLISH PROFICIENCY ASSESSMENT (READING, LISTENING, SPEAKING, GRAMMAR)
================================================================================
Depends on Phase 1 (assessment rows key off the Supabase-Auth `user_id`).

Read /reference/section-a.tsx through section-d.tsx in full before starting — they are a
working Next.js + localStorage prototype of this exact feature and are the source of truth
for question/passage/topic content. Port their behavior into BrainGraph's real stack; do not
alter any question text, options, correct answers, topics, hints, or passages.

- Section A "Reading & Listening": 18 Read-Aloud items (timed, record+upload audio) + 5
  Listen-and-Repeat items (TTS plays once via SpeechSynthesis, replay permanently disabled
  after first play, then record+upload audio). Includes proctoring: mic-permission check on
  load, tab-switch detection via the Page Visibility API with warnings, periodic autosave.
- Section B "Speaking": 4 topics with hint questions, 90s silent prep phase -> 60s speaking
  phase, record+upload audio during the speaking phase only.
- Section C "Grammar": 34 MCQ across 5 categories (Verb Forms, Tenses, Articles, Voice
  Change, Mixed), untimed, autosaved as answered.
- Section D "Reading Comprehension via Listening": 4 passages read aloud ONCE via
  SpeechSynthesis (no replay), questions reveal only after the passage finishes, 4 MCQ per
  passage (16 total).

Backend:
1. Add models: AssessmentSession (id, user_id, status, current_section, started_at,
   completed_at, tab_switch_count, warnings JSON, overall_score, ai_summary);
   AssessmentItem (id, section A/B/C/D, item_type, sequence_index, prompt_text, options JSON
   nullable, correct_answer nullable — never sent to frontend, hints JSON nullable,
   time_limit_seconds nullable, passage_group_id nullable for Section D grouping);
   AssessmentResponse (id, session_id, item_id, response_type audio/mcq_choice,
   audio_storage_path nullable, mcq_choice nullable, is_correct nullable,
   response_time_ms nullable, created_at). Seed all 18+5 Section A items, 4 Section B topics,
   34 Section C questions, and 4 Section D passages + 16 questions verbatim from the
   reference files.
2. Add a private Supabase Storage bucket (e.g. `assessment-audio`), objects keyed
   `{user_id}/{session_id}/{item_id}.webm`. New endpoint
   POST /api/assessment/{session_id}/upload-audio uploads via the service-role key
   server-side only (never expose that key to the frontend).
3. Router /backend/app/routers/assessment.py: POST /start (creates session, returns Section A
   items minus answers); GET /{session_id}/section/{section}; POST /{session_id}/respond
   (MCQ: compute is_correct server-side, store, ack without leaking the answer; audio: log
   response_time_ms metadata, actual audio goes through the upload endpoint); POST
   /{session_id}/tab-switch (increments count, appends warning, called from the frontend's
   visibilitychange listener, centralized at session level across all four sections); POST
   /{session_id}/complete (auto-grades Sections C+D, flags Section A speaking items + all of
   Section B as "pending review" since they need manual or Phase-2 transcription-based
   grading, calls a new `ai_service.summarize_assessment_session(...)` for a plain-language,
   explicitly non-diagnostic summary — never frame this as a clinical/medical assessment);
   GET /{session_id}/results (score breakdown, ai_summary, signed URLs to the student's own
   recordings). Register the router in main.py.
4. Extend supabase_schema.sql with the three new tables and document the storage bucket +
   its access policy (private, owner + service role only) at the top.

Frontend:
5. Under src/pages/assessment/: AssessmentIntro.jsx (disclaimer, mic-permission check, Start
   button), SectionA.jsx, SectionB.jsx, SectionC.jsx, SectionD.jsx, AssessmentResults.jsx —
   port the reference files' logic, replacing `next/navigation`'s useRouter with
   react-router-dom's useNavigate, and all localStorage persistence with real API calls
   (start session once in the intro, fetch items per section, POST responses/audio as the
   student progresses, POST tab-switch events, POST complete on the last section, render
   results from GET .../results). Keep client-only behaviors exactly as-is: per-item/phase
   timers, one-time-only TTS gating, the Section B prep->speak transition, Section D's
   "questions hidden until audio ends" gating, and the tab-switch listener (now also POSTing
   to the backend).
6. Add src/hooks/useAudioRecorder.js (wraps getUserMedia + MediaRecorder,
   start/stop/isRecording/audioBlob) shared by Sections A and B, and
   src/hooks/useOneTimeSpeech.js (wraps SpeechSynthesisUtterance with a played flag that
   never resets per item) shared by Section A's listen-repeat items and Section D's passages.
7. Wire routes: /assessment, /assessment/section-a..d, /assessment/results, all behind the
   Private guard; add an "Assessment" link in Navbar.jsx.
8. Restyle using BrainGraph's existing brain/focus Tailwind tokens and card/button
   conventions instead of the reference files' inline utility colors — keep a distinct accent
   per section for wayfinding, but as proper theme extensions.

Constraints: never send `correct_answer` to the frontend before a response is submitted;
audio upload uses the service-role key server-side only; keep proctoring soft (warn + log,
don't auto-fail/lock out — that needs explicit product sign-off); no clinical/diagnostic
language anywhere in AI-generated summary text; update /docs/AI_FEATURES.md with an "English
Proficiency Assessment" section noting Sections C/D are auto-graded and Sections A (speaking
items)/B are pending-review.

================================================================================
END OF PHASES — confirm Phase 1's plan first, then proceed.
```

---

### How to use this
- If you paste the whole thing at once, Antigravity should treat the phase headers as
  sequential milestones — but it's told to confirm Phase 1's plan before writing any code, so
  you get a checkpoint before the biggest structural change (the auth migration) lands.
- If you'd rather review each phase's diff separately, just paste one `PHASE N` block at a
  time — each is self-contained given the phases before it are done.
- Known open items **not** covered here, called out earlier in this conversation and worth
  their own follow-up prompts later: automatic grading/scoring for Section A's speaking items
  and Section B (currently "pending review" only), body-doubling rooms, AI study-buddy chat,
  guardian/teacher dashboard, and notifications. Happy to write any of those next if you want.
