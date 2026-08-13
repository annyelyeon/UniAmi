alter policy "Users can read their own profile"
on public.profiles
using ((select auth.uid()) = id);

alter policy "Users can update their own profile"
on public.profiles
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

alter policy "Verified users can read posts from their university"
on public.posts
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.verified_university_email <> ''
      and p.university = university
  )
);

alter policy "Users can insert their own posts"
on public.posts
with check (
  (select auth.uid()) = author_id
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.verified_university_email <> ''
      and p.university = university
  )
);

alter policy "Verified users can read subjects"
on public.subjects
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.verified_university_email <> ''
  )
);

alter policy "Verified users can read subject reviews"
on public.subject_reviews
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.verified_university_email <> ''
  )
);

alter policy "Users can insert their own subject reviews"
on public.subject_reviews
with check (
  (select auth.uid()) = author_id
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.verified_university_email <> ''
  )
);

alter policy "Users can manage their own timetable entries"
on public.timetable_entries
using ((select auth.uid()) = user_id);

alter policy "Users can insert their own timetable entries"
on public.timetable_entries
with check ((select auth.uid()) = user_id);

alter policy "Users can update their own timetable entries"
on public.timetable_entries
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

alter policy "Users can delete their own timetable entries"
on public.timetable_entries
using ((select auth.uid()) = user_id);

alter policy "Users can manage their own notes"
on public.notes
using ((select auth.uid()) = user_id);

alter policy "Users can insert their own notes"
on public.notes
with check ((select auth.uid()) = user_id);

alter policy "Users can update their own notes"
on public.notes
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

alter policy "Users can delete their own notes"
on public.notes
using ((select auth.uid()) = user_id);

alter policy "Users can read their own messages"
on public.messages
using ((select auth.uid()) = sender_id or (select auth.uid()) = recipient_id);

alter policy "Users can insert messages as themselves"
on public.messages
with check ((select auth.uid()) = sender_id);