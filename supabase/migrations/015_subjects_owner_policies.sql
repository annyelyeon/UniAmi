begin;

alter table public.subjects enable row level security;

drop policy if exists "Users can insert their own subjects" on public.subjects;
create policy "Users can insert their own subjects"
on public.subjects
for insert
with check (
  (select auth.uid()) = created_by
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.verified_university_email <> ''
  )
);

drop policy if exists "Users can update their own subjects" on public.subjects;
create policy "Users can update their own subjects"
on public.subjects
for update
using ((select auth.uid()) = created_by)
with check ((select auth.uid()) = created_by);

drop policy if exists "Users can delete their own subjects" on public.subjects;
create policy "Users can delete their own subjects"
on public.subjects
for delete
using ((select auth.uid()) = created_by);

commit;
