-- BrainGraph Supabase Schema
-- Run this in the Supabase SQL editor

-- ================= STORAGE BUCKETS =================
-- Bucket Name: assessment-audio
-- Access: Private (public=false)
-- Objects Key Pattern: {user_id}/{session_id}/{item_id}.webm
-- Policy:
--   - Insert / Write: Supabase Service Role Key (server-side only via backend) or authenticated user for their own folder.
--   - Select / Read: Authenticated user (auth.uid()::text = (storage.foldername(name))[1]) or Supabase Service Role Key.
--
-- SQL to configure storage bucket in Supabase (if using storage schema):
-- insert into storage.buckets (id, name, public) values ('assessment-audio', 'assessment-audio', false)
-- on conflict (id) do nothing;
--
-- create policy "Users can read their own assessment recordings" on storage.objects
--   for select using (bucket_id = 'assessment-audio' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "Users can upload their own assessment recordings" on storage.objects
--   for insert with check (bucket_id = 'assessment-audio' and auth.uid()::text = (storage.foldername(name))[1]);

create extension if not exists "uuid-ossp";

-- ================= USERS =================
-- Linked directly to Supabase Auth (auth.users)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  focus_span_minutes int default 20,
  preferred_content_style text default 'visual' check (preferred_content_style in ('visual','audio','text','mixed')),
  difficulty_level text default 'adaptive' check (difficulty_level in ('easy','medium','hard','adaptive')),
  reminders_enabled boolean default true,
  created_at timestamptz default now()
);

-- ================= TASKS =================
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  subtasks jsonb default '[]',
  priority text default 'medium' check (priority in ('low','medium','high')),
  status text default 'pending' check (status in ('pending','in_progress','done')),
  estimated_minutes int,
  due_date timestamptz,
  created_at timestamptz default now()
);

-- ================= STUDY MATERIALS =================
create table if not exists study_materials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  original_text text,
  simplified_text text,
  summary_bullets jsonb default '[]',
  flashcards jsonb default '[]',
  subject text,
  created_at timestamptz default now()
);

-- ================= PROGRESS LOGS =================
create table if not exists progress_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  subject text,
  activity_type text,
  score numeric,
  time_spent_minutes int,
  date timestamptz default now()
);

-- ================= FOCUS SESSIONS =================
create table if not exists focus_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  technique text default 'pomodoro',
  planned_minutes int default 25,
  actual_minutes int,
  distractions_logged int default 0,
  completed boolean default false,
  started_at timestamptz default now()
);

-- ================= ASSESSMENT ITEMS =================
create table if not exists assessment_items (
  id text primary key, -- e.g. 'sec-a-ra-1', 'sec-b-topic-1', 'sec-c-g-1', 'sec-d-p-1-q-1'
  section text not null check (section in ('A', 'B', 'C', 'D')),
  item_type text not null, -- read_aloud / listen_repeat / speaking_prep / speaking_task / grammar_mcq / listening_comprehension
  sequence_index int not null,
  prompt_text text not null,
  options jsonb,
  correct_answer text,
  hints jsonb,
  time_limit_seconds int,
  passage_group_id text,
  difficulty text
);

-- ================= ASSESSMENT SESSIONS =================
create table if not exists assessment_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  candidate_name text,
  status text default 'in_progress' check (status in ('in_progress', 'completed')),
  current_section text default 'A' check (current_section in ('A', 'B', 'C', 'D')),
  started_at timestamptz default now(),
  completed_at timestamptz,
  tab_switch_count int default 0,
  warnings jsonb default '[]',
  overall_score numeric,
  ai_summary text,
  per_type_breakdown jsonb default '{}'
);

-- ================= ASSESSMENT RESPONSES =================
create table if not exists assessment_responses (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references assessment_sessions(id) on delete cascade,
  item_id text references assessment_items(id) on delete cascade,
  response_type text not null check (response_type in ('audio', 'mcq_choice')),
  audio_storage_path text,
  mcq_choice text,
  user_answer_text text,
  is_correct boolean,
  similarity_score numeric,
  response_time_ms int,
  created_at timestamptz default now()
);

-- ================= INDEXES =================
create index if not exists idx_tasks_user on tasks(user_id);
create index if not exists idx_materials_user on study_materials(user_id);
create index if not exists idx_progress_user on progress_logs(user_id);
create index if not exists idx_focus_user on focus_sessions(user_id);
create index if not exists idx_assessment_items_section on assessment_items(section, sequence_index);
create index if not exists idx_assessment_sessions_user on assessment_sessions(user_id);
create index if not exists idx_assessment_responses_session on assessment_responses(session_id);
create index if not exists idx_assessment_responses_item on assessment_responses(item_id);

-- ================= ROW LEVEL SECURITY =================
alter table users enable row level security;
alter table tasks enable row level security;
alter table study_materials enable row level security;
alter table progress_logs enable row level security;
alter table focus_sessions enable row level security;
alter table assessment_items enable row level security;
alter table assessment_sessions enable row level security;
alter table assessment_responses enable row level security;

create policy "Users manage their own profile" on users
  for all using (auth.uid() = id);

create policy "Users manage their own tasks" on tasks
  for all using (auth.uid() = user_id);

create policy "Users manage their own materials" on study_materials
  for all using (auth.uid() = user_id);

create policy "Users manage their own progress" on progress_logs
  for all using (auth.uid() = user_id);

create policy "Users manage their own focus sessions" on focus_sessions
  for all using (auth.uid() = user_id);

-- Assessment items are readable by all authenticated users
create policy "Anyone can read assessment items" on assessment_items
  for select using (true);

create policy "Users manage their own assessment sessions" on assessment_sessions
  for all using (auth.uid() = user_id);

create policy "Users manage their own assessment responses" on assessment_responses
  for all using (
    exists (
      select 1 from assessment_sessions
      where assessment_sessions.id = assessment_responses.session_id
      and assessment_sessions.user_id = auth.uid()
    )
  );
