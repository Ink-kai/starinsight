-- Reports table for Vercel/Supabase production storage.
-- Apply this migration in the Supabase SQL editor before setting REPORT_STORE=supabase.

create extension if not exists pgcrypto;

create table if not exists public.reports (
  id text primary key,
  access_token text not null unique,
  birth_info jsonb not null,
  chart_data jsonb not null,
  ai_summary text not null default '',
  ai_highlights jsonb not null default '[]'::jsonb,
  ai_full_report jsonb,
  status text not null default 'free' check (status in ('free', 'paid', 'failed')),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_access_token_idx on public.reports (access_token);

create or replace function public.set_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row
execute function public.set_reports_updated_at();

alter table public.reports enable row level security;

-- The application uses SUPABASE_SERVICE_ROLE_KEY from server-side code only.
-- Do not expose service role credentials to browsers or NEXT_PUBLIC_* variables.
