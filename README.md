# Draft to Admit

Free college essay reviews from a real student who's been through it.

Students submit their Common App and supplemental essays; the reviewer reads
them in an admin dashboard, highlights passages with inline comments, scores
six categories (Uniqueness, Voice, Hook, Authenticity, Flow, Conciseness),
and writes a summary. Students get an email when feedback is ready.

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router, TypeScript)
- [Supabase](https://supabase.com) — Postgres, auth, RLS
- [Tailwind CSS v4](https://tailwindcss.com) + shadcn/ui-style components
- [Resend](https://resend.com) — email notifications

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/migrations/00001_initial_schema.sql`.
   This creates the `profiles`, `essays`, `feedback`, and `inline_comments`
   tables, RLS policies, and a trigger that creates a profile on signup.
3. Copy the project URL and anon key from **Settings → API**.

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | A verified sender, e.g. `Draft to Admit <hello@yourdomain.com>` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, your domain in production |

If `RESEND_API_KEY` is unset, feedback still saves — the email is just skipped.

### 3. Run

```bash
npm install
npm run dev
```

### 4. Make yourself the admin

Sign up through the site, then run in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Your account now sees the **Admin** nav link and the `/admin` routes.

## How it works

| Route | Who | What |
| --- | --- | --- |
| `/` | public | Landing page |
| `/signup`, `/login` | public | Email + password auth via Supabase |
| `/submit` | students | Essay intake form with live word count |
| `/dashboard` | students | All submissions with status + scores |
| `/dashboard/essay/[id]` | students | Annotated essay, scores, summary |
| `/admin` | admin | Queue sorted by submission date, filterable by status |
| `/admin/review/[id]` | admin | Select text → inline comment; score + summarize |

Notes on behavior:

- Opening a pending essay from the admin queue automatically marks it
  **In Review**.
- The overall score is auto-calculated as the average of the six category
  scores.
- Submitting feedback marks the essay **Complete** and emails the student a
  link to their feedback. Re-submitting updates the existing feedback.
- Inline comment positions are stored as `start_index`/`end_index` character
  offsets into the essay text.
- All access control is enforced twice: in middleware/server components and
  by Postgres RLS policies.
