-- ============================================================
-- AETHER — Supabase schema
-- Run this once in the Supabase SQL Editor for your project.
-- ============================================================

-- ── Rehabilitation activities ────────────────────────────────
create table if not exists public.rehab_activities (
  id                  text        primary key,
  zone_id             text        not null,
  date                date        not null,
  status              text        not null
                        check (status in ('Planned','Active','Under Review','Completed')),
  action_category     text        not null,
  recommendation_name text        not null,
  recommendation_text text,
  action_taken        text,
  implementing_unit   text,
  area_covered_ha     numeric,
  evidence_ref        text,
  officer_name        text,
  source              text        not null default 'logged'
                        check (source in ('seed','logged')),
  created_at          timestamptz not null default now()
);

create index if not exists rehab_activities_zone_id_idx
  on public.rehab_activities (zone_id);

create index if not exists rehab_activities_date_idx
  on public.rehab_activities (date desc);

-- ── Zone assessments ─────────────────────────────────────────
create table if not exists public.zone_assessments (
  id                   uuid        primary key default gen_random_uuid(),
  zone_id              text        not null,
  recommendation_index integer     not null,
  recommendation_text  text,
  date                 date        not null,
  status               text        not null
                         check (status in ('Planned','Ongoing','Completed')),
  unit                 text        not null,
  officer              text,
  action               text        not null,
  area_ha              numeric,
  evidence_ref         text,
  notes                text,
  validated_items      text[]      not null default '{}',
  created_at           timestamptz not null default now()
);

create index if not exists zone_assessments_zone_id_idx
  on public.zone_assessments (zone_id);

create index if not exists zone_assessments_date_idx
  on public.zone_assessments (date desc);

-- Drop area_covered_ha and evidence_ref columns (removed from UI)
alter table public.rehab_activities  drop column if exists area_covered_ha;
alter table public.rehab_activities  drop column if exists evidence_ref;
alter table public.zone_assessments  drop column if exists area_ha;
alter table public.zone_assessments  drop column if exists evidence_ref;
alter table public.rehab_activities  enable row level security;
alter table public.zone_assessments  enable row level security;

-- Drop existing policies first so re-running this script never errors
drop policy if exists "anon read rehab_activities"   on public.rehab_activities;
drop policy if exists "anon insert rehab_activities" on public.rehab_activities;
drop policy if exists "anon delete rehab_activities" on public.rehab_activities;
drop policy if exists "anon read zone_assessments"   on public.zone_assessments;
drop policy if exists "anon insert zone_assessments" on public.zone_assessments;
drop policy if exists "anon delete zone_assessments" on public.zone_assessments;

create policy "anon read rehab_activities"
  on public.rehab_activities for select using (true);

create policy "anon insert rehab_activities"
  on public.rehab_activities for insert with check (true);

create policy "anon delete rehab_activities"
  on public.rehab_activities for delete using (true);

create policy "anon read zone_assessments"
  on public.zone_assessments for select using (true);

create policy "anon insert zone_assessments"
  on public.zone_assessments for insert with check (true);

create policy "anon delete zone_assessments"
  on public.zone_assessments for delete using (true);
