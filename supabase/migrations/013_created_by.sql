-- Migration 013: Add created_by to subjects and update RLS to allow INSERT/DELETE rules
begin;

-- 1) Add created_by column referencing profiles
alter table public.subjects
add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- 2) Allow verified users to INSERT subjects, but require created_by = auth.uid()
drop policy if exists "Verified users can insert subjects" on public.subjects;
create policy "Verified users can insert subjects"
on public.subjects
for insert
with check (
auth.uid() = created_by
and exists (
select 1
from public.profiles p
where p.id = auth.uid()
and p.verified_university_email <> ''
)
);

-- 3) Allow delete only for the user who created the subject
drop policy if exists "Users can delete their own subjects" on public.subjects;
create policy "Users can delete their own subjects"
on public.subjects
for delete
using (
created_by = auth.uid()
);

commit;