alter table public.sticker_purchases
  add column if not exists pack_id text,
  add column if not exists price_aud numeric(10,2),
  add column if not exists creator_cut_aud numeric(10,2),
  add column if not exists payment_method text;

update public.sticker_purchases set pack_id = sticker_pack_id where pack_id is null;
update public.sticker_purchases set price_aud = amount_aud where price_aud is null;
update public.sticker_purchases set creator_cut_aud = creator_cut where creator_cut_aud is null;
update public.sticker_purchases set payment_method = payment_type where payment_method is null;

alter table public.sticker_purchases
  alter column sticker_pack_id drop not null,
  alter column payment_type drop not null;

alter table public.sticker_purchases
  drop constraint if exists sticker_purchases_payment_type_check;
