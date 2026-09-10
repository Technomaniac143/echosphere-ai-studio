# EchoSphere backend — staged build

Frontend stays as-is. Work is split into three stages so each one can be checked before the next starts.

---

## Stage 1 — Accounts, database, real scores (build now)

**Sign up / sign in**
- Email + password accounts, with a sign-in page and sign-up page.
- Everything after the landing page (profile, setup, interview, report, roadmap, dashboard) requires being signed in; signed-out visitors are sent to sign-in.
- A signed-in person keeps their session across refreshes; sign out from the header.

**Saved data**
Each person's own data, private to them:
- Profile: name, photo, CV name, project link, education, certifications.
- Interviews: company, role, domain, date, status.
- Scores: one overall score per interview plus each skill score.
- Transcript and notes captured during an interview.
- Roadmap progress.

**Replacing the mock data**
- Profile page, dashboard, report and roadmap read from the saved data instead of the built-in sample values and browser storage.
- New accounts start empty, with a friendly "no interviews yet" state rather than fake numbers.
- Scores are produced by the AI (see below) from the interview transcript, not by a hardcoded formula.

**Echo assistant + scoring (Gemini)**
- I'll ask you to paste your Google Gemini API key securely; it is stored server-side and never reaches the browser.
- Scoring: at the end of an interview, the transcript is sent for evaluation and the returned overall + per-skill scores with short justifications are saved to that interview.
- Echo: an assistant that answers questions about the signed-in person's own data ("show me my latest interview scores") by looking up their saved records first, then answering. Text chat in this stage; voice comes in Stage 2.

## Stage 2 — Agora (after Stage 1 is verified)
- Real-time voice/video interview room via Agora, replacing the local-only camera preview.
- Agora Conversational AI drives the spoken interviewer turns; Echo becomes voice-driven ("Hey Echo…").
- Needs an Agora account and credentials, which you don't have yet — I'll ask when we start this stage.

## Stage 3 — Anam AI digital human (after Stage 2)
- Anam avatar rendered as the visible interviewer, lip-synced to the Agora audio.
- Needs an Anam account and key.

---

## Technical notes

- Lovable Cloud provides auth, Postgres and storage. Enabled at the start of Stage 1.
- Tables: `profiles`, `interviews`, `interview_scores` (or a JSONB competency column on `interviews`), `transcript_entries`, `roadmap_progress`. Every table gets explicit grants, RLS enabled, and `auth.uid()`-scoped policies. Candidate photos go to a private storage bucket with owner-scoped policies.
- `handle_new_user` trigger inserts a `profiles` row on sign-up.
- `src/lib/candidate-store.tsx` keeps its current context API but is backed by TanStack Query against server functions, so page components change minimally. localStorage becomes a one-time migration on first sign-in, then is dropped.
- Route protection via a `_authenticated` layout gate; protected loaders live under it. Server functions use `.middleware([requireSupabaseAuth])`.
- Gemini calls go through server functions only; `GEMINI_API_KEY` stored as a secret. Scoring returns a strict JSON schema (overall 0-100, per-competency 0-100 + rationale).
- Echo runs as a tool-calling loop with read-only tools scoped to the caller's rows (latest interview, score history, roadmap status).
