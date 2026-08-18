begin;

drop policy if exists "Authenticated users can view basic profile info" on public.profiles;
create policy "Authenticated users can view basic profile info"
on public.profiles
for select
to authenticated
using (true);

commit;