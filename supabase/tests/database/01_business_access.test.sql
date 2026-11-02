-- RLS and privilege tests for profiles, businesses and business_members.
-- Run against the development project: npx supabase test db --linked
-- Everything runs in one transaction and is rolled back.
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

-- Two test users (rolled back at the end).
insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-4000-a000-00000000000a', 'rls-a@ashi.test', '{"full_name": "User A"}'),
  ('00000000-0000-4000-a000-00000000000b', 'rls-b@ashi.test', '{}');

select is(
  (select full_name from public.profiles where id = '00000000-0000-4000-a000-00000000000a'),
  'User A',
  'A profile is created on signup with the full name from metadata'
);

-------------------------------------------------------------------------------
-- As user A
-------------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-00000000000a", "role": "authenticated"}';

select lives_ok(
  $$ select public.create_business('Test Shop A', 'retail') $$,
  'User A can create a business'
);

select is(
  (select count(*)::int from public.businesses),
  1,
  'User A sees exactly their own business'
);

select is(
  (select role from public.business_members),
  'owner',
  'User A is the owner of the new business'
);

select is(
  (select currency::text from public.businesses),
  'MNT',
  'Currency defaults to MNT'
);

select throws_ok(
  $$ select public.create_business('   ', 'retail') $$,
  '22023',
  'INVALID_BUSINESS_NAME',
  'A blank business name is rejected'
);

select throws_ok(
  $$ insert into public.businesses (name, business_type, created_by)
     values ('Direct', 'retail', '00000000-0000-4000-a000-00000000000a') $$,
  '42501',
  null,
  'Businesses cannot be inserted directly (only through create_business)'
);

select throws_ok(
  $$ update public.businesses set next_sale_number = 999 $$,
  '42501',
  null,
  'System-managed business columns cannot be updated by clients'
);

select throws_ok(
  $$ insert into public.business_members (business_id, user_id)
     select id, '00000000-0000-4000-a000-00000000000b' from public.businesses $$,
  '42501',
  null,
  'Members cannot be added directly'
);

select lives_ok(
  $$ update public.businesses set name = 'Renamed Shop A' $$,
  'The owner can rename their business'
);

-------------------------------------------------------------------------------
-- As user B (no business)
-------------------------------------------------------------------------------
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-00000000000b", "role": "authenticated"}';

select is(
  (select count(*)::int from public.businesses),
  0,
  'User B cannot see User A''s business'
);

select is(
  (select count(*)::int from public.business_members),
  0,
  'User B cannot see User A''s membership'
);

select is(
  (select count(*)::int from public.profiles),
  1,
  'User B only sees their own profile'
);

update public.businesses set name = 'Hijacked';

reset role;

select is(
  (select name from public.businesses where created_by = '00000000-0000-4000-a000-00000000000a'),
  'Renamed Shop A',
  'User B cannot rename User A''s business'
);

-------------------------------------------------------------------------------
-- Anonymous (not logged in)
-------------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

select throws_ok(
  $$ select public.create_business('Anon Shop', 'retail') $$,
  '42501',
  null,
  'Anonymous users cannot create businesses'
);

select throws_ok(
  $$ select count(*) from public.businesses $$,
  '42501',
  null,
  'Anonymous users cannot read businesses'
);

reset role;

select * from finish();
rollback;
