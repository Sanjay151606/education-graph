# Antigravity Prompt — BrainGraph

Paste the prompt below into Google Antigravity (or any agentic coding IDE) with this repo
open as the workspace. It tells the agent exactly what already exists, what to build next,
and the constraints to respect, so it doesn't regenerate the scaffold from scratch.

---

```
You are working inside an existing full-stack project called "BrainGraph" — an AI-powered
education platform for students with ADHD. Do not restart the project structure; extend it.

TECH STACK (already scaffolded, do not change without a strong reason):
- Frontend: React 18 + Vite, Tailwind CSS, react-router-dom, axios, Chart.js (react-chartjs-2),
  @supabase/supabase-js. Located in /frontend.
- Backend: Python FastAPI, SQLAlchemy ORM, JWT auth (python-jose + passlib), Pydantic schemas.
  Located in /backend/app.
- Database: PostgreSQL via Supabase. Schema lives in /database/supabase_schema.sql. SQLAlchemy
  models in /backend/app/models.py mirror this schema — keep them in sync if you change one.
- AI: OpenAI SDK wrapper in /backend/app/services/ai_service.py, called from
  /backend/app/routers/{tasks,study_materials,ai_recommendations}.py. All AI features are
  documented in /docs/AI_FEATURES.md — read that file before adding new AI features.

CURRENT STATE:
- Auth: register/login/me endpoints working with JWT, matching React AuthContext.
- Tasks: CRUD + AI auto-breakdown into subtasks with time estimates.
- Study Materials: AI text simplification + summary bullets + flashcards.
- Progress: log + fetch, rendered as a line chart on the Progress page.
- Focus Mode: client-side Pomodoro timer with distraction logging (session persistence to
  the `focus_sessions` table via /api/ai/focus-session/{id}/feedback is stubbed — needs a
  POST /api/focus-sessions endpoint to actually create/update rows; wire this up).
- Dashboard: pulls AI recommendations on load and shows quick links to Tasks/Focus Mode.

YOUR TASKS, IN ORDER:
1. Wire up the missing `focus_sessions` CRUD router (create session on Start, update on
   Pause/Reset with actual_minutes + distractions_logged, call the existing feedback endpoint,
   and surface the risk_label back to the FocusMode page as a toast/banner).
2. Add flashcard review mode to StudyMaterials.jsx — flip-card UI cycling through
   `material.flashcards`, spaced-repetition-lite (mark each card "easy/hard", reorder harder
   ones sooner).
3. Add a Settings page where the user can edit their ADHD learning profile
   (focus_span_minutes, preferred_content_style, difficulty_level, reminders_enabled) —
   backend needs a PATCH /api/auth/me endpoint; frontend needs a form bound to AuthContext.
4. Add basic input validation and error toasts across forms (Tasks, Study Materials, Register)
   — currently failures fail silently or just render nothing.
5. Add loading skeletons instead of blank states on Dashboard, Tasks, and Progress while data
   is fetching.
6. Write a minimal test suite: pytest for the FastAPI routers (auth flow + task CRUD at
   minimum) and a couple of React Testing Library tests for the Login and Tasks pages.
7. Set up Supabase Row Level Security correctly for the actual auth strategy in use: this repo
   uses custom JWT auth (not Supabase Auth), so the `auth.uid() = user_id` policies in
   supabase_schema.sql are placeholders and WON'T WORK as-is. Either (a) migrate to Supabase
   Auth and update FastAPI to verify Supabase JWTs instead of issuing its own, or (b) connect
   to Postgres directly via DATABASE_URL as a service role and rely on FastAPI-level
   authorization only, removing the RLS policies that reference auth.uid(). Pick one, document
   the choice at the top of supabase_schema.sql, and make it consistent end-to-end.

CONSTRAINTS:
- Keep all AI provider calls server-side only (never expose OPENAI_API_KEY to the frontend).
- Match the existing visual style: Tailwind utility classes, rounded-2xl cards, the `brain`/
  `focus` color palette defined in tailwind.config.js — don't introduce a new design system.
- Every new backend endpoint needs a matching Pydantic schema in schemas.py and must require
  `Depends(auth.get_current_user)` unless it's explicitly public (like /register, /login).
- Update /docs/AI_FEATURES.md whenever you add or change an AI-powered feature.
- Prefer small, reviewable commits per task above rather than one giant diff.

Start with task 1 (focus session persistence) and confirm the plan before writing code.
```

---

### Tips for using this with Antigravity
- Open the repo root (containing `/frontend`, `/backend`, `/database`, `/docs`) as the
  workspace so the agent can see the existing structure before it starts.
- If Antigravity asks for environment variables, point it at `backend/.env.example` and
  `frontend/.env.example` rather than letting it invent new ones.
- Run the backend (`uvicorn app.main:app --reload`) and frontend (`npm run dev`) in separate
  terminals so the agent can hit real endpoints while iterating instead of guessing at
  response shapes.
