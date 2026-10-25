-- =============================================================================
-- BrainGraph: Study Materials Schema & Policies Extension
-- =============================================================================

-- 1. Ensure study_materials table exists and has all extended fields
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL DEFAULT 'General',
    topic VARCHAR(150) NOT NULL DEFAULT '',
    description TEXT,
    material_type VARCHAR(50) NOT NULL DEFAULT 'Notes',
    structured_content JSONB NOT NULL DEFAULT '{}'::jsonb,
    original_content TEXT,
    simplified_content TEXT,
    original_text TEXT,
    simplified_text TEXT,
    summary_bullets JSONB DEFAULT '[]'::jsonb,
    flashcards JSONB DEFAULT '[]'::jsonb,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_type VARCHAR(100),
    file_size INTEGER,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    visibility VARCHAR(20) NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add columns if table was created previously without them
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS subject VARCHAR(100) DEFAULT 'General';
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS topic VARCHAR(150) DEFAULT '';
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS material_type VARCHAR(50) DEFAULT 'Notes';
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS structured_content JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'published';
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Indexes for fast search & filtering
CREATE INDEX IF NOT EXISTS ix_study_materials_user_id ON public.study_materials(user_id);
CREATE INDEX IF NOT EXISTS ix_study_materials_subject ON public.study_materials(subject);
CREATE INDEX IF NOT EXISTS ix_study_materials_topic ON public.study_materials(topic);
CREATE INDEX IF NOT EXISTS ix_study_materials_material_type ON public.study_materials(material_type);
CREATE INDEX IF NOT EXISTS ix_study_materials_visibility ON public.study_materials(visibility);
CREATE INDEX IF NOT EXISTS ix_study_materials_created_at ON public.study_materials(created_at DESC);

-- 4. Row Level Security (RLS)
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- Students and teachers can read all published materials; creators can read their own drafts
CREATE POLICY "Read published or owned study materials"
ON public.study_materials
FOR SELECT
USING (
    visibility = 'published'
    OR auth.uid() = user_id
);

-- Teachers/owners can insert their own materials
CREATE POLICY "Insert own study materials"
ON public.study_materials
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
);

-- Teachers/owners can update their own materials
CREATE POLICY "Update own study materials"
ON public.study_materials
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Teachers/owners can delete their own materials
CREATE POLICY "Delete own study materials"
ON public.study_materials
FOR DELETE
USING (auth.uid() = user_id);
