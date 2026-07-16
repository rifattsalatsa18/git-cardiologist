-- ============================================================================
-- CardiologistAI — Supabase schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`) on a fresh
-- project before using the app. Safe to re-run: guards are included, but if
-- you re-run after editing, drop the old objects first.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, extends auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('patient', 'doctor')),
  phone text,
  assigned_doctor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'App-level profile for every user. role determines whether someone sees the patient or doctor portal.';

-- ---------------------------------------------------------------------------
-- recordings: one row per simulated 30-second scan
-- ---------------------------------------------------------------------------
create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  overall_risk_tier text not null check (overall_risk_tier in ('normal', 'monitor', 'consult')),
  metrics jsonb not null
);

comment on table public.recordings is
  'Simulated scan results. metrics is a JSON blob of mock-generated HRV, audio-sync, AFib/CHF, and pulse-wave data — never real biometric data.';

create index if not exists recordings_patient_id_created_at_idx
  on public.recordings (patient_id, created_at desc);

create index if not exists profiles_assigned_doctor_id_idx
  on public.profiles (assigned_doctor_id);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever someone signs up via Supabase Auth.
-- Expects full_name and role to be passed as user metadata at sign-up time
-- (the app's signup form does this).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, assigned_doctor_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'patient'),
    nullif(new.raw_user_meta_data ->> 'assigned_doctor_id', '')::uuid
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.recordings enable row level security;

-- profiles: a user can always see their own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- profiles: anyone signed in can see the public directory of doctors
-- (needed so a patient can pick their doctor at signup, and so a patient's
-- dashboard can show that doctor's name/contact info)
drop policy if exists "profiles_select_doctors_public" on public.profiles;
create policy "profiles_select_doctors_public"
  on public.profiles for select
  using (role = 'doctor');

-- profiles: a doctor can see the patients assigned to them
drop policy if exists "profiles_select_own_patients" on public.profiles;
create policy "profiles_select_own_patients"
  on public.profiles for select
  using (assigned_doctor_id = auth.uid());

-- profiles: a user can update only their own row
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- recordings: a patient can see and create only their own recordings
drop policy if exists "recordings_select_own" on public.recordings;
create policy "recordings_select_own"
  on public.recordings for select
  using (patient_id = auth.uid());

drop policy if exists "recordings_insert_own" on public.recordings;
create policy "recordings_insert_own"
  on public.recordings for insert
  with check (patient_id = auth.uid());

-- recordings: a doctor can see recordings belonging to their assigned patients
drop policy if exists "recordings_select_assigned_patients" on public.recordings;
create policy "recordings_select_assigned_patients"
  on public.recordings for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = recordings.patient_id
        and p.assigned_doctor_id = auth.uid()
    )
  );

-- ============================================================================
-- Seeding a doctor account for local testing:
-- 1. Sign up through the app's Signup page choosing the "Doctor" role.
-- 2. That's it — the trigger above creates their profiles row automatically.
-- Patients can then select that doctor from the dropdown on the Signup page.
-- ============================================================================
