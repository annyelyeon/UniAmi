create table if not exists public.subjects (
  code text primary key,
  title text not null,
  average_rating numeric(3,1) not null default 0,
  review_count integer not null default 0,
  assessment_type text not null,
  num_assignments integer not null default 0,
  group_project_required boolean not null default false,
  group_size integer,
  prerequisites text[] not null default '{}'::text[]
);

create table if not exists public.subject_reviews (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null references public.subjects(code) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists subject_reviews_subject_code_created_at_idx
  on public.subject_reviews (subject_code, created_at desc);

create index if not exists subject_reviews_author_id_idx
  on public.subject_reviews (author_id);

alter table public.subjects enable row level security;
alter table public.subject_reviews enable row level security;

drop policy if exists "Verified users can read subjects" on public.subjects;
create policy "Verified users can read subjects"
on public.subjects
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.verified_university_email <> ''
  )
);

drop policy if exists "Verified users can read subject reviews" on public.subject_reviews;
create policy "Verified users can read subject reviews"
on public.subject_reviews
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.verified_university_email <> ''
  )
);

drop policy if exists "Users can insert their own subject reviews" on public.subject_reviews;
create policy "Users can insert their own subject reviews"
on public.subject_reviews
for insert
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.verified_university_email <> ''
  )
);

insert into public.subjects (
  code,
  title,
  average_rating,
  review_count,
  assessment_type,
  num_assignments,
  group_project_required,
  group_size,
  prerequisites
) values (
  'COMP3308',
  'Intro to AI',
  4.2,
  128,
  'mixed',
  2,
  true,
  4,
  array['COMP1000', 'MATH1021']
)
on conflict (code) do update set
  title = excluded.title,
  average_rating = excluded.average_rating,
  review_count = excluded.review_count,
  assessment_type = excluded.assessment_type,
  num_assignments = excluded.num_assignments,
  group_project_required = excluded.group_project_required,
  group_size = excluded.group_size,
  prerequisites = excluded.prerequisites;