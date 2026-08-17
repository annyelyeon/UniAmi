-- Migration 011: Create communities and community_memberships
begin;

-- 1) Create communities table
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null check (type in ('faculty','club','general')),
  description text,
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2) Create community_memberships join table
create table if not exists public.community_memberships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (user_id, community_id)
);

-- 3) Triggers to maintain member_count on communities
create or replace function public.increment_community_member_count()
returns trigger as $$
begin
  update public.communities set member_count = member_count + 1 where id = NEW.community_id;
  return NEW;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_community_member_count()
returns trigger as $$
begin
  update public.communities set member_count = greatest(member_count - 1, 0) where id = OLD.community_id;
  return OLD;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_increment_community_member_count on public.community_memberships;
create trigger trg_increment_community_member_count
after insert on public.community_memberships
for each row execute function public.increment_community_member_count();

drop trigger if exists trg_decrement_community_member_count on public.community_memberships;
create trigger trg_decrement_community_member_count
after delete on public.community_memberships
for each row execute function public.decrement_community_member_count();

-- 4) Row Level Security: communities (any verified user can SELECT)
alter table public.communities enable row level security;

drop policy if exists "Verified users can read communities" on public.communities;
create policy "Verified users can read communities"
on public.communities
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.verified_university_email <> ''
  )
);

-- 5) Row Level Security: community_memberships (users can only manage their own rows)
alter table public.community_memberships enable row level security;

drop policy if exists "Users can manage their own memberships" on public.community_memberships;
create policy "Users can manage their own memberships"
on public.community_memberships
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 6) Seed initial communities (do not override existing records)
insert into public.communities (name, type, description, member_count)
values
  ('General', 'general', 'Community for general posts', 0),
  ('Engineering & IT', 'faculty', 'Engineering and IT faculty board', 0),
  ('Business', 'faculty', 'Business faculty board', 0),
  ('IT Society', 'club', 'Example student IT society', 0),
  ('Hiking Club', 'club', 'Example hiking/outdoors club', 0)
on conflict (name) do nothing;

-- 7) Update posts to reference communities instead of board_name
alter table public.posts add column if not exists community_id uuid references public.communities(id);

-- Populate community_id from existing board_name values when possible
update public.posts p
set community_id = c.id
from public.communities c
where p.board_name = c.name;

-- Default any remaining NULL community_id to 'General' if it exists
update public.posts p
set community_id = (
  select id from public.communities where name = 'General' limit 1
)
where p.community_id is null;

-- Remove legacy board_name column
alter table public.posts drop column if exists board_name;

create index if not exists posts_community_id_idx on public.posts (community_id);

commit;
