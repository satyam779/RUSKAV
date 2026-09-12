-- Grant admin access by email, so you don't have to copy a UUID around.
--
-- 1. Create the user first: Supabase Dashboard -> Authentication -> Users ->
--    Add user (email + password, "Auto Confirm User" ticked).
-- 2. Replace the address below with that user's email and run this.
--
-- Being signed in is not enough on its own — a row in public.admins is what
-- grants write access, and row level security enforces it in the database
-- regardless of what the browser claims.

insert into public.admins (user_id, email)
select id, email
from auth.users
where email = 'you@example.com'   -- <-- change this
on conflict (user_id) do nothing;

-- Confirm it worked. This should list your address.
select a.email, a.created_at from public.admins a;
