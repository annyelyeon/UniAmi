-- Migration 012: Seed additional communities (faculty + clubs)
begin;

insert into public.communities (name, type, description, member_count)
values
  ('Medical', 'faculty', 'Faculty of Medicine', 0),
  ('Art', 'faculty', 'Faculty of Art & Design', 0),
  ('Education', 'faculty', 'Faculty of Education', 0),
  ('Hiking', 'club', 'Hiking and Outdoors Club', 0),
  ('Crochet', 'club', 'Crochet & Crafts Club', 0),
  ('Draw', 'club', 'Drawing & Illustration Club', 0),
  ('Band', 'club', 'Student Band', 0)
on conflict (name) do nothing;

commit;
