-- Identity-keyed consent records — captured by the form-consent widget (/f.js) at the
-- point a shopper submits explicit data (email / phone). This is the source of truth
-- downstream marketing-tool sync (Klaviyo, WhatsApp BSPs, Meta CAPI) will read.
-- Run once in the Supabase SQL editor.
--
-- PII NOTE: `identifier` holds the raw contactable value (needed so downstream tools can
-- message the person). Treat as PII — enable encryption-at-rest / a column-level KMS and
-- sign a processor agreement with the brand before relying on this in production.
-- `identifier_hash` (salted SHA-256) is what we index/dedupe on and what privacy-preserving
-- matches (e.g. Meta CAPI) can use without the raw value.

create table if not exists consent_records (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  client_id       uuid references clients(id) on delete cascade,

  identifier_type text not null check (identifier_type in ('email','phone')),
  identifier      text not null,        -- raw email/phone (PII — encrypt in prod)
  identifier_hash text not null,        -- sha256(normalised identifier + salt)

  purposes        jsonb not null,       -- { email_marketing: true, whatsapp: false, ... }
  policy_version  text,
  source          text default 'form',  -- 'form' (explicit) vs 'cookie' (tracking)
  page_url        text,

  -- one current-state row per identity per brand; history can be layered later
  unique (client_id, identifier_hash)
);

create index if not exists idx_consent_records_client      on consent_records(client_id, updated_at desc);
create index if not exists idx_consent_records_hash        on consent_records(client_id, identifier_hash);

create trigger consent_records_updated_at before update on consent_records
  for each row execute function update_updated_at();

alter table consent_records enable row level security;
create policy "client_read_consent_records" on consent_records for select using (
  exists (select 1 from platform_users where auth_user_id = auth.uid() and client_id = consent_records.client_id)
);
