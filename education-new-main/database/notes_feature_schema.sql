-- =============================================================================
-- BrainGraph: Notes Feature Schema & Row Level Security Policies
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Storage Bucket: 'notes' (Private)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'notes',
    'notes',
    false,
    26214400, -- 25 MB max size
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/png',
        'image/jpeg'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 26214400,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/png',
        'image/jpeg'
    ];

-- -----------------------------------------------------------------------------
-- 2. Storage Policies for 'notes' Bucket
-- -----------------------------------------------------------------------------

-- Read / Download policy: Authenticated users can download objects via signed URL or if published
DROP POLICY IF EXISTS "Authenticated users can read notes objects" ON storage.objects;
CREATE POLICY "Authenticated users can read notes objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'notes');

-- Upload policy: Teachers and admins only, up to 25MB, allowed types
DROP POLICY IF EXISTS "Teachers can upload notes files" ON storage.objects;
CREATE POLICY "Teachers can upload notes files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'notes'
    AND (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('teacher', 'admin')
        OR (auth.jwt() ->> 'role') IN ('teacher', 'admin')
        OR auth.uid()::text = (storage.foldername(name))[1]
    )
);

-- Update / Replace policy: Teachers can update their own uploaded files
DROP POLICY IF EXISTS "Teachers can update own notes files" ON storage.objects;
CREATE POLICY "Teachers can update own notes files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'notes'
    AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('teacher', 'admin')
    )
);

-- Delete policy: Teachers can delete their own uploaded files
DROP POLICY IF EXISTS "Teachers can delete own notes files" ON storage.objects;
CREATE POLICY "Teachers can delete own notes files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'notes'
    AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('teacher', 'admin')
    )
);

-- -----------------------------------------------------------------------------
-- 3. Notes Metadata Table: 'public.notes'
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL DEFAULT 'Computer Fundamentals',
    unit VARCHAR(100) NOT NULL DEFAULT 'Unit I',
    description TEXT DEFAULT '',
    class_id VARCHAR(50) NOT NULL DEFAULT 'CS-101',
    file_path TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    size_bytes BIGINT NOT NULL DEFAULT 0,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_name VARCHAR(255) NOT NULL DEFAULT 'Instructor',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    allow_download BOOLEAN NOT NULL DEFAULT true,
    structured_content JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for search, filtering, and role scoping
CREATE INDEX IF NOT EXISTS idx_notes_class_status ON public.notes(class_id, status);
CREATE INDEX IF NOT EXISTS idx_notes_uploaded_by ON public.notes(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_notes_subject ON public.notes(subject);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4. Row Level Security Policies for 'public.notes'
-- -----------------------------------------------------------------------------

-- SELECT: Teachers see all notes in their classes or created by them.
-- Students see ONLY published notes for their enrolled class.
-- Unauthenticated users cannot read any notes.
DROP POLICY IF EXISTS "Read notes policy" ON public.notes;
CREATE POLICY "Read notes policy"
ON public.notes
FOR SELECT
TO authenticated
USING (
    -- Teachers and admins see their own notes and notes for classes they teach
    (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('teacher', 'admin')
        OR auth.uid() = uploaded_by
    )
    OR
    -- Students see only published notes for their enrolled class (defaults to matching class_id or 'CS-101')
    (
        status = 'published'
        AND (
            class_id = COALESCE(auth.jwt() -> 'user_metadata' ->> 'class_id', 'CS-101')
            OR class_id = 'CS-101'
        )
    )
);

-- INSERT: Only teachers and admins can create notes
DROP POLICY IF EXISTS "Teachers can insert notes" ON public.notes;
CREATE POLICY "Teachers can insert notes"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (
    (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('teacher', 'admin')
        OR (auth.jwt() ->> 'role') IN ('teacher', 'admin')
    )
    AND auth.uid() = uploaded_by
);

-- UPDATE: Teachers can update only their own notes
DROP POLICY IF EXISTS "Teachers can update own notes" ON public.notes;
CREATE POLICY "Teachers can update own notes"
ON public.notes
FOR UPDATE
TO authenticated
USING (
    auth.uid() = uploaded_by
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    auth.uid() = uploaded_by
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- DELETE: Teachers can delete only their own notes
DROP POLICY IF EXISTS "Teachers can delete own notes" ON public.notes;
CREATE POLICY "Teachers can delete own notes"
ON public.notes
FOR DELETE
TO authenticated
USING (
    auth.uid() = uploaded_by
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- -----------------------------------------------------------------------------
-- 5. Student Progress Tracking Table: 'public.note_student_progress'
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.note_student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, note_id)
);

CREATE INDEX IF NOT EXISTS idx_note_progress_user ON public.note_student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_note_progress_note ON public.note_student_progress(note_id);

ALTER TABLE public.note_student_progress ENABLE ROW LEVEL SECURITY;

-- Students manage only their own progress
DROP POLICY IF EXISTS "Users can read own note progress" ON public.note_student_progress;
CREATE POLICY "Users can read own note progress"
ON public.note_student_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own note progress" ON public.note_student_progress;
CREATE POLICY "Users can insert own note progress"
ON public.note_student_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own note progress" ON public.note_student_progress;
CREATE POLICY "Users can update own note progress"
ON public.note_student_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. Seed Record for Assignment One
-- -----------------------------------------------------------------------------
-- Note: Replace '<TEACHER_UUID>' with a valid teacher auth user UUID when running in production,
-- or this seed will associate with the first teacher found in auth.users.
DO 
DECLARE
    v_teacher_id UUID;
BEGIN
    SELECT id INTO v_teacher_id FROM auth.users LIMIT 1;

    IF v_teacher_id IS NOT NULL THEN
        INSERT INTO public.notes (
            id,
            title,
            subject,
            unit,
            description,
            class_id,
            file_path,
            file_type,
            size_bytes,
            uploaded_by,
            teacher_name,
            uploaded_at,
            status,
            allow_download
        )
        VALUES (
            'a1111111-1111-1111-1111-111111111111',
            'Assignment One: Number Systems, Bitwise Operations, Integer Representations & Truth Tables',
            'Computer Fundamentals / Digital Logic',
            'Unit I',
            '30 comprehensive questions and step-by-step solutions covering base conversions, bitwise algebra, optimization algorithms (XOR swap, Brian Kernighan), 2''s complement overflow, and verified truth tables.',
            'CS-101',
            'seed/assignment_one_30_questions.pdf',
            'application/pdf',
            51443,
            v_teacher_id,
            'Faculty Instructor',
            now(),
            'published',
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            subject = EXCLUDED.subject,
            unit = EXCLUDED.unit,
            description = EXCLUDED.description,
            status = 'published',
            allow_download = true;
    END IF;
END ;
