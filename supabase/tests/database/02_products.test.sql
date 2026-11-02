-- Products, opening stock and RLS tests.
-- Run against the development project: npx supabase test db --linked
-- Everything runs in one transaction and is rolled back.
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id, email)
values
  ('00000000-0000-4000-a000-0000000000c1', 'products-a@ashi.test'),
  ('00000000-0000-4000-a000-0000000000c2', 'products-b@ashi.test');

-------------------------------------------------------------------------------
-- As user A
-------------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-0000000000c1", "role": "authenticated"}';

select public.create_business('Products Shop A', 'retail');

select lives_ok(
  $$ select public.create_product(
       (select id from public.businesses), 'Water 0.5l', 1500, 900, 'pcs', 24, 'W-05', '8650001'
     ) $$,
  'A member can create a product with opening stock'
);

select is(
  (select current_stock from public.products where sku = 'W-05'),
  24.000::numeric(12,3),
  'Opening stock sets current_stock'
);

select is(
  (select avg_cost from public.products where sku = 'W-05'),
  900::numeric(14,4),
  'Average cost starts at the cost price'
);

select results_eq(
  $$ select type, quantity_change, stock_after from public.inventory_transactions $$,
  $$ values ('opening_stock'::text, 24.000::numeric(12,3), 24.000::numeric(12,3)) $$,
  'An opening_stock movement is recorded'
);

select lives_ok(
  $$ select public.create_product((select id from public.businesses), 'Gift card', 5000) $$,
  'A product without opening stock can be created'
);

select is(
  (select count(*)::int from public.inventory_transactions),
  1,
  'No movement is recorded without opening stock'
);

select throws_ok(
  $$ select public.create_product((select id from public.businesses), 'Rice', 3000, 0, 'pcs', 1.5) $$,
  '22023',
  'QUANTITY_MUST_BE_WHOLE',
  'Pieces must be whole numbers'
);

select lives_ok(
  $$ select public.create_product((select id from public.businesses), 'Rice', 3000, 0, 'kg', 1.5) $$,
  'Kilograms can be fractional'
);

select throws_ok(
  $$ select public.create_product((select id from public.businesses), 'Copy', 100, 0, 'pcs', 0, 'W-05') $$,
  '23505',
  null,
  'SKUs are unique within a business'
);

select throws_ok(
  $$ select public.create_product((select id from public.businesses), '  ', 100) $$,
  '22023',
  'INVALID_PRODUCT_NAME',
  'A blank product name is rejected'
);

select throws_ok(
  $$ update public.products set current_stock = 999 $$,
  '42501',
  null,
  'Stock cannot be changed directly'
);

select throws_ok(
  $$ insert into public.inventory_transactions
       (business_id, product_id, type, quantity_change, stock_after, created_by)
     select business_id, id, 'adjustment', 5, 29, '00000000-0000-4000-a000-0000000000c1'
     from public.products where sku = 'W-05' $$,
  '42501',
  null,
  'Movements cannot be inserted directly'
);

select lives_ok(
  $$ update public.products set selling_price = 1800, is_active = false where sku = 'W-05' $$,
  'A member can edit prices and archive a product'
);

select throws_ok(
  $$ delete from public.products $$,
  '42501',
  null,
  'Products cannot be deleted (archive instead)'
);

-------------------------------------------------------------------------------
-- As user B (no business)
-------------------------------------------------------------------------------
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-0000000000c2", "role": "authenticated"}';

select is(
  (select count(*)::int from public.products),
  0,
  'User B cannot see User A''s products'
);

select throws_ok(
  $$ select public.create_product(
       (select id from public.businesses where name = 'Products Shop A'), 'Intruder', 1
     ) $$,
  '42501',
  null,
  'Non-members cannot create products in another business'
);

reset role;

select * from finish();
rollback;
