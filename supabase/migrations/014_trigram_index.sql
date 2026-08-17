-- Migration 014: Enable pg_trgm and add trigram GIN indexes for fuzzy subject search
begin;

create extension if not exists pg_trgm;

-- For fuzzy searches on subject code and title
create index if not exists subjects_code_trgm_idx on public.subjects using gin (code gin_trgm_ops);
create index if not exists subjects_title_trgm_idx on public.subjects using gin (title gin_trgm_ops);

commit;
