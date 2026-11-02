-- Sales: stock, totals, idempotency, payments, cancellation and RLS.
-- Run against the development project: npx supabase test db --linked
-- Everything runs in one transaction and is rolled back.
begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

insert into auth.users (id, email)
values
  ('00000000-0000-4000-a000-0000000000d1', 'sales-a@ashi.test'),
  ('00000000-0000-4000-a000-0000000000d2', 'sales-b@ashi.test');

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-0000000000d1", "role": "authenticated"}';

select public.create_business('Sales Shop A', 'retail');
select public.create_product((select id from public.businesses), 'Water', 1500, 900, 'pcs', 10, 'W');
select public.create_product((select id from public.businesses), 'Rice', 3000, 2000, 'kg', 5.5, 'R');

-------------------------------------------------------------------------------
-- create_sale
-------------------------------------------------------------------------------

select lives_ok(
  $$ select public.create_sale(
       (select id from public.businesses),
       '00000000-0000-4000-b000-000000000001',
       jsonb_build_array(
         jsonb_build_object('product_id', (select id from public.products where sku = 'W'), 'quantity', 3),
         jsonb_build_object('product_id', (select id from public.products where sku = 'R'), 'quantity', 1.5)
       ),
       500, 4000, 'cash', 'Bold'
     ) $$,
  'A sale with two lines, a discount and a partial payment can be created'
);

select results_eq(
  $$ select sale_number, subtotal, discount_amount, total_amount, total_cost, amount_paid, balance_due
     from public.sales $$,
  $$ values (1, 9000.00::numeric(14,2), 500.00::numeric(14,2), 8500.00::numeric(14,2),
             5700.00::numeric(14,2), 4000.00::numeric(14,2), 4500.00::numeric(14,2)) $$,
  'Totals follow rules 5.2.1–5.2.6 (3×1500 + 1.5×3000 − 500; cost 3×900 + 1.5×2000)'
);

select is(
  (select current_stock from public.products where sku = 'W'),
  7.000::numeric(12,3),
  'Stock goes down by the quantity sold'
);

select is(
  (select stock_after from public.inventory_transactions where type = 'sale'
     and product_id = (select id from public.products where sku = 'R')),
  4.000::numeric(12,3),
  'The sale movement records the balance after'
);

select is(
  (select sum(amount) from public.sale_payments),
  4000.00::numeric,
  'The partial payment is recorded'
);

select is(
  (select sale_number from public.create_sale(
     (select id from public.businesses),
     '00000000-0000-4000-b000-000000000001',
     jsonb_build_array(jsonb_build_object('product_id', (select id from public.products where sku = 'W'), 'quantity', 3))
   )),
  1,
  'Retrying with the same client_request_id returns the same sale'
);

select is(
  (select current_stock from public.products where sku = 'W'),
  7.000::numeric(12,3),
  'A retry does not change stock again'
);

select throws_ok(
  $$ select public.create_sale(
       (select id from public.businesses), gen_random_uuid(),
       jsonb_build_array(jsonb_build_object('product_id', (select id from public.products where sku = 'W'), 'quantity', 8))
     ) $$,
  '22023',
  'INSUFFICIENT_STOCK',
  'Selling more than the stock is rejected'
);

select throws_ok(
  $$ select public.create_sale(
       (select id from public.businesses), gen_random_uuid(),
       jsonb_build_array(jsonb_build_object('product_id', (select id from public.products where sku = 'W'), 'quantity', 1.5))
     ) $$,
  '22023',
  'QUANTITY_MUST_BE_WHOLE',
  'Pieces must be sold in whole numbers'
);

select throws_ok(
  $$ select public.create_sale((select id from public.businesses), gen_random_uuid(), '[]'::jsonb) $$,
  '22023',
  'EMPTY_SALE',
  'An empty cart is rejected'
);

select throws_ok(
  $$ select public.create_sale(
       (select id from public.businesses), gen_random_uuid(),
       jsonb_build_array(jsonb_build_object('product_id', (select id from public.products where sku = 'W'), 'quantity', 1)),
       2000
     ) $$,
  '22023',
  'INVALID_DISCOUNT',
  'A discount above the subtotal is rejected'
);

select is(
  (select next_sale_number from public.businesses),
  2,
  'Failed sales do not use up a sale number'
);

select throws_ok(
  $$ insert into public.sales (business_id, sale_number, client_request_id, subtotal, total_amount, created_by)
     select id, 99, gen_random_uuid(), 0, 0, '00000000-0000-4000-a000-0000000000d1' from public.businesses $$,
  '42501',
  null,
  'Sales cannot be inserted directly'
);

-------------------------------------------------------------------------------
-- add_sale_payment
-------------------------------------------------------------------------------

select throws_ok(
  $$ select public.add_sale_payment((select id from public.sales), 5000) $$,
  '22023',
  'INVALID_PAYMENT',
  'A payment above the balance is rejected'
);

select is(
  (select balance_due from public.add_sale_payment((select id from public.sales), 4500, 'bank_transfer')),
  0.00::numeric(14,2),
  'A later payment clears the balance'
);

-------------------------------------------------------------------------------
-- cancel_sale
-------------------------------------------------------------------------------

select lives_ok(
  $$ select public.cancel_sale((select id from public.sales), 'Customer changed their mind') $$,
  'A completed sale can be cancelled'
);

select is(
  (select current_stock from public.products where sku = 'W'),
  10.000::numeric(12,3),
  'Cancelling restores stock'
);

select is(
  (select sum(amount) from public.sale_payments),
  0.00::numeric,
  'Cancelling refunds every payment'
);

select results_eq(
  $$ select status, amount_paid from public.sales $$,
  $$ values ('cancelled'::text, 0.00::numeric(14,2)) $$,
  'The sale is kept and marked cancelled'
);

select throws_ok(
  $$ select public.cancel_sale((select id from public.sales)) $$,
  '22023',
  'SALE_ALREADY_CANCELLED',
  'A sale cannot be cancelled twice'
);

-------------------------------------------------------------------------------
-- As user B (no business)
-------------------------------------------------------------------------------
set local request.jwt.claims to '{"sub": "00000000-0000-4000-a000-0000000000d2", "role": "authenticated"}';

select is(
  (select count(*)::int from public.sales),
  0,
  'User B cannot see User A''s sales'
);

-- As the table owner (bypassing RLS) so the sale id is visible, but still signed in as B.
reset role;

select throws_ok(
  $$ select public.add_sale_payment(id, 1) from public.sales $$,
  '22023',
  'SALE_NOT_FOUND',
  'User B cannot pay into User A''s sale'
);

select * from finish();
rollback;
