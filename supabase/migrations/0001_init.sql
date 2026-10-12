-- ============================================================================
-- Smart Move Traders — Initial schema
-- Second-hand smartphone wholesale billing, GST margin scheme (Rule 32(5))
-- ============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- business_profile
-- Single-row-per-owner table holding the fixed business details that must
-- appear on every bill. Kept separate from invoices so the name/address are
-- stored once and referenced, not re-typed per invoice.
-- ----------------------------------------------------------------------------
create table if not exists business_profile (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  business_name   text not null default 'Smart Move Traders',
  address_line1   text not null default 'Plot 8, GF, Bharathiyar Street,',
  address_line2   text not null default 'Maruthi Nagar, Phase 1,',
  address_line3   text not null default 'Thundalam,',
  address_city    text not null default 'Chennai',
  address_pincode text not null default '600077',
  gstin           text, -- nullable: no GSTIN has been supplied, do not fabricate one
  phone           text, -- nullable: not supplied
  email           text, -- nullable: not supplied
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (owner_id)
);

-- ----------------------------------------------------------------------------
-- invoices
-- One row per wholesale lot transaction (quantity + total purchase/selling,
-- no per-phone IMEI/model — per client's confirmed requirement).
-- ----------------------------------------------------------------------------
create table if not exists invoices (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users(id) on delete cascade,

  -- business-facing reference vs. the official tax invoice number are kept
  -- distinct on purpose (Step 6): the UUID above is the true DB identity,
  -- invoice_number is an optional free-text reference the user can set,
  -- gst_invoice_number stays null until a real numbering workflow exists.
  invoice_number       text,
  gst_invoice_number   text,

  quantity             integer not null check (quantity > 0),
  purchase_amount      numeric(12,2) not null check (purchase_amount >= 0),
  selling_amount       numeric(12,2) not null check (selling_amount >= 0),

  -- financial results are always recomputed server-side (Step 5/8) and
  -- stored here as the authoritative record — never trust client-submitted
  -- values for these columns.
  profit_amount        numeric(12,2) not null,
  gst_amount           numeric(12,2) not null default 0,
  cgst_amount           numeric(12,2) not null default 0,
  sgst_amount           numeric(12,2) not null default 0,
  net_profit            numeric(12,2) not null,

  client_name          text,
  payment_method        text not null check (payment_method in ('Bank Transfer','UPI','Cash','Cheque')),
  status                text not null default 'draft' check (status in ('draft','issued','paid','void')),
  hsn_code              varchar(20) not null default '8517', -- configurable, subject to verification by the CA
  notes                 text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_invoices_owner_id    on invoices(owner_id);
create index if not exists idx_invoices_created_at  on invoices(created_at desc);
create index if not exists idx_invoices_status      on invoices(status);
create index if not exists idx_business_profile_owner on business_profile(owner_id);

-- keep updated_at current on every update
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_invoices_updated_at on invoices;
create trigger trg_invoices_updated_at
  before update on invoices
  for each row execute function set_updated_at();

drop trigger if exists trg_business_profile_updated_at on business_profile;
create trigger trg_business_profile_updated_at
  before update on business_profile
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security — each authenticated user only ever sees their own rows.
-- ----------------------------------------------------------------------------
alter table invoices enable row level security;
alter table business_profile enable row level security;

drop policy if exists "invoices_select_own" on invoices;
create policy "invoices_select_own" on invoices
  for select using (auth.uid() = owner_id);

drop policy if exists "invoices_insert_own" on invoices;
create policy "invoices_insert_own" on invoices
  for insert with check (auth.uid() = owner_id);

drop policy if exists "invoices_update_own" on invoices;
create policy "invoices_update_own" on invoices
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "invoices_delete_own" on invoices;
create policy "invoices_delete_own" on invoices
  for delete using (auth.uid() = owner_id);

drop policy if exists "business_profile_select_own" on business_profile;
create policy "business_profile_select_own" on business_profile
  for select using (auth.uid() = owner_id);

drop policy if exists "business_profile_upsert_own" on business_profile;
create policy "business_profile_upsert_own" on business_profile
  for insert with check (auth.uid() = owner_id);

drop policy if exists "business_profile_update_own" on business_profile;
create policy "business_profile_update_own" on business_profile
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Note: the backend uses the Supabase SERVICE ROLE key (server-side only,
-- never shipped to the mobile app) so it can also operate under RLS using
-- the authenticated user's JWT forwarded from the mobile app. See Part 2.
