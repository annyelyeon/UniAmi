create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_code text not null,
  day text not null,
  color_tag text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  category_icon text,
  attached_sticker_pack text,
  created_at timestamptz not null default now()
);

create index if not exists timetable_entries_user_id_idx
  on public.timetable_entries (user_id);

create index if not exists timetable_entries_user_id_day_idx
  on public.timetable_entries (user_id, day);

create index if not exists notes_user_id_created_at_idx
  on public.notes (user_id, created_at desc);

alter table public.timetable_entries enable row level security;
alter table public.notes enable row level security;

drop policy if exists "Users can manage their own timetable entries" on public.timetable_entries;
create policy "Users can manage their own timetable entries"
on public.timetable_entries
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own timetable entries" on public.timetable_entries;
create policy "Users can insert their own timetable entries"
on public.timetable_entries
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own timetable entries" on public.timetable_entries;
create policy "Users can update their own timetable entries"
on public.timetable_entries
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own timetable entries" on public.timetable_entries;
create policy "Users can delete their own timetable entries"
on public.timetable_entries
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can manage their own notes" on public.notes;
create policy "Users can manage their own notes"
on public.notes
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notes" on public.notes;
create policy "Users can insert their own notes"
on public.notes
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notes" on public.notes;
create policy "Users can update their own notes"
on public.notes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes"
on public.notes
for delete
using (auth.uid() = user_id);