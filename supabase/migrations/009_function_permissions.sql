revoke execute on function public.get_dm_conversations() from public;
grant execute on function public.get_dm_conversations() to authenticated;

revoke execute on function public.get_dm_user_nickname(uuid) from public;
grant execute on function public.get_dm_user_nickname(uuid) to authenticated;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from authenticated;