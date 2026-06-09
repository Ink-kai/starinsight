-- Enable Row Level Security on reports table
-- Application uses SUPABASE_SERVICE_ROLE_KEY on the server side to bypass RLS
-- Do NOT create public read/write policies
alter table public.reports enable row level security;