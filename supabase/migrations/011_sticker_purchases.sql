create table if not exists public.sticker_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sticker_pack_id text not null,
  payment_type text not null check (payment_type in ('cash', 'gems')),
  amount_aud numeric(10,2) not null default 0,
  creator_cut numeric(10,2) not null default 1.00,
  platform_cut numeric(10,2) not null default 0.20,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create index if not exists sticker_purchases_user_id_idx
  on public.sticker_purchases (user_id, created_at desc);

alter table public.sticker_purchases enable row level security;

create policy "Users can read their own sticker purchases"
on public.sticker_purchases
for select
using (auth.uid() = user_id);

create policy "Users can insert their own sticker purchases"
on public.sticker_purchases
for insert
with check (auth.uid() = user_id);
