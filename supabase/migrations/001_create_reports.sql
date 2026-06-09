-- Reports table for AI 紫微命盘报告 MVP.
-- Run this in the Supabase SQL editor or via `supabase db push` before setting REPORT_STORE=supabase.

create table if not exists public.reports (
  id text primary key,
  access_token text not null,
  birth_info jsonb not null,
  chart_data jsonb not null,
  ai_summary text,
  ai_highlights jsonb not null default '[]'::jsonb,
  ai_full_report jsonb,
  status text not null check (status in ('free', 'paid', 'failed')),
  metadata jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists reports_access_token_idx on public.reports (access_token);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_status_idx on public.reports (status);