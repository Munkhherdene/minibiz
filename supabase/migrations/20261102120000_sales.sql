-- Phase 5: sales, sale items and payments; create_sale, add_sale_payment, cancel_sale.
-- See docs/architecture.md, sections 4 and 5.2.

-------------------------------------------------------------------------------
-- sales: sale header
-------------------------------------------------------------------------------

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  sale_number integer not null check (sale_number > 0),
  client_request_id uuid not null,
  status text not null default 'completed' check (status in ('completed', 'cancelled')),
  sold_at timestamptz not null default now(),
  customer_name text check (char_length(customer_name) <= 100),
  subtotal numeric(14,2) not null check (subtotal >= 0),
  discount_amount numeric(14,2) not null default 0
    check (discount_amount >= 0 and discount_amount <= subtotal),
  total_amount numeric(14,2) not null check (total_amount = subtotal - discount_amount),
  total_cost numeric(14,2) not null default 0 check (total_cost >= 0),
  amount_paid numeric(14,2) not null default 0
    check (amount_paid >= 0 and amount_paid <= total_amount),
  balance_due numeric(14,2) generated always as (total_amount - amount_paid) stored,
  note text check (char_length(note) <= 500),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id),
  cancel_reason text check (char_length(cancel_reason) <= 500),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, sale_number),
  unique (business_id, client_request_id)
);

comment on table public.sales is 'Sale header. Only changed by create_sale, add_sale_payment and cancel_sale.';
comment on column public.sales.client_request_id is 'Idempotency key created once by the cart screen.';

create index sales_business_sold_at_idx on public.sales (business_id, sold_at desc);

create trigger sales_set_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- sale_items: lines with price and cost snapshots
-------------------------------------------------------------------------------

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  product_name text not null,
  unit text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  unit_cost numeric(14,4) not null check (unit_cost >= 0),
  line_total numeric(14,2) not null,
  line_cost numeric(14,2) not null,
  created_at timestamptz not null default now()
);

create index sale_items_sale_id_idx on public.sale_items (sale_id);

-------------------------------------------------------------------------------
-- sale_payments: money received for a sale (negative = refund)
-------------------------------------------------------------------------------

create table public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  sale_id uuid not null references public.sales (id) on delete cascade,
  amount numeric(14,2) not null check (amount <> 0),
  method text not null check (method in ('cash', 'bank_transfer', 'other')),
  paid_at timestamptz not null default now(),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index sale_payments_business_paid_at_idx on public.sale_payments (business_id, paid_at);
create index sale_payments_sale_id_idx on public.sale_payments (sale_id);

-------------------------------------------------------------------------------
-- Link stock movements to sales
-------------------------------------------------------------------------------

alter table public.inventory_transactions
  add column sale_id uuid references public.sales (id) on delete cascade,
  add column sale_item_id uuid references public.sale_items (id) on delete cascade;

comment on table public.inventory_transactions is 'Stock movements. Append-only.';

-------------------------------------------------------------------------------
-- create_sale: the whole sale in one transaction (rules 5.1.3–5.1.7 and 5.2)
-------------------------------------------------------------------------------

create or replace function public.create_sale(
  p_business_id uuid,
  p_client_request_id uuid,
  p_items jsonb,
  p_discount numeric default 0,
  p_amount_paid numeric default null,
  p_payment_method text default 'cash',
  p_customer_name text default null,
  p_note text default null
)
returns public.sales
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_business public.businesses;
  v_sale public.sales;
  v_product public.products;
  v_line record;
  v_sale_item_id uuid;
  v_line_total numeric;
  v_line_cost numeric;
  v_subtotal numeric := 0;
  v_total_cost numeric := 0;
  v_discount numeric := round(coalesce(p_discount, 0), 2);
  v_total numeric;
  v_paid numeric;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  if not public.is_business_member(p_business_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_client_request_id is null then
    raise exception 'INVALID_REQUEST' using errcode = '22023';
  end if;

  -- Locking the business serialises its sales: the sale number is allocated safely
  -- and the client_request_id check below cannot race with a parallel retry.
  select * into v_business from public.businesses where id = p_business_id for update;

  select * into v_sale
  from public.sales
  where business_id = p_business_id and client_request_id = p_client_request_id;
  if found then
    return v_sale; -- A retry of a sale that was already saved (rule 5.2.8).
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_SALE' using errcode = '22023';
  end if;

  if coalesce(p_payment_method, '') not in ('cash', 'bank_transfer', 'other') then
    raise exception 'INVALID_PAYMENT' using errcode = '22023';
  end if;

  -- Rule 5.1.4: lock the products in ascending id order before reading stock.
  perform 1
  from public.products
  where business_id = p_business_id
    and id in (select (item ->> 'product_id')::uuid from jsonb_array_elements(p_items) item)
  order by id
  for update;

  insert into public.sales (
    business_id, sale_number, client_request_id, customer_name, note,
    subtotal, total_amount, created_by
  )
  values (
    p_business_id, v_business.next_sale_number, p_client_request_id,
    nullif(trim(p_customer_name), ''), nullif(trim(p_note), ''), 0, 0, v_user_id
  )
  returning * into v_sale;

  update public.businesses
  set next_sale_number = next_sale_number + 1
  where id = p_business_id;

  -- The same product listed twice becomes one line.
  for v_line in
    select (item ->> 'product_id')::uuid as product_id,
           sum((item ->> 'quantity')::numeric) as quantity
    from jsonb_array_elements(p_items) item
    group by 1
    order by 1
  loop
    select * into v_product
    from public.products
    where id = v_line.product_id and business_id = p_business_id;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND' using errcode = '22023';
    end if;

    if not v_product.is_active then
      raise exception 'PRODUCT_ARCHIVED' using errcode = '22023';
    end if;

    if v_line.quantity is null or v_line.quantity <= 0
       or v_line.quantity <> round(v_line.quantity, 3) then
      raise exception 'INVALID_QUANTITY' using errcode = '22023';
    end if;

    if v_product.unit in ('pcs', 'box', 'pack') and v_line.quantity <> trunc(v_line.quantity) then
      raise exception 'QUANTITY_MUST_BE_WHOLE' using errcode = '22023';
    end if;

    -- Rule 5.1.3. The app shows the product and available quantity from `detail`.
    if not v_business.allow_negative_stock and v_product.current_stock < v_line.quantity then
      raise exception 'INSUFFICIENT_STOCK'
        using errcode = '22023',
              detail = jsonb_build_object(
                'name', v_product.name,
                'available', v_product.current_stock,
                'unit', v_product.unit
              )::text;
    end if;

    v_line_total := round(v_line.quantity * v_product.selling_price, 2);
    v_line_cost := round(v_line.quantity * v_product.avg_cost, 2);

    insert into public.sale_items (
      business_id, sale_id, product_id, product_name, unit, quantity,
      unit_price, unit_cost, line_total, line_cost
    )
    values (
      p_business_id, v_sale.id, v_product.id, v_product.name, v_product.unit, v_line.quantity,
      v_product.selling_price, v_product.avg_cost, v_line_total, v_line_cost
    )
    returning id into v_sale_item_id;

    update public.products
    set current_stock = current_stock - v_line.quantity
    where id = v_product.id;

    insert into public.inventory_transactions (
      business_id, product_id, type, quantity_change, unit_cost, stock_after,
      sale_id, sale_item_id, occurred_at, created_by
    )
    values (
      p_business_id, v_product.id, 'sale', -v_line.quantity, v_product.avg_cost,
      v_product.current_stock - v_line.quantity, v_sale.id, v_sale_item_id,
      v_sale.sold_at, v_user_id
    );

    v_subtotal := v_subtotal + v_line_total;
    v_total_cost := v_total_cost + v_line_cost;
  end loop;

  if v_discount < 0 or v_discount > v_subtotal then
    raise exception 'INVALID_DISCOUNT' using errcode = '22023';
  end if;

  v_total := v_subtotal - v_discount;
  -- Full payment unless a smaller amount is given (rule 5.2.5).
  v_paid := round(coalesce(p_amount_paid, v_total), 2);

  if v_paid < 0 or v_paid > v_total then
    raise exception 'INVALID_PAYMENT' using errcode = '22023';
  end if;

  update public.sales
  set subtotal = v_subtotal,
      discount_amount = v_discount,
      total_amount = v_total,
      total_cost = v_total_cost,
      amount_paid = v_paid
  where id = v_sale.id
  returning * into v_sale;

  if v_paid > 0 then
    insert into public.sale_payments (business_id, sale_id, amount, method, paid_at, created_by)
    values (p_business_id, v_sale.id, v_paid, p_payment_method, v_sale.sold_at, v_user_id);
  end if;

  return v_sale;
end;
$$;

-------------------------------------------------------------------------------
-- add_sale_payment: a later payment against an unpaid balance
-------------------------------------------------------------------------------

create or replace function public.add_sale_payment(
  p_sale_id uuid,
  p_amount numeric,
  p_method text default 'cash'
)
returns public.sales
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_sale public.sales;
  v_amount numeric := round(p_amount, 2);
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  select * into v_sale from public.sales where id = p_sale_id for update;

  if not found or not public.is_business_member(v_sale.business_id) then
    raise exception 'SALE_NOT_FOUND' using errcode = '22023';
  end if;

  if v_sale.status = 'cancelled' then
    raise exception 'SALE_ALREADY_CANCELLED' using errcode = '22023';
  end if;

  if coalesce(p_method, '') not in ('cash', 'bank_transfer', 'other')
     or v_amount is null or v_amount <= 0 or v_amount > v_sale.balance_due then
    raise exception 'INVALID_PAYMENT' using errcode = '22023';
  end if;

  insert into public.sale_payments (business_id, sale_id, amount, method, created_by)
  values (v_sale.business_id, v_sale.id, v_amount, p_method, v_user_id);

  update public.sales
  set amount_paid = amount_paid + v_amount
  where id = v_sale.id
  returning * into v_sale;

  return v_sale;
end;
$$;

-------------------------------------------------------------------------------
-- cancel_sale: restore stock, refund payments, keep the sale (rule 5.2.9)
-------------------------------------------------------------------------------

create or replace function public.cancel_sale(p_sale_id uuid, p_reason text default null)
returns public.sales
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_sale public.sales;
  v_item public.sale_items;
  v_stock_after numeric;
  v_refund record;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  select * into v_sale from public.sales where id = p_sale_id for update;

  if not found or not public.is_business_member(v_sale.business_id) then
    raise exception 'SALE_NOT_FOUND' using errcode = '22023';
  end if;

  if v_sale.status = 'cancelled' then
    raise exception 'SALE_ALREADY_CANCELLED' using errcode = '22023';
  end if;

  perform 1
  from public.products
  where id in (select product_id from public.sale_items where sale_id = p_sale_id)
  order by id
  for update;

  -- Stock returns at each line's original cost, re-averaged in (rule 5.1.5).
  for v_item in
    select * from public.sale_items where sale_id = p_sale_id order by product_id
  loop
    update public.products
    set avg_cost = case
          when current_stock <= 0 then v_item.unit_cost
          else (current_stock * avg_cost + v_item.quantity * v_item.unit_cost)
               / (current_stock + v_item.quantity)
        end,
        current_stock = current_stock + v_item.quantity
    where id = v_item.product_id
    returning current_stock into v_stock_after;

    insert into public.inventory_transactions (
      business_id, product_id, type, quantity_change, unit_cost, stock_after,
      sale_id, sale_item_id, created_by
    )
    values (
      v_sale.business_id, v_item.product_id, 'sale_cancellation', v_item.quantity,
      v_item.unit_cost, v_stock_after, v_sale.id, v_item.id, v_user_id
    );
  end loop;

  -- Refund every payment method that still has a net amount.
  for v_refund in
    select method, sum(amount) as net
    from public.sale_payments
    where sale_id = p_sale_id
    group by method
    having sum(amount) > 0
  loop
    insert into public.sale_payments (business_id, sale_id, amount, method, created_by)
    values (v_sale.business_id, v_sale.id, -v_refund.net, v_refund.method, v_user_id);
  end loop;

  update public.sales
  set status = 'cancelled',
      amount_paid = 0,
      cancelled_at = now(),
      cancelled_by = v_user_id,
      cancel_reason = nullif(trim(p_reason), '')
  where id = v_sale.id
  returning * into v_sale;

  return v_sale;
end;
$$;

-------------------------------------------------------------------------------
-- Privileges: sales are read-only for clients; all writes go through functions.
-------------------------------------------------------------------------------

revoke all on table public.sales, public.sale_items, public.sale_payments from anon;
revoke all on table public.sales, public.sale_items, public.sale_payments from authenticated;

grant select on table public.sales, public.sale_items, public.sale_payments to authenticated;

revoke execute on function public.create_sale(
  uuid, uuid, jsonb, numeric, numeric, text, text, text
) from public, anon;
revoke execute on function public.add_sale_payment(uuid, numeric, text) from public, anon;
revoke execute on function public.cancel_sale(uuid, text) from public, anon;
grant execute on function public.create_sale(
  uuid, uuid, jsonb, numeric, numeric, text, text, text
) to authenticated;
grant execute on function public.add_sale_payment(uuid, numeric, text) to authenticated;
grant execute on function public.cancel_sale(uuid, text) to authenticated;

-------------------------------------------------------------------------------
-- Row Level Security
-------------------------------------------------------------------------------

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_payments enable row level security;

create policy "Members can view sales"
  on public.sales for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members can view sale items"
  on public.sale_items for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members can view sale payments"
  on public.sale_payments for select to authenticated
  using (public.is_business_member(business_id));
