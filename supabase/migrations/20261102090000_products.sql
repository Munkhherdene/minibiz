-- Phase 4: products, inventory movements and create_product.
-- See docs/architecture.md, sections 4 and 5.1. Product categories and later stock
-- movements (record_stock_movement) follow in their own migrations.

create extension if not exists pg_trgm with schema extensions;

-------------------------------------------------------------------------------
-- products
-------------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  sku text check (char_length(trim(sku)) between 1 and 64),
  barcode text check (char_length(trim(barcode)) between 1 and 64),
  unit text not null default 'pcs' check (
    unit in ('pcs', 'kg', 'g', 'l', 'ml', 'm', 'box', 'pack')
  ),
  image_path text,
  cost_price numeric(14,2) not null default 0 check (cost_price >= 0),
  avg_cost numeric(14,4) not null default 0 check (avg_cost >= 0),
  selling_price numeric(14,2) not null check (selling_price >= 0),
  current_stock numeric(12,3) not null default 0,
  low_stock_threshold numeric(12,3) check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is 'Products a business sells. Archived (is_active = false) instead of deleted.';
comment on column public.products.cost_price is 'The user''s default purchase cost, pre-filled when receiving stock.';
comment on column public.products.avg_cost is 'Moving weighted average cost; only changed by database functions.';
comment on column public.products.current_stock is 'Sum of inventory_transactions.quantity_change; only changed by database functions.';

-- Index names are matched by the app to show "SKU/barcode already used".
create unique index products_business_sku_key
  on public.products (business_id, sku) where sku is not null;
create unique index products_business_barcode_key
  on public.products (business_id, barcode) where barcode is not null;
create index products_business_active_name_idx
  on public.products (business_id, is_active, name);
create index products_name_trgm_idx
  on public.products using gin (name extensions.gin_trgm_ops);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- inventory_transactions: every stock movement (append-only)
-------------------------------------------------------------------------------

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  type text not null check (
    type in (
      'opening_stock', 'purchase_receipt', 'sale', 'sale_cancellation',
      'customer_return', 'damage', 'adjustment'
    )
  ),
  quantity_change numeric(12,3) not null check (quantity_change <> 0),
  unit_cost numeric(14,4) not null default 0 check (unit_cost >= 0),
  stock_after numeric(12,3) not null,
  reference text check (char_length(reference) <= 100),
  note text check (char_length(note) <= 500),
  occurred_at timestamptz not null default now(),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

comment on table public.inventory_transactions is 'Stock movements. Append-only; sale_id and sale_item_id are added with the sales tables.';

create index inventory_transactions_product_idx
  on public.inventory_transactions (business_id, product_id, occurred_at desc);

-------------------------------------------------------------------------------
-- create_product: product + opening_stock movement in one transaction
-------------------------------------------------------------------------------

create or replace function public.create_product(
  p_business_id uuid,
  p_name text,
  p_selling_price numeric,
  p_cost_price numeric default 0,
  p_unit text default 'pcs',
  p_opening_stock numeric default 0,
  p_sku text default null,
  p_barcode text default null,
  p_low_stock_threshold numeric default null
)
returns public.products
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_cost numeric := coalesce(p_cost_price, 0);
  v_opening numeric := coalesce(p_opening_stock, 0);
  v_unit text := coalesce(p_unit, 'pcs');
  v_product public.products;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  if not public.is_business_member(p_business_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_name, ''))) not between 1 and 100 then
    raise exception 'INVALID_PRODUCT_NAME' using errcode = '22023';
  end if;

  if p_selling_price is null or p_selling_price < 0 or v_cost < 0 then
    raise exception 'INVALID_PRICE' using errcode = '22023';
  end if;

  if v_opening < 0 or p_low_stock_threshold < 0 then
    raise exception 'INVALID_QUANTITY' using errcode = '22023';
  end if;

  -- Rule 5.1.6: pieces, boxes and packs are counted in whole numbers.
  if v_unit in ('pcs', 'box', 'pack') and v_opening <> trunc(v_opening) then
    raise exception 'QUANTITY_MUST_BE_WHOLE' using errcode = '22023';
  end if;

  insert into public.products (
    business_id, name, sku, barcode, unit, cost_price, avg_cost,
    selling_price, current_stock, low_stock_threshold
  )
  values (
    p_business_id, trim(p_name), nullif(trim(p_sku), ''), nullif(trim(p_barcode), ''),
    v_unit, v_cost, v_cost, p_selling_price, v_opening, p_low_stock_threshold
  )
  returning * into v_product;

  if v_opening > 0 then
    insert into public.inventory_transactions (
      business_id, product_id, type, quantity_change, unit_cost, stock_after, created_by
    )
    values (
      p_business_id, v_product.id, 'opening_stock', v_opening, v_cost, v_opening, v_user_id
    );
  end if;

  return v_product;
end;
$$;

-------------------------------------------------------------------------------
-- Privileges: stock and average cost are never writable by clients.
-------------------------------------------------------------------------------

revoke all on table public.products, public.inventory_transactions from anon;
revoke all on table public.products, public.inventory_transactions from authenticated;

grant select on table public.products to authenticated;
grant update (
  name, sku, barcode, unit, image_path, cost_price, selling_price,
  low_stock_threshold, is_active
) on table public.products to authenticated;

grant select on table public.inventory_transactions to authenticated;

revoke execute on function public.create_product(
  uuid, text, numeric, numeric, text, numeric, text, text, numeric
) from public, anon;
grant execute on function public.create_product(
  uuid, text, numeric, numeric, text, numeric, text, text, numeric
) to authenticated;

-------------------------------------------------------------------------------
-- Row Level Security
-------------------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.inventory_transactions enable row level security;

create policy "Members can view products"
  on public.products for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members can update products"
  on public.products for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "Members can view inventory movements"
  on public.inventory_transactions for select to authenticated
  using (public.is_business_member(business_id));
