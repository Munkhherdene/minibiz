-- Phase 3: profiles, businesses, membership, RLS and the business-assets bucket.
-- See docs/architecture.md, section 4.

-------------------------------------------------------------------------------
-- Shared helpers
-------------------------------------------------------------------------------

-- Keeps updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Casts text to uuid, returning null instead of raising on invalid input.
-- Used by storage policies, where the folder name comes from the client.
create or replace function public.try_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p_value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

-------------------------------------------------------------------------------
-- profiles: one row per auth user
-------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 100),
  phone text check (char_length(phone) <= 30),
  locale text not null default 'mn' check (locale in ('mn', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Application profile for each auth user.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creates the profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users who signed up before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-------------------------------------------------------------------------------
-- businesses and business_members
-------------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  business_type text not null check (
    business_type in (
      'retail', 'clothing_cosmetics', 'online_seller', 'home_business',
      'market_stall', 'wholesale', 'other'
    )
  ),
  currency char(3) not null default 'MNT' check (currency ~ '^[A-Z]{3}$'),
  logo_path text,
  timezone text not null default 'Asia/Ulaanbaatar',
  allow_negative_stock boolean not null default false,
  next_sale_number integer not null default 1 check (next_sale_number > 0),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.businesses is 'A business (shop). Owns all business data.';
comment on column public.businesses.next_sale_number is 'Next per-business sale number; only changed by create_sale.';

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);

comment on table public.business_members is 'Which users can access which business, and with what role.';

create index business_members_user_id_idx on public.business_members (user_id);

create trigger business_members_set_updated_at
  before update on public.business_members
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- Authorization helpers (used by RLS policies and functions)
-------------------------------------------------------------------------------

create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members m
    where m.business_id = p_business_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_business_role(p_business_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members m
    where m.business_id = p_business_id
      and m.user_id = (select auth.uid())
      and m.role = any (p_roles)
  );
$$;

-------------------------------------------------------------------------------
-- create_business: business + owner membership in one transaction
-------------------------------------------------------------------------------

create or replace function public.create_business(
  p_name text,
  p_business_type text,
  p_currency text default 'MNT'
)
returns public.businesses
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_business public.businesses;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  if char_length(trim(coalesce(p_name, ''))) not between 1 and 100 then
    raise exception 'INVALID_BUSINESS_NAME' using errcode = '22023';
  end if;

  insert into public.businesses (name, business_type, currency, created_by)
  values (trim(p_name), p_business_type, upper(coalesce(p_currency, 'MNT')), v_user_id)
  returning * into v_business;

  insert into public.business_members (business_id, user_id, role)
  values (v_business.id, v_user_id, 'owner');

  return v_business;
end;
$$;

-------------------------------------------------------------------------------
-- Privileges: anon gets nothing; authenticated only what the app needs.
-- Column grants stop clients from changing system-managed columns.
-------------------------------------------------------------------------------

revoke all on table public.profiles, public.businesses, public.business_members from anon;
revoke all on table public.profiles, public.businesses, public.business_members from authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name, phone, locale) on table public.profiles to authenticated;

grant select on table public.businesses to authenticated;
grant update (name, business_type, logo_path) on table public.businesses to authenticated;

grant select on table public.business_members to authenticated;

revoke execute on function public.is_business_member(uuid) from public, anon;
revoke execute on function public.has_business_role(uuid, text[]) from public, anon;
revoke execute on function public.create_business(text, text, text) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.has_business_role(uuid, text[]) to authenticated;
grant execute on function public.create_business(text, text, text) to authenticated;

-------------------------------------------------------------------------------
-- Row Level Security
-------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Members can view their businesses"
  on public.businesses for select to authenticated
  using (public.is_business_member(id));

create policy "Owners can update their businesses"
  on public.businesses for update to authenticated
  using (public.has_business_role(id, array['owner']))
  with check (public.has_business_role(id, array['owner']));

create policy "Members can view members of their businesses"
  on public.business_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_business_member(business_id));

-------------------------------------------------------------------------------
-- Storage: business-assets bucket ({business_id}/logo/..., {business_id}/products/...)
-- Public read (product photos and logos are not sensitive); writes for members only.
-------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-assets',
  'business-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Members can view business assets"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'business-assets'
    and public.is_business_member(public.try_uuid((storage.foldername(name))[1]))
  );

create policy "Members can upload business assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'business-assets'
    and public.is_business_member(public.try_uuid((storage.foldername(name))[1]))
  );

create policy "Members can update business assets"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'business-assets'
    and public.is_business_member(public.try_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'business-assets'
    and public.is_business_member(public.try_uuid((storage.foldername(name))[1]))
  );

create policy "Members can delete business assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'business-assets'
    and public.is_business_member(public.try_uuid((storage.foldername(name))[1]))
  );
