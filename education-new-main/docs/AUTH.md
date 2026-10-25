# BrainGraph Authentication Guide (Supabase Auth Migration)

## Overview

BrainGraph uses **Supabase Auth** as the primary identity provider. User authentication (email/password signup, login, password recovery, and Google OAuth) is managed client-side using the `@supabase/supabase-js` SDK.

The FastAPI backend acts as a resource server. When the frontend makes requests to `/api/*`, it attaches the Supabase session JWT in the `Authorization: Bearer <token>` header. FastAPI verifies this token using the Supabase JWT secret and resolves or creates the corresponding student profile.

---

## Key Components

### 1. Backend Verification & Profile Synchronization (`backend/app/auth.py`)
- Fast, stateless verification using `python-jose` with the Supabase JWT Secret (`HS256`).
- Extracts the Supabase user UUID (`sub`), email, and user metadata (`full_name`).
- **Auto-Upsert on First Login**: If a user logs in for the first time via Google OAuth or Supabase Auth, a local record in the `users` table is created with default ADHD settings:
  - `focus_span_minutes`: 20
  - `preferred_content_style`: `"visual"`
  - `difficulty_level`: `"adaptive"`
  - `reminders_enabled`: `true`
- Existing foreign keys (`tasks`, `study_materials`, `progress_logs`, `focus_sessions`) cleanly link to `users.id = auth.users.id`.

### 2. Frontend Auth Context (`frontend/src/context/AuthContext.jsx`)
- Re-architected with `getSession()` and `onAuthStateChange` listeners.
- Provides standard methods:
  - `login(email, password)`
  - `register(email, password, full_name)`
  - `loginWithGoogle()`
  - `requestPasswordReset(email)`
  - `updatePassword(newPassword)`
  - `updateProfile(data)`
  - `logout()`

### 3. API Client (`frontend/src/api/client.js`)
- Axios request interceptor dynamically retrieves the active Supabase token and attaches `Authorization: Bearer <token>`.

---

## Google OAuth & Dashboard Setup

To enable Google Sign-In and Password Reset emails, complete the following configuration steps in your Supabase project and Google Cloud console:

### 1. Google Cloud Console Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > Credentials**.
3. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
4. Under **Authorized redirect URIs**, add:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
5. Note down the generated **Client ID** and **Client Secret**.

### 2. Supabase Dashboard Setup
1. Open your project on [supabase.com](https://supabase.com/dashboard).
2. Go to **Authentication > Providers > Google**.
3. Toggle Google on and input your Google **Client ID** and **Client Secret**.
4. Go to **Authentication > URL Configuration**:
   - **Site URL**: `http://localhost:5173` (or your production URL)
   - **Redirect URLs**:
     - `http://localhost:5173/dashboard`
     - `http://localhost:5173/reset-password`

### 3. Environment Variables

**Backend (`backend/.env`)**:
```env
SUPABASE_JWT_SECRET=<your-supabase-jwt-secret>
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```
*(Find your JWT Secret in Supabase: Project Settings > API > JWT Settings)*

**Frontend (`frontend/.env`)**:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## Row Level Security (RLS)

With `users.id` matching `auth.uid()`, the Supabase database schema enforces row-level security cleanly:

```sql
alter table users enable row level security;
alter table tasks enable row level security;
alter table study_materials enable row level security;
alter table progress_logs enable row level security;
alter table focus_sessions enable row level security;

create policy "Users manage their own profile" on users for all using (auth.uid() = id);
create policy "Users manage their own tasks" on tasks for all using (auth.uid() = user_id);
create policy "Users manage their own materials" on study_materials for all using (auth.uid() = user_id);
create policy "Users manage their own progress" on progress_logs for all using (auth.uid() = user_id);
create policy "Users manage their own focus sessions" on focus_sessions for all using (auth.uid() = user_id);
```
