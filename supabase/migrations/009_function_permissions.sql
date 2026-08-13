revoke execute on function public.get_dm_conversations() from authenticated, public;

revoke execute on function public.get_dm_user_nickname(uuid) from authenticated, anon, public;

revoke execute on function public.handle_new_user() from anon, public;
revoke execute on function public.handle_new_user() from authenticated;