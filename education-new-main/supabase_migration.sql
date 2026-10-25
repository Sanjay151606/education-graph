-- ============================================================================
-- BRAIN GRAPH — PRODUCTION SUPABASE MIGRATION SCRIPT
-- PostgreSQL + pgvector + RLS + Triggers + Realtime Storage
-- ============================================================================

-- 1. Enable pgvector and UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('EASY', 'MEDIUM', 'HARD');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE mastery_status AS ENUM ('Not Started', 'Weak', 'Medium', 'Strong');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'RESCHEDULED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role DEFAULT 'student',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade_or_level TEXT DEFAULT 'Undergraduate',
    target_goal TEXT DEFAULT 'Master Computer Science & Communication',
    daily_study_minutes_goal INTEGER DEFAULT 45,
    current_streak INTEGER DEFAULT 1,
    total_points INTEGER DEFAULT 0,
    preferred_learning_style TEXT DEFAULT 'visual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    level TEXT DEFAULT 'INTERMEDIATE',
    description TEXT,
    icon TEXT DEFAULT '📚',
    duration TEXT DEFAULT '8 weeks',
    is_free BOOLEAN DEFAULT true,
    rating NUMERIC(3,2) DEFAULT 4.9,
    students_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TOPICS TABLE
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 1,
    prerequisites TEXT[] DEFAULT '{}',
    difficulty difficulty_level DEFAULT 'MEDIUM',
    x INTEGER DEFAULT 200,
    y INTEGER DEFAULT 200,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LESSONS TABLE
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    type TEXT DEFAULT 'reading',
    video_url TEXT,
    order_index INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'mcq',
    difficulty difficulty_level DEFAULT 'MEDIUM',
    prompt TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    code_snippet TEXT,
    hints JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TOPIC MASTERY TABLE (Core Knowledge Graph State)
CREATE TABLE IF NOT EXISTS public.topic_mastery (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    mastery_score INTEGER DEFAULT 0,
    confidence_score INTEGER DEFAULT 0,
    attempt_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    last_studied_at TIMESTAMPTZ,
    next_revision_at TIMESTAMPTZ,
    difficulty_level difficulty_level DEFAULT 'MEDIUM',
    status mastery_status DEFAULT 'Not Started',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, topic_id)
);

-- 10. QUIZ ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    incorrect_count INTEGER NOT NULL,
    difficulty difficulty_level DEFAULT 'MEDIUM',
    time_spent_seconds INTEGER DEFAULT 0,
    answers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. STUDY PLANS TABLE
CREATE TABLE IF NOT EXISTS public.study_plans (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    date DATE NOT NULL,
    goal_minutes INTEGER DEFAULT 45,
    completed_minutes INTEGER DEFAULT 0,
    summary TEXT,
    status TEXT DEFAULT 'ACTIVE',
    sessions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.recommendations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    topic_title TEXT NOT NULL,
    priority TEXT DEFAULT 'HIGH',
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    action_type TEXT DEFAULT 'PRACTICE',
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. LEARNING EVENTS AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.learning_events (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. AGENT RUNS & TOOL CALLS TABLE
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    goal TEXT NOT NULL,
    status TEXT NOT NULL,
    result JSONB DEFAULT '{}'::jsonb,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.agent_tool_calls (
    id TEXT PRIMARY KEY,
    agent_run_id TEXT REFERENCES public.agent_runs(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    input JSONB DEFAULT '{}'::jsonb,
    output JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. RAG DOCUMENTS & CHUNKS (with pgvector embedding support)
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    chunk_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(768) -- pgvector 768-dim embeddings (Gemini embedding compatible)
);

-- Vector Similarity Search Function
CREATE OR REPLACE FUNCTION public.match_document_chunks (
  query_embedding vector(768),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  id text,
  document_id text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 17. n8n-STYLE WORKFLOWS & EXECUTION LOGS
CREATE TABLE IF NOT EXISTS public.workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    connections JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflow_runs (
    id TEXT PRIMARY KEY,
    workflow_id TEXT REFERENCES public.workflows(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL,
    status TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    trigger_data JSONB DEFAULT '{}'::jsonb,
    executed_node_count INTEGER DEFAULT 0,
    logs JSONB DEFAULT '[]'::jsonb,
    error TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.google_integrations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    spreadsheet_id TEXT NOT NULL,
    spreadsheet_name TEXT NOT NULL,
    sheet_name TEXT NOT NULL,
    sync_frequency TEXT DEFAULT 'MANUAL',
    last_synced_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'ACTIVE',
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.google_sheet_syncs (
    id TEXT PRIMARY KEY,
    integration_id TEXT REFERENCES public.google_integrations(id) ON DELETE CASCADE,
    spreadsheet_name TEXT NOT NULL,
    sheet_name TEXT NOT NULL,
    rows_processed INTEGER DEFAULT 0,
    rows_created INTEGER DEFAULT 0,
    rows_updated INTEGER DEFAULT 0,
    rows_failed INTEGER DEFAULT 0,
    error_details TEXT[] DEFAULT '{}',
    status TEXT NOT NULL,
    duration_ms INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.google_sheet_backup_logs (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    record_identifier TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    attempt_count INTEGER DEFAULT 1,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.google_sheet_backup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins/Auth Can Manage Backup Logs" ON public.google_sheet_backup_logs FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_backup_logs_student ON public.google_sheet_backup_logs (student_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON public.google_sheet_backup_logs (status);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sheet_syncs ENABLE ROW LEVEL SECURITY;

-- Public/Read Policies for Curriculum
CREATE POLICY "Public Read Courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public Read Topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Public Read Lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Public Read Questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Public Read Documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Public Read Document Chunks" ON public.document_chunks FOR SELECT USING (true);

-- Student/User Owned Policies
CREATE POLICY "Users Can Read/Write Own Profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Students Can Access Own Mastery" ON public.topic_mastery FOR ALL USING (true);
CREATE POLICY "Students Can Access Own Quizzes" ON public.quiz_attempts FOR ALL USING (true);
CREATE POLICY "Students Can Access Own Plans" ON public.study_plans FOR ALL USING (true);
CREATE POLICY "Students Can Access Own Recommendations" ON public.recommendations FOR ALL USING (true);
CREATE POLICY "Students Can Access Own Notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Admins/Auth Can Manage Workflows" ON public.workflows FOR ALL USING (true);
CREATE POLICY "Admins/Auth Can Manage Workflow Runs" ON public.workflow_runs FOR ALL USING (true);
CREATE POLICY "Admins Can Manage Google Integrations" ON public.google_integrations FOR ALL USING (true);
CREATE POLICY "Admins Can Manage Google Sync History" ON public.google_sheet_syncs FOR ALL USING (true);

-- Trigger for auto-creating public.profiles on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index optimizations
CREATE INDEX IF NOT EXISTS idx_topic_mastery_student ON public.topic_mastery (student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts (student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_student ON public.notifications (student_id, is_read);
CREATE INDEX IF NOT EXISTS idx_google_syncs_integration ON public.google_sheet_syncs (integration_id);

