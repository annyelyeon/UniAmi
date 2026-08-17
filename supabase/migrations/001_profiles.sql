create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  verified_university_email text not null,
  nickname text not null default '',
  university text not null default '',
  campus text not null default '',
  faculty text not null default '',
  year text not null default '1',
  is_premium boolean not null default false,
  post_count integer not null default 0,
  sticker_packs_owned integer not null default 0,
  gems_balance integer not null default 0,
  joined_clubs text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    verified_university_email,
    nickname,
    university,
    campus,
    faculty,
    year,
    is_premium,
    post_count,
    sticker_packs_owned,
    gems_balance,
    joined_clubs
  ) values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'nickname', ''),
    coalesce(new.raw_user_meta_data->>'university', ''),
    coalesce(new.raw_user_meta_data->>'campus', ''),
    coalesce(new.raw_user_meta_data->>'faculty', ''),
    coalesce(new.raw_user_meta_data->>'year', '1'),
    coalesce((new.raw_user_meta_data->>'isPremium')::boolean, false),
    coalesce((new.raw_user_meta_data->>'postCount')::integer, 0),
    coalesce((new.raw_user_meta_data->>'stickerPacksOwned')::integer, 0),
    coalesce((new.raw_user_meta_data->>'gemsBalance')::integer, 0),
    coalesce(
      (
        select array_agg(value)
        from jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'joinedClubs', '[]'::jsonb)) as value
      ),
      '{}'::text[]
    )
  )
  on conflict (id) do update set
    verified_university_email = excluded.verified_university_email,
    nickname = excluded.nickname,
    university = excluded.university,
    campus = excluded.campus,
    faculty = excluded.faculty,
    year = excluded.year,
    gems_balance = excluded.gems_balance,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create policy "Users can read their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);