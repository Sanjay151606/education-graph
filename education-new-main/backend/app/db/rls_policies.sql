-- =============================================================================
-- BrainGraph — Supabase PostgreSQL Row Level Security (RLS) Policy Examples
-- =============================================================================
-- NOTE: THESE POLICIES ARE EXAMPLES ONLY FOR REFERENCE.
-- ALL STATEMENTS ARE COMMENTED OUT TO PREVENT ACCIDENTAL EXECUTION.
-- DO NOT EXECUTE DIRECTLY WITHOUT REVIEWING YOUR APPLICATION'S AUTH ARCHITECTURE.
--
-- AUTHENTICATION NOTICE:
-- 1. If using Supabase Auth, policies use `auth.uid()` or `auth.jwt() ->> 'sub'`.
-- 2. If using Custom FastAPI / JWT authentication with Supabase as hosted Postgres,
--    authorization is enforced by FastAPI middleware/dependency injection at the API layer.
--    If enabling RLS with custom JWTs, adapt the `user_id` check using `auth.jwt() ->> 'sub'`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- -----------------------------------------------------------------------------
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can view and update their own user profile"
-- ON public.users
-- FOR ALL
-- USING (id = auth.uid())
-- WITH CHECK (id = auth.uid());


-- -----------------------------------------------------------------------------
-- 2. TASKS TABLE
-- -----------------------------------------------------------------------------
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can manage their own tasks"
-- ON public.tasks
-- FOR ALL
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 3. STUDY MATERIALS TABLE
-- -----------------------------------------------------------------------------
-- ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can access their own study materials"
-- ON public.study_materials
-- FOR ALL
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 4. FOCUS SESSIONS TABLE
-- -----------------------------------------------------------------------------
-- ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can access their own focus sessions"
-- ON public.focus_sessions
-- FOR ALL
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 5. PROGRESS TABLE
-- -----------------------------------------------------------------------------
-- ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can view and record their own progress"
-- ON public.progress
-- FOR ALL
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 6. AI RECOMMENDATIONS TABLE
-- -----------------------------------------------------------------------------
-- ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can view their own AI recommendations"
-- ON public.ai_recommendations
-- FOR ALL
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 7. KNOWLEDGE BANDS TABLE
-- -----------------------------------------------------------------------------
-- ALTER TABLE public.knowledge_bands ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can view their own knowledge bands"
-- ON public.knowledge_bands
-- FOR SELECT
-- USING (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 8. ADHD PROFILE TABLE (1-to-1 with users)
-- -----------------------------------------------------------------------------
-- ALTER TABLE public.adhd_profile ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can manage their own ADHD profile"
-- ON public.adhd_profile
-- FOR ALL
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 9. ENGAGEMENT EVENTS TABLE (Privacy-Critical)
-- -----------------------------------------------------------------------------
-- PRIVACY NOTICE:
-- Raw real-time engagement events (focus/confusion state streams) MUST NOT be
-- made readable as raw individual records by students to protect student privacy.
-- Raw engagement events are restricted to teacher/instructor/admin roles and the
-- server-side aggregate calculation pipeline. Students receive only approved aggregate
-- or post-class recap insights through dedicated API endpoints.
--
-- ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;
--
-- -- Allow students/clients to insert their own telemetry events
-- CREATE POLICY "Users can insert their own engagement telemetry"
-- ON public.engagement_events
-- FOR INSERT
-- WITH CHECK (user_id = auth.uid());
--
-- -- Restrict raw telemetry reading to Teacher / Admin roles only
-- CREATE POLICY "Teachers and admins can read classroom engagement events"
-- ON public.engagement_events
-- FOR SELECT
-- USING (
--     (auth.jwt() ->> 'role') IN ('teacher', 'admin', 'service_role')
-- );
