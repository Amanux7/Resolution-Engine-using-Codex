-- Resolution Engine hosted prototype schema.
-- Apply in Supabase SQL Editor or with `supabase db push` before deploying.
-- All application access is server-side with the service-role key; browser
-- clients receive neither database credentials nor storage bucket access.

create table if not exists public.resolution_cases (
  id text primary key,
  user_id text not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  payload jsonb not null
);

create table if not exists public.resolution_evidence (
  id text primary key,
  case_id text not null references public.resolution_cases(id) on delete cascade,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  payload jsonb not null
);

create table if not exists public.resolution_facts (
  id text primary key,
  case_id text not null references public.resolution_cases(id) on delete cascade,
  source_id text,
  created_at timestamptz not null,
  payload jsonb not null
);

create table if not exists public.resolution_timeline_events (
  id text primary key,
  case_id text not null references public.resolution_cases(id) on delete cascade,
  created_at timestamptz not null,
  payload jsonb not null
);

create table if not exists public.resolution_conflicts (
  id text primary key,
  case_id text not null references public.resolution_cases(id) on delete cascade,
  created_at timestamptz not null,
  payload jsonb not null
);

create table if not exists public.resolution_missing_information (
  id text primary key,
  case_id text not null references public.resolution_cases(id) on delete cascade,
  created_at timestamptz not null,
  payload jsonb not null
);

create table if not exists public.resolution_recommendations (
  id text primary key,
  case_id text not null references public.resolution_cases(id) on delete cascade,
  status text not null,
  created_at timestamptz not null,
  payload jsonb not null
);

create table if not exists public.resolution_action_packages (
  id text primary key,
  case_id text not null references public.resolution_cases(id) on delete cascade,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  payload jsonb not null
);

create index if not exists resolution_cases_user_created_idx on public.resolution_cases(user_id, created_at desc);
create index if not exists resolution_evidence_case_created_idx on public.resolution_evidence(case_id, created_at);
create index if not exists resolution_facts_case_source_idx on public.resolution_facts(case_id, source_id);
create index if not exists resolution_timeline_case_created_idx on public.resolution_timeline_events(case_id, created_at);
create index if not exists resolution_conflicts_case_created_idx on public.resolution_conflicts(case_id, created_at);
create index if not exists resolution_missing_case_created_idx on public.resolution_missing_information(case_id, created_at);
create index if not exists resolution_recommendations_case_created_idx on public.resolution_recommendations(case_id, created_at desc);
create index if not exists resolution_packages_case_created_idx on public.resolution_action_packages(case_id, created_at desc);

alter table public.resolution_cases enable row level security;
alter table public.resolution_evidence enable row level security;
alter table public.resolution_facts enable row level security;
alter table public.resolution_timeline_events enable row level security;
alter table public.resolution_conflicts enable row level security;
alter table public.resolution_missing_information enable row level security;
alter table public.resolution_recommendations enable row level security;
alter table public.resolution_action_packages enable row level security;

-- Private bucket. Do not add public SELECT policies for uploaded evidence.
insert into storage.buckets (id, name, public)
values ('resolution-evidence', 'resolution-evidence', false)
on conflict (id) do update set public = false;
