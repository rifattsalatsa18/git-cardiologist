# CardiologistAI

An open-source, **high-fidelity prototype** of a remote cardiovascular pre-screening
experience — the kind of app that could one day use a phone or laptop camera and
microphone for lightweight heart screening. Every metric it shows (heart-rate
trace, audio-sync score, AFib/CHF risk indicators, pulse-wave analysis) is produced
by a mock data generator, not a real signal-processing pipeline.

> **This is a portfolio/educational project.** It performs no real medical
> diagnosis, contains no payment features, and should never be presented to real
> users as an actual screening tool. A persistent banner and in-report copy make
> this clear throughout the app — please don't remove them if you fork this.

## Tech stack

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first config via `@tailwindcss/vite`, no `tailwind.config.js` needed)
- **Supabase** (Postgres + Auth) for accounts, roles, and storing simulated scan history
- **React Router v7**, **Recharts v3**, **lucide-react** icons

All dependencies are pinned to their latest versions as of this project's creation
(see `package.json`). This sandbox has no network access, so packages have **not**
been installed here — you'll need to run `npm install` yourself (see below).

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your project and run the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql). This creates the `profiles` and
   `recordings` tables, a trigger that auto-creates a profile on signup, and all
   Row Level Security policies.
3. Go to **Settings → API** and copy your **Project URL** and **anon public key**.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` (already scaffolded with empty values) and
fill in the two Supabase values:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

`.env.local` is already gitignored — it will never be committed. Never put a
`service_role` / secret key in a `VITE_`-prefixed variable, since those are bundled
into the client-side JavaScript.

By default, Supabase requires email confirmation before login — you can turn this
off for local testing under **Authentication → Providers → Email** if you'd rather
skip confirmation emails while developing.

## 3. Install and run

Requires **Node.js 22.12+**.

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a production build in
`dist/`, and `npm run lint` runs a TypeScript type-check with no emit.

## 4. Try it out

1. Sign up as a **Doctor** first — this makes that account appear in the doctor
   picker on the patient signup form. (The trigger in `schema.sql` creates their
   profile automatically.)
2. Sign up as a **Patient**, optionally assigning yourself to the doctor you just
   created.
3. From the patient dashboard, click **Start a new scan** to run through the
   30-second simulated recording flow (camera/microphone access is requested for
   visual realism only — if you deny it or none is available, the simulation still
   runs). You'll land on a generated report with charts and next-step advice.
4. Log in as the doctor to see that patient show up on the doctor dashboard, with
   full access to their simulated recording history.

## Project structure

```
src/
  components/       Navbar, disclaimer banner, route guard, chart & UI pieces
  contexts/          AuthContext — Supabase session/profile state
  lib/               Supabase client, shared types, mockDataGenerator.ts
  pages/
    patient/         Dashboard, recording session, report view
    doctor/          Dashboard, patient detail view
supabase/
  schema.sql         Tables, trigger, and Row Level Security policies
```

The entire simulation lives in `src/lib/mockDataGenerator.ts` — that's the one file
to look at if you want to understand (or change) how the fake metrics are produced.

## Notes on the database design

- `profiles.role` is `'patient'` or `'doctor'`, set at signup and never changed by
  the UI.
- `profiles.assigned_doctor_id` links a patient to one doctor. Patients can leave
  this unset and pick one later by re-running the signup flow's logic manually in
  Supabase, or you can extend the dashboard to let them change it after the fact.
- Row Level Security ensures patients only ever see their own recordings, and
  doctors only ever see recordings belonging to patients assigned to them.
