# 🧠 BrainGraph v2: Classroom Engagement & ADHD Support — New Features Documentation

This document outlines the v2 extension for real-time classroom engagement, knowledge-level clustering, post-class follow-up, and ADHD-specific personalization.

---

## 📁 Architecture & File Manifest

### Backend Additions (`backend/`)
- [backend/app/models_v2.py](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/backend/app/models_v2.py)
  - `KnowledgeBand` (table `knowledge_bands`): stores student pre-topic diagnostic score and assigned band (`foundation`, `on-track`, `advanced`).
  - `EngagementEvent` (table `engagement_events`): stores on-device attention estimates (`focused`, `mild_confusion`, `lost`, `disengaged`).
  - `ADHDProfile` (table `adhd_profile`): personalized focus span baseline, preferred break interval, and reduced stimulation preferences.
  - `AIRecommendation` (table `ai_recommendations`): extended with `subtype` column (`recap` | `challenge` | `break_nudge`).
  - `ConfusionBookmark` (table `confusion_bookmarks`): student-created timestamped confusion markers.
  - `DiagnosticQuizItem` (table `diagnostic_quiz_items`): 5–8 question diagnostic question bank.

- [backend/app/schemas_v2.py](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/backend/app/schemas_v2.py)
  - Pydantic models for quiz submission, knowledge bands, banded material, live classroom WebSocket/REST events, aggregate tiles, and ADHD profile updates.

- [backend/app/services/v2_services.py](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/backend/app/services/v2_services.py)
  - `evaluate_diagnostic_quiz`: auto-grades and clusters students into bands.
  - `get_banded_study_material`: adapts depth & pacing of study material by calling `ai_service.simplify_study_material` with calibrated depth parameters.
  - `generate_followup`: creates simplified 2-minute recaps for students with confusion flags/bookmarks or extension challenges for focused students.
  - `analyze_focus_pattern`: computes individual focus span and break timings from the student's own historical event stream.
  - `chunk_live_lecture_transcript`: auto-chunks live transcription feeds into concise 30-second bullet points.

- [backend/app/seed_v2_data.py](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/backend/app/seed_v2_data.py)
  - Pre-seeded 5–8 question diagnostic quizzes across key subjects (Cellular Biology, Algebra & Quadratics).

- [backend/app/routers/v2_classroom.py](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/backend/app/routers/v2_classroom.py)
  - `ws/engagement/{session_id}`: WebSocket ingesting on-device student JSON events and broadcasting anonymous aggregated tiles to teacher monitors.
  - `/api/v2/classroom/confusion-bookmark`: records student bookmarks.
  - `/api/v2/classroom/generate-followup/{session_id}`: generates/retrieves personalized follow-ups.

- [backend/app/routers/v2_clustering.py](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/backend/app/routers/v2_clustering.py)
  - `/api/v2/clustering/topics` & `/api/v2/clustering/quiz/{topic_id}`: diagnostic quiz retrieval.
  - `/api/v2/clustering/submit-quiz`: assigns knowledge band.
  - `/api/v2/clustering/banded-material`: delivers band-calibrated content.

- [backend/app/routers/v2_adhd.py](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/backend/app/routers/v2_adhd.py)
  - `/api/v2/adhd/profile`: ADHD profile management.
  - `/api/v2/adhd/analyze-pattern`: pattern analysis trigger.
  - `/api/v2/adhd/live-notes/chunk`: real-time lecture note chunking.

### Database Additions (`database/`)
- [database/v2_classroom_adhd_schema.sql](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/database/v2_classroom_adhd_schema.sql)
  - SQL migration for Supabase Postgres containing all v2 tables, indexes, and Row Level Security (RLS) policies.

### Frontend Additions (`frontend/`)
- [frontend/src/services/v2_api.js](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/services/v2_api.js): API client for all v2 endpoints.
- [frontend/src/components/v2/PrivacyConsentModal.jsx](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/v2/PrivacyConsentModal.jsx): Opt-in consent modal guaranteeing 100% on-device processing.
- [frontend/src/components/v2/FocusTracker.jsx](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/v2/FocusTracker.jsx): Client-side attention estimator streaming minimal JSON events every 5–10s.
- [frontend/src/components/v2/MicroBreakPrompt.jsx](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/v2/MicroBreakPrompt.jsx): Private 60-second breathing & stretch nudge for students.
- [frontend/src/components/v2/ReducedStimulationMode.jsx](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/v2/ReducedStimulationMode.jsx): Toggle stripping non-essential animations and visual noise.
- [frontend/src/components/v2/LiveLectureNotes.jsx](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/v2/LiveLectureNotes.jsx): Real-time chunked lecture points refreshed every ~30s.
- [frontend/src/components/v2/ConfusionBookmark.jsx](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/v2/ConfusionBookmark.jsx): Subtle "I got lost here" button with timestamping.
- [frontend/src/components/v2/BandedMaterialViewer.jsx](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/components/v2/BandedMaterialViewer.jsx): Interactive viewer for band-calibrated study materials.
- [frontend/src/pages/TeacherDashboard.jsx](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/TeacherDashboard.jsx): Teacher-facing live grid monitor with auto-alerting (>25% confusion).
- [frontend/src/pages/LiveClassroomStudent.jsx](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/LiveClassroomStudent.jsx): Student live classroom portal.
- [frontend/src/pages/DiagnosticQuiz.jsx](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/DiagnosticQuiz.jsx): Pre-topic diagnostic quiz & banding portal.
- [frontend/src/pages/PostClassFollowup.jsx](file:///c:/Users/ssanj/Downloads/education-new-main/education-new-main/frontend/src/pages/PostClassFollowup.jsx): Post-class recap and challenge center.

---

## 🔒 Privacy & Data Isolation

1. **On-Device Only Processing**: Raw video frames never leave the client device. Only small JSON event estimates (`focused`, `mild_confusion`, `lost`, `disengaged`) with confidence metrics are sent.
2. **Teacher Dashboard Privacy**: Teacher monitors only receive anonymous, aggregated student grid tiles (e.g. Tile #1..#60) and class-wide comprehension rates. Named histories and per-student report cards are strictly prohibited.
3. **Private Nudges**: Micro-break prompts and confusion bookmarks are strictly private to the student.
