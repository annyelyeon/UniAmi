-- Combined migration: subjects RLS (created_by) + update/delete policies + pg_trgm indexes
begin;

-- 1) Add created_by column if missing
alter table public.subjects
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- Ensure RLS is enabled
alter table public.subjects enable row level security;

…-- 6) Trigram extension + GIN trigram indexes for fuzzy search
create extension if not exists pg_trgm;

create index if not exists subjects_code_trgm_idx
  on public.subjects using gin (code gin_trgm_ops);

create index if not exists subjects_title_trgm_idx
  on public.subjects using gin (title gin_trgm_ops);

commit;