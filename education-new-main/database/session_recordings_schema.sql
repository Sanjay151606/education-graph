-- ==============================================================================
-- BrainGraph: Session Recordings Schema & Private Storage RLS
-- ==============================================================================

-- 1. Create table for session recordings
CREATE TABLE IF NOT EXISTS session_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'recording' CHECK (status IN ('recording', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_recordings_session ON session_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_user ON session_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_status ON session_recordings(status);

-- 3. Row-Level Security (RLS)
ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;

-- Students can read & insert their own recordings
CREATE POLICY "Students can access own recordings"
    ON session_recordings
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Teachers can view completed recordings for review
CREATE POLICY "Teachers can view session recordings"
    ON session_recordings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'teacher'
        )
    );

-- 4. Storage Bucket Setup Note:
-- Bucket 'student-recordings' must be created as PRIVATE in Supabase Storage.
-- Only authenticated backend services generate short-lived signed URLs for teachers.
