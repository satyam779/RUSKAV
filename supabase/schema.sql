-- RUSKAV shop schema.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is written to be re-runnable: every statement is guarded, so applying it
-- again after an edit will not destroy existing rows.
--
-- The security model is deliberately simple, because the site has exactly two
-- kinds of visitor:
--   * the public, who may READ products and CREATE an order
--   * an admin, who may do anything
-- "Admin" means an authenticated user whose id appears in `admins`. Anonymous
-- visitors never get write access to products or price fields.

-- ---------------------------------------------------------------- categories
create table if not exists public.categories (
  id           text primary key,
  name         text not null,
  short_name   text not null,
  kicker       text,
  tagline      text,
  description  text,
  hero_image   text,
  thumb        text,
  theme        text not null default 'brand',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------------ products
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  name           text not null,
  description    text,
  category_id    text references public.categories (id) on delete set null,
  group_name     text,

  -- Specification, straight off the print catalogue.
  size           text,
  case_pack      integer not null default 1,
  material       text,
  material_code  text,
  surface        text,
  colors         text[] not null default '{}',
  certs          text[] not null default '{}',
  -- Free-form spec rows: [{ "label": "Heat resistance", "value": "-10 to +82" }]
  specs          jsonb not null default '[]',
  quality_notes  text,

  -- Commercials. `price` is per case unless `price_unit` says otherwise.
  -- `mrp` is the pre-discount figure used to render a struck-through price;
  -- discount_percent is applied to `price` at display time.
  price             numeric(12, 2),
  mrp               numeric(12, 2),
  discount_percent  numeric(5, 2) not null default 0
    check (discount_percent >= 0 and discount_percent <= 100),
  price_unit        text not null default 'case',
  currency          text not null default 'INR',
  tax_percent       numeric(5, 2) not null default 18,
  moq               integer not null default 1,

  -- Trade detail. A distributor asks for all four before placing an order, so
  -- each one has a column rather than being buried in `specs`. All optional:
  -- the spec sheet prints only the rows that are filled in.
  hsn_code        text,
  -- Free text on purpose: "Ships in 3-5 working days", "Made to order - 2 weeks".
  lead_time       text,
  -- Gross weight of one case, in kg. What freight is quoted on.
  case_weight_kg  numeric(10, 3),
  -- Outer carton, as typed: '60 x 40 x 45 cm'.
  carton_size     text,

  stock_status   text not null default 'in_stock',
  images         text[] not null default '{}',
  is_published   boolean not null default true,
  is_featured    boolean not null default false,
  sort_order     integer not null default 0,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- `create table if not exists` above skips a table that already exists, so the
-- trade columns are added separately for databases created before them. Both
-- statements are idempotent: re-running this file is always safe.
alter table public.products add column if not exists hsn_code       text;
alter table public.products add column if not exists lead_time      text;
alter table public.products add column if not exists case_weight_kg numeric(10, 3);
alter table public.products add column if not exists carton_size    text;

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_published_idx on public.products (is_published);

-- -------------------------------------------------------------------- admins
-- Membership of this table is what grants write access. Add yourself after
-- creating your user in Authentication → Users:
--   insert into public.admins (user_id, email) values ('<your-uuid>', '<you@example.com>');
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ------------------------------------------------------------------ profiles
-- A readable mirror of `auth.users`.
--
-- Supabase keeps `auth.users` unreachable from the browser on purpose, so the
-- dashboard has no way to answer "who has signed up?" without a copy of its
-- own. The trigger below keeps this table in step on every sign-up and every
-- sign-in, and the backfill catches accounts that already existed.
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text,
  full_name        text,
  avatar_url       text,
  -- Which identity they came in with: 'google', 'email', ...
  provider         text,
  created_at       timestamptz not null default now(),
  last_sign_in_at  timestamptz
);

create index if not exists profiles_created_idx on public.profiles (created_at desc);

-- Runs as the owner so it can write past row level security. Google returns
-- the display name as `full_name` or `name` depending on the flow, hence the
-- coalesce; a later sign-in must never blank a name we already hold.
create or replace function public.sync_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, avatar_url, provider, created_at, last_sign_in_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
    new.created_at,
    new.last_sign_in_at
  )
  on conflict (id) do update set
    email           = excluded.email,
    full_name       = coalesce(excluded.full_name, profiles.full_name),
    avatar_url      = coalesce(excluded.avatar_url, profiles.avatar_url),
    provider        = coalesce(excluded.provider, profiles.provider),
    last_sign_in_at = excluded.last_sign_in_at;
  return new;

-- This trigger sits in the path of every sign-in. A mirror table that cannot
-- be written is a reporting problem; a sign-in that fails is an outage. So a
-- failure is logged to the Postgres log and the sign-in is allowed through.
exception
  when others then
    raise warning 'sync_profile failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists sync_profile_on_auth_user on auth.users;
create trigger sync_profile_on_auth_user
  after insert or update on auth.users
  for each row execute function public.sync_profile();

-- Everyone who signed up before this table existed.
insert into public.profiles (
  id, email, full_name, avatar_url, provider, created_at, last_sign_in_at
)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.raw_user_meta_data ->> 'avatar_url',
  coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
  u.created_at,
  u.last_sign_in_at
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------- profiles: RLS
alter table public.profiles enable row level security;

-- You may read yourself; an admin may read everyone. The only column writable
-- from the browser is the trade band, and only by an admin (see the tiers
-- section at the end) — the trigger maintains everything else.
drop policy if exists "people read their own profile" on public.profiles;
create policy "people read their own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- -------------------------------------------------------------------- orders
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,

  customer_name   text not null,
  company         text,
  email           text,
  phone           text,
  city            text,
  notes           text,

  -- 'enquiry'  — customer wants a quote, nothing to pay yet
  -- 'payment'  — customer chose to pay online
  kind            text not null default 'enquiry',
  -- pending | paid | failed | quoted | cancelled
  status          text not null default 'pending',

  subtotal        numeric(12, 2) not null default 0,
  discount_total  numeric(12, 2) not null default 0,
  tax_total       numeric(12, 2) not null default 0,
  total           numeric(12, 2) not null default 0,
  currency        text not null default 'INR',

  razorpay_order_id    text,
  razorpay_payment_id  text,

  created_at      timestamptz not null default now()
);

create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_code   text not null,
  product_name   text not null,
  size           text,
  case_pack      integer,
  quantity       integer not null check (quantity > 0),
  -- Prices are copied in, not joined: an order must still read correctly after
  -- the admin changes the catalogue price.
  unit_price     numeric(12, 2) not null default 0,
  discount_percent numeric(5, 2) not null default 0,
  line_total     numeric(12, 2) not null default 0
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- Signed-in customers are attached to what they send, so the dashboard can put
-- an account next to its orders. Nullable, because ordering has never required
-- an account and still does not.
alter table public.orders add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists orders_user_idx on public.orders (user_id);

-- ----------------------------------------------------------------- enquiries
-- Messages from the contact form. Kept apart from `orders` on purpose: a
-- general "tell me about your trays" has no line items and nothing payable, so
-- folding it into orders would make the dashboard's order count and paid
-- revenue figures meaningless.
create table if not exists public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique,

  name          text not null,
  company       text,
  email         text,
  phone         text,
  -- Exactly what the visitor typed, before we split it into email/phone.
  contact_raw   text,

  -- Which part of the range they picked from "Interested in".
  interest      text,
  message       text,
  -- Any product codes they had collected when they sent it.
  product_codes text[] not null default '{}',

  -- Where it came from. The site form posts straight into this table, so new
  -- rows are always 'website'; 'email' | 'whatsapp' | 'copy' are historical,
  -- from when the form handed off to a mail client instead.
  channel       text not null default 'website',
  -- new | replied | closed
  status        text not null default 'new',

  created_at    timestamptz not null default now()
);

create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

alter table public.enquiries add column if not exists user_id uuid references auth.users (id) on delete set null;

-- Re-runs against a database created before the form posted here directly.
alter table public.enquiries alter column channel set default 'website';

-- ------------------------------------------------------------ enquiries: RLS
alter table public.enquiries enable row level security;

-- Anyone may send one; only admins may read them back, for the same reason as
-- orders — otherwise the form becomes a directory of everyone who used it.
drop policy if exists "anyone can send an enquiry" on public.enquiries;
create policy "anyone can send an enquiry" on public.enquiries
  for insert with check (user_id is null or user_id = auth.uid());

drop policy if exists "admins read enquiries" on public.enquiries;
create policy "admins read enquiries" on public.enquiries
  for select using (public.is_admin());

drop policy if exists "admins update enquiries" on public.enquiries;
create policy "admins update enquiries" on public.enquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------ settings
-- Single-row key/value store for things the admin should be able to change
-- without a deploy (announcement bar, global discount, payment on/off).
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

insert into public.settings (key, value)
values ('shop', '{"payments_enabled": true, "announcement": ""}'::jsonb)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------- RLS
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.settings    enable row level security;
alter table public.admins      enable row level security;

-- Public may read the catalogue; only admins may change it.
drop policy if exists "categories are public" on public.categories;
create policy "categories are public" on public.categories
  for select using (true);

drop policy if exists "admins write categories" on public.categories;
create policy "admins write categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "published products are public" on public.products;
create policy "published products are public" on public.products
  for select using (is_published or public.is_admin());

drop policy if exists "admins write products" on public.products;
create policy "admins write products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings are public" on public.settings;
create policy "settings are public" on public.settings
  for select using (true);

drop policy if exists "admins write settings" on public.settings;
create policy "admins write settings" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Anyone may place an order, but nobody anonymous may read orders back —
-- otherwise one customer could enumerate everyone else's contact details.
-- The check is what stops a signed-in visitor filing an order under someone
-- else's account: either it is unattributed, or it is attributed to them.
drop policy if exists "anyone can create an order" on public.orders;
create policy "anyone can create an order" on public.orders
  for insert with check (user_id is null or user_id = auth.uid());

drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders
  for select using (public.is_admin());

drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "anyone can create order items" on public.order_items;
create policy "anyone can create order items" on public.order_items
  for insert with check (true);

drop policy if exists "admins read order items" on public.order_items;
create policy "admins read order items" on public.order_items
  for select using (public.is_admin());

-- Admins may see who the admins are; nobody else needs to.
drop policy if exists "admins read admins" on public.admins;
create policy "admins read admins" on public.admins
  for select using (public.is_admin());

-- ---------------------------------------------------------------- timestamps
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------- storage
-- Product images. Public read so the shop can render them; admin-only write.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product images are public" on storage.objects;
create policy "product images are public" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins change product images" on storage.objects;
create policy "admins change product images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- ================================================================== tiers
-- Trade bands. Wholesale is not one price list: a distributor moving pallets
-- and a single cafeteria buying six cases do not pay the same, and the office
-- has always handled that by quoting different numbers to different people.
-- This makes the bands a thing the dashboard owns rather than a thing kept in
-- somebody's head.
--
-- The discount stacks on top of whatever discount the product itself carries,
-- so a seasonal offer and a dealer band compose rather than one overriding the
-- other.
create table if not exists public.customer_tiers (
  key              text primary key,
  label            text not null,
  discount_percent numeric not null default 0
                     check (discount_percent >= 0 and discount_percent < 100),
  -- Shown to the buyer under their price, and to the admin in the picker.
  description      text,
  sort_order       int not null default 0,
  is_active        boolean not null default true,
  updated_at       timestamptz not null default now()
);

insert into public.customer_tiers (key, label, discount_percent, description, sort_order)
values
  ('regular',  'Regular',  0,  'List price. Every new account starts here.',        0),
  ('dealer_c', 'Dealer C', 4,  'Occasional trade buyers and smaller institutions.', 1),
  ('dealer_b', 'Dealer B', 8,  'Regular dealers ordering in volume.',               2),
  ('dealer_a', 'Dealer A', 12, 'Appointed distributors on standing arrangements.',  3)
on conflict (key) do nothing;

drop trigger if exists customer_tiers_touch_updated_at on public.customer_tiers;
create trigger customer_tiers_touch_updated_at
  before update on public.customer_tiers
  for each row execute function public.touch_updated_at();

-- Which band an account is on. The foreign key is what stops a typo in the
-- dashboard silently pricing someone at zero discount forever.
alter table public.profiles
  add column if not exists tier text not null default 'regular';

alter table public.profiles
  drop constraint if exists profiles_tier_fkey;
alter table public.profiles
  add constraint profiles_tier_fkey
  foreign key (tier) references public.customer_tiers (key) on update cascade;

-- Why they are on it: "agreed with Suresh, Mar 2026", "trial for 3 months".
alter table public.profiles add column if not exists tier_note text;

-- ------------------------------------------------------------- tiers: RLS
alter table public.customer_tiers enable row level security;

-- The whole band table is an internal document — a Dealer C has no business
-- reading what Dealer A pays. Buyers get their own band through `my_tier()`
-- instead, which is why that function is security definer.
drop policy if exists "admins read tiers" on public.customer_tiers;
create policy "admins read tiers" on public.customer_tiers
  for select using (public.is_admin());

drop policy if exists "admins write tiers" on public.customer_tiers;
create policy "admins write tiers" on public.customer_tiers
  for all using (public.is_admin()) with check (public.is_admin());

-- Admins set the band; nothing else about a profile is writable from the
-- browser, and the trigger stays the only thing that maintains the rest.
drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- The caller's own band, and only ever their own.
create or replace function public.my_tier()
returns table (key text, label text, discount_percent numeric)
language sql
stable
security definer
set search_path = public
as $$
  select t.key, t.label, t.discount_percent
  from public.profiles p
  join public.customer_tiers t on t.key = p.tier
  where p.id = auth.uid()
    and t.is_active;
$$;

revoke all on function public.my_tier() from public;
grant execute on function public.my_tier() to authenticated;

-- ======================================================== enquiries: quoting
-- The contact form became a request for a quote, so the row has to carry the
-- things a quote is built from — where it ships, how much of it, how soon —
-- and then the quote itself once the office has priced it.
alter table public.enquiries add column if not exists city           text;
alter table public.enquiries add column if not exists state          text;
alter table public.enquiries add column if not exists gstin          text;
-- dealer | distributor | institution | horeca | other
alter table public.enquiries add column if not exists business_type  text;
-- Free text on purpose: "about 40 cases a month" is a more useful answer than
-- a number the sender had to round to fit a box.
alter table public.enquiries add column if not exists quantity       text;
-- immediate | 1_month | 3_months | planning
alter table public.enquiries add column if not exists timeline       text;
-- Which band they are asking to be put on, if any.
alter table public.enquiries add column if not exists tier_requested text;

-- The office's side of it.
alter table public.enquiries add column if not exists quoted_amount   numeric;
alter table public.enquiries add column if not exists quoted_currency text default 'INR';
alter table public.enquiries add column if not exists quote_notes     text;
alter table public.enquiries add column if not exists quoted_at       timestamptz;
-- Set when quoting also moved the account onto a band, so the enquiry records
-- the decision rather than only its consequence.
alter table public.enquiries add column if not exists granted_tier    text;

create index if not exists enquiries_status_idx on public.enquiries (status, created_at desc);

-- =============================================== what a customer can read back
-- The dashboard could quote an enquiry, and the customer had no way to see the
-- quote: `enquiries` and `orders` were admin-read-only, so the account page had
-- nothing to show. These two policies are what make /account possible.
--
-- Deliberately keyed on `user_id` alone, not on a matching email address. An
-- enquiry sent as a guest carries no account, and letting a fresh sign-up claim
-- every row that happens to share its email would turn the form into a way of
-- reading other people's business — which is the exact thing the admin-only
-- rule was there to prevent. A guest enquiry stays between the sender and the
-- office, answered by email as it always was.
drop policy if exists "people read their own enquiries" on public.enquiries;
create policy "people read their own enquiries" on public.enquiries
  for select using (user_id is not null and user_id = auth.uid());

drop policy if exists "people read their own orders" on public.orders;
create policy "people read their own orders" on public.orders
  for select using (user_id is not null and user_id = auth.uid());

-- Line items follow their order: if you may read the order, you may read what
-- was on it.
drop policy if exists "people read their own order items" on public.order_items;
create policy "people read their own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id is not null
        and o.user_id = auth.uid()
    )
  );

-- ====================================================== per-colour photography
-- A tray comes in eleven colourways and the catalogue shows one of them. This
-- maps a colour key to its own photograph, so pressing "Green" on the product
-- page shows the green one rather than asking the buyer to imagine it.
--
-- jsonb rather than a child table: it is a handful of urls keyed by a colour
-- the product already lists, it is always read with the product, and it is
-- never queried across products.
alter table public.products
  add column if not exists color_images jsonb not null default '{}'::jsonb;
