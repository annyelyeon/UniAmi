create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_sender_recipient_created_at_idx
  on public.messages (sender_id, recipient_id, created_at desc);

create index if not exists messages_recipient_sender_created_at_idx
  on public.messages (recipient_id, sender_id, created_at desc);

alter table public.messages enable row level security;

drop policy if exists "Users can read their own messages" on public.messages;
create policy "Users can read their own messages"
on public.messages
for select
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users can insert messages as themselves" on public.messages;
create policy "Users can insert messages as themselves"
on public.messages
for insert
with check (auth.uid() = sender_id);

create or replace function public.get_dm_conversations()
returns table (
  other_user_id uuid,
  other_nickname text,
  last_message text,
  last_message_created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with latest_messages as (
    select distinct on (other_user_id)
      other_user_id,
      body as last_message,
      created_at as last_message_created_at
    from (
      select
        case
          when sender_id = auth.uid() then recipient_id
          else sender_id
        end as other_user_id,
        body,
        created_at
      from public.messages
      where sender_id = auth.uid() or recipient_id = auth.uid()
    ) dm_messages
    order by other_user_id, created_at desc
  )
  select
    latest_messages.other_user_id,
    p.nickname as other_nickname,
    latest_messages.last_message,
    latest_messages.last_message_created_at
  from latest_messages
  join public.profiles p on p.id = latest_messages.other_user_id
  order by latest_messages.last_message_created_at desc;
$$;

create or replace function public.get_dm_user_nickname(target_user_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce((select nickname from public.profiles where id = target_user_id), 'Student');
$$;