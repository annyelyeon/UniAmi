create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_nickname text not null,
  board_name text not null default 'General',
  university text not null,
  content text not null,
  upvote_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_university_created_at_idx
  on public.posts (university, created_at desc);

create index if not exists posts_author_id_idx
  on public.posts (author_id);

alter table public.posts enable row level security;

drop policy if exists "Verified users can read posts from their university" on public.posts;
create policy "Verified users can read posts from their university"
on public.posts
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.verified_university_email <> ''
      and p.university = university
  )
);

drop policy if exists "Users can insert their own posts" on public.posts;
create policy "Users can insert their own posts"
on public.posts
for insert
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.verified_university_email <> ''
      and p.university = university
  )
);