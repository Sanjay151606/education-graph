# Antigravity Prompt — Login Page: Forgot Password + Google Sign-In

Adding Google sign-in and a real forgot-password flow forces a decision that's been flagged
as unresolved since the original scaffold: this repo currently issues its own JWTs from
FastAPI, but Supabase Auth already handles email/password, password-reset emails, and OAuth
providers (including Google) out of the box. Hand-rolling Google OAuth + transactional reset
emails in FastAPI is significantly more work and more places to get security wrong than using
what Supabase already provides. This prompt migrates auth to **Supabase Auth** and has FastAPI
verify Supabase-issued tokens instead of minting its own — resolving the RLS/auth mismatch
noted in `supabase_schema.sql` at the same time.

---

```
You are working inside the existing "BrainGraph" full-stack project (React + Vite + Tailwind
frontend, FastAPI + SQLAlchemy backend, Supabase Postgres). Do not restart the project —
extend it. Read /backend/app/auth.py, /frontend/src/context/AuthContext.jsx, and
/database/supabase_schema.sql first — this task replaces the custom-JWT auth in those files.

GOAL
Migrate authentication to Supabase Auth (email/password + Google OAuth), and build a proper
Login page with a working "Forgot password?" flow and a "Continue with Google" option, styled
consistently with the rest of the app.

BACKEND WORK (/backend/app)

1. Remove the custom JWT issuance in auth.py (create_access_token, the password hashing/
   verification against a locally-stored hashed_password). Supabase Auth now owns credentials
   entirely — the `users` table should no longer store `hashed_password`.

2. Add Supabase JWT verification instead: a `get_current_user` dependency that reads the
   `Authorization: Bearer <supabase_access_token>` header, verifies it against Supabase's
   JWT secret (from settings), and extracts the Supabase user id + email from the token
   claims. On first sight of a given Supabase user id, upsert a row into the `users` table
   (id = Supabase auth user id, email, full_name from token metadata, default ADHD profile
   fields) so the rest of the app's foreign keys (tasks, materials, progress_logs, etc.)
   keep working unchanged.

3. Update models.py: drop `hashed_password` from the User model; `id` should now equal the
   Supabase Auth user id (uuid) rather than being independently generated.

4. Simplify routers/auth.py to just:
   - GET /api/auth/me -> returns the current user's BrainGraph profile (existing behavior,
     just now backed by Supabase-verified auth instead of a custom token).
   - PATCH /api/auth/me -> update ADHD profile fields (focus_span_minutes,
     preferred_content_style, difficulty_level, reminders_enabled) — add this if it doesn't
     already exist.
   Remove /api/auth/register and /api/auth/login entirely — registration and login now
   happen client-side via the Supabase JS SDK.

5. Update /database/supabase_schema.sql: drop the `hashed_password` column from `users`,
   change `users.id` to reference `auth.users(id)` (Supabase's built-in auth table) via a
   foreign key, and rewrite the RLS policies to use `auth.uid() = user_id` (or `auth.uid() =
   id` on the users table itself) now that this actually matches how auth works — remove the
   placeholder caveat comment at the top of the file since this resolves it.

FRONTEND WORK (/frontend/src)

1. Add a Supabase client singleton at src/api/supabaseClient.js using
   `@supabase/supabase-js` and the existing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env
   vars (already in .env.example).

2. Rewrite context/AuthContext.jsx to wrap Supabase Auth instead of the custom token flow:
   - On mount, call `supabase.auth.getSession()` and subscribe to
     `supabase.auth.onAuthStateChange` to keep `user`/`session` in sync.
   - `login(email, password)` -> `supabase.auth.signInWithPassword(...)`.
   - `register(email, password, full_name)` -> `supabase.auth.signUp({ email, password,
     options: { data: { full_name } } })`.
   - `loginWithGoogle()` -> `supabase.auth.signInWithOAuth({ provider: 'google', options: {
     redirectTo: window.location.origin + '/dashboard' } })`.
   - `requestPasswordReset(email)` -> `supabase.auth.resetPasswordForEmail(email, {
     redirectTo: window.location.origin + '/reset-password' })`.
   - `updatePassword(newPassword)` -> `supabase.auth.updateUser({ password: newPassword })`,
     used by the reset-password page after the user arrives via the recovery link.
   - `logout()` -> `supabase.auth.signOut()`.

3. Update src/api/client.js: attach the Supabase session's `access_token` as the Bearer token
   on every request (read it from `supabase.auth.getSession()`), replacing the old
   `bg_token` localStorage lookup.

4. Redesign src/pages/Login.jsx:
   - Email + password fields, primary "Log in" button (existing style).
   - A "Forgot password?" link under the password field, routing to /forgot-password.
   - A divider ("or") below the form, then a "Continue with Google" button (Google "G" icon
     + label, neutral white/bordered button per Google's brand guidelines — do not recolor
     the G logo) calling `loginWithGoogle()`.
   - Keep the existing "No account? Sign up" link to /register.
   - Surface Supabase auth errors (invalid credentials, unconfirmed email, etc.) in the
     existing error-message style.

5. Add src/pages/ForgotPassword.jsx:
   - Single email field + "Send reset link" button calling `requestPasswordReset(email)`.
   - On success, replace the form with a confirmation message ("If an account exists for
     that email, we've sent a reset link.") — don't reveal whether the email is registered.
   - Link back to /login.

6. Add src/pages/ResetPassword.jsx:
   - This page is the `redirectTo` target from the reset email; Supabase puts the recovery
     session in the URL automatically via the JS SDK once the page loads with the
     access_token in the hash — read the session via `supabase.auth.getSession()` /
     `onAuthStateChange` listening for the `PASSWORD_RECOVERY` event before showing the form.
   - New password + confirm-password fields, client-side match validation, "Update password"
     button calling `updatePassword(newPassword)`, then redirect to /dashboard on success.
   - If no valid recovery session is present, show a friendly "This link has expired or is
     invalid" message with a link back to /forgot-password.

7. Wire new routes in App.jsx: /forgot-password and /reset-password (both public, not
   wrapped in the `Private` guard). Also add a route Supabase's Google OAuth redirect can land
   on if you don't reuse /dashboard directly — /dashboard is fine as-is since AuthContext's
   onAuthStateChange will pick up the new session automatically.

8. Match existing visual language: same rounded-2xl white card, same input/button classes
   already used in Login.jsx and Register.jsx — don't introduce a new design pattern for
   these new pages.

CONFIGURATION (manual steps outside code — call these out clearly in your response, don't try
to script them)
- In the Supabase dashboard: Authentication > Providers > enable Google, with an OAuth Client
  ID/Secret from Google Cloud Console, and set the authorized redirect URI to
  `https://<project-ref>.supabase.co/auth/v1/callback`.
- In Authentication > URL Configuration: add the app's forgot/reset-password and dashboard
  URLs to the allowed redirect list.
- In Authentication > Email Templates: the default "Reset password" template works out of the
  box; customize copy/branding later if desired.

CONSTRAINTS
- Never store or transmit a raw password anywhere in FastAPI — Supabase Auth owns credential
  storage entirely now.
- Don't reveal whether a given email is registered on the forgot-password screen (standard
  enumeration-prevention practice) — same generic confirmation message regardless of outcome.
- Every existing protected endpoint that used `Depends(auth.get_current_user)` keeps working
  unchanged in signature — only the internals of that dependency change (Supabase JWT
  verification instead of custom JWT decode).
- Update backend/.env.example and frontend/.env.example if any new env vars are needed
  (e.g. SUPABASE_JWT_SECRET on the backend).
- Update /docs/AI_FEATURES.md or a new /docs/AUTH.md briefly noting the migration to Supabase
  Auth and that Google OAuth requires the dashboard configuration above before it'll work in
  a deployed environment.

Start by confirming the updated `users` table shape and the `get_current_user` verification
approach before touching the frontend.
```

---

### Notes before you run this
- This is a real architecture change, not just a new page — it removes password storage and
  custom JWT logic from FastAPI entirely in favor of Supabase Auth. That's the right call once
  Google sign-in and password-reset emails are in scope, but it touches every protected
  endpoint's auth dependency, so review the diff carefully rather than assuming it's additive.
- Google OAuth **will not work** until the Supabase dashboard + Google Cloud Console steps
  listed under CONFIGURATION are done manually — no prompt can automate third-party console
  setup, so budget time for that before testing the Google button end-to-end.
- This also finally resolves the "custom JWT vs Supabase Auth" ambiguity flagged in earlier
  prompts around `supabase_schema.sql`'s RLS policies — worth mentioning if you run the
  earlier Assessment or English Proficiency prompts after this one, since they should now
  assume Supabase Auth is the source of truth for `user_id`.
