-- Migration for Notes Feature: allow_download column and note_read_progress table

-- 1. Add allow_download column to study_materials if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'study_materials' 
          AND column_name = 'allow_download'
    ) THEN
        ALTER TABLE study_materials ADD COLUMN allow_download BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
END $$;

-- 2. Create note_read_progress table for tracking per-student read status
CREATE TABLE IF NOT EXISTS note_read_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_note_read_material_user UNIQUE (material_id, user_id)
);

-- 3. Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_note_read_progress_user ON note_read_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_note_read_progress_material ON note_read_progress(material_id);

-- 4. Enable RLS
ALTER TABLE note_read_progress ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Users can view their own read progress
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'note_read_progress' AND policyname = 'Users can view own read progress'
    ) THEN
        CREATE POLICY "Users can view own read progress" 
        ON note_read_progress FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can insert/update their own read progress
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'note_read_progress' AND policyname = 'Users can manage own read progress'
    ) THEN
        CREATE POLICY "Users can manage own read progress" 
        ON note_read_progress FOR ALL 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
