-- BrainGraph v2: Classroom Engagement & ADHD Support Schema
-- Run this in the Supabase SQL editor to add v2 tables

-- ================= KNOWLEDGE BANDS =================
create table if not exists knowledge_bands (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  topic_id text not null,
  topic_name text not null,
  band text not null check (band in ('foundation', 'on-track', 'advanced')),
  score numeric default 0.0,
  assigned_at timestamptz default now()
);

-- ================= ENGAGEMENT EVENTS =================
create table if not exists engagement_events (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null,
  user_id uuid references users(id) on delete cascade,
  timestamp timestamptz default now(),
  state text not null check (state in ('focused', 'mild_confusion', 'lost', 'disengaged')),
  confidence numeric default 0.85,
  metadata_payload jsonb default '{}'
);

-- ================= ADHD PROFILE =================
create table if not exists adhd_profile (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references users(id) on delete cascade,
  focus_span_avg_minutes int default 18,
  preferred_break_interval int default 20,
  reduced_stimulation_enabled boolean default false,
  chunking_preference text default 'small' check (chunking_preference in ('small', 'medium', 'large')),
  updated_at timestamptz default now()
);

-- ================= CONFUSION BOOKMARKS =================
create table if not exists confusion_bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  session_id text not null,
  topic_or_slide text default 'Live Lecture',
  note text,
  timestamp timestamptz default now(),
  created_at timestamptz default now()
);

-- ================= DIAGNOSTIC QUIZ ITEMS =================
create table if not exists diagnostic_quiz_items (
  id text primary key,
  topic_id text not null,
  topic_name text not null,
  question_text text not null,
  options jsonb not null,
  correct_answer text not null,
  difficulty text default 'medium',
  explanation text
);

-- ================= EXTEND AI RECOMMENDATIONS =================
-- Add subtype column if not exists (recap, challenge, break_nudge)
create table if not exists ai_recommendations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  session_id text,
  topic_id text,
  type text default 'study_material',
  subtype text, -- 'recap' | 'challenge' | 'break_nudge'
  title text not null,
  content jsonb default '{}',
  created_at timestamptz default now()
);

-- ================= INDEXES =================
create index if not exists idx_knowledge_bands_user on knowledge_bands(user_id, topic_id);
create index if not exists idx_engagement_events_session on engagement_events(session_id, timestamp);
create index if not exists idx_engagement_events_user on engagement_events(user_id);
create index if not exists idx_adhd_profile_user on adhd_profile(user_id);
create index if not exists idx_confusion_bookmarks_user on confusion_bookmarks(user_id, session_id);
create index if not exists idx_diagnostic_quiz_topic on diagnostic_quiz_items(topic_id);

-- ================= ROW LEVEL SECURITY & PRIVACY =================
alter table knowledge_bands enable row level security;
alter table engagement_events enable row level security;
alter table adhd_profile enable row level security;
alter table confusion_bookmarks enable row level security;
alter table diagnostic_quiz_items enable row level security;
alter table ai_recommendations enable row level security;

-- Privacy Rule: Students can only view their own records.
create policy "Users manage their own knowledge bands" on knowledge_bands
  for all using (auth.uid() = user_id);

create policy "Users insert and view their own engagement events" on engagement_events
  for all using (auth.uid() = user_id);

create policy "Users manage their own ADHD profile" on adhd_profile
  for all using (auth.uid() = user_id);

create policy "Users manage their own confusion bookmarks" on confusion_bookmarks
  for all using (auth.uid() = user_id);

create policy "Anyone can read diagnostic quiz items" on diagnostic_quiz_items
  for select using (true);

create policy "Users view their own ai recommendations" on ai_recommendations
  for all using (auth.uid() = user_id);
