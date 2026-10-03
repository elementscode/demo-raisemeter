-- add core tables

-- Auto-update updatedAt on row changes.
create or replace function touchUpdatedAt()
returns trigger
language plpgsql
as $$
begin
  new.updatedAt = now();
  return new;
end;
$$;

create table users (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  email text not null unique,
  name text not null,
  passwordHash text not null
);

create trigger usersTouchUpdatedAt
  before update on users
  for each row execute function touchUpdatedAt();

create table images (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  contentType text not null,
  data bytea not null,
  hash text generated always as (encode(sha256(data), 'hex')) stored
);

create trigger imagesTouchUpdatedAt
  before update on images
  for each row execute function touchUpdatedAt();

create table campaigns (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  organizerId uuid not null references users (id),
  slug text not null unique,
  title text not null,
  summary text not null,
  story text not null,
  goalCents integer not null check (goalCents > 0),

  -- An organizer's upload lives in images. The seeded campaigns ship their
  -- covers as static assets instead, named here.
  coverImageId uuid references images (id),
  coverAsset text,
  featured boolean not null default false
);

create index campaignsOrganizerIdx on campaigns (organizerId);

create trigger campaignsTouchUpdatedAt
  before update on campaigns
  for each row execute function touchUpdatedAt();

-- A donation someone has started but Stripe has not confirmed. It becomes a
-- row in donations only once the Checkout Session reads back as paid.
create table checkouts (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  campaignId uuid not null references campaigns (id),
  stripeSessionId text unique,
  amountCents integer not null check (amountCents >= 100),
  donorName text,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'paid'))
);

create trigger checkoutsTouchUpdatedAt
  before update on checkouts
  for each row execute function touchUpdatedAt();

create table donations (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  campaignId uuid not null references campaigns (id),
  checkoutId uuid unique references checkouts (id),
  amountCents integer not null,

  -- null when the donor chose to give anonymously
  donorName text,
  message text not null default '',
  email text not null
);

create index donationsCampaignIdx on donations (campaignId, createdAt desc);

create trigger donationsTouchUpdatedAt
  before update on donations
  for each row execute function touchUpdatedAt();

create table updates (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  campaignId uuid not null references campaigns (id),
  title text not null,
  body text not null
);

create index updatesCampaignIdx on updates (campaignId, createdAt desc);

create trigger updatesTouchUpdatedAt
  before update on updates
  for each row execute function touchUpdatedAt();

-- Donations are written by the Stripe return page and the webhook, never
-- through a live view, so the write itself tells open campaign pages. The
-- payload carries the public fields only: never the donor's email.
create or replace function donationsNotify() returns trigger
language plpgsql as $$
declare
  r record;
  payload text;
begin
  r := coalesce(new, old);

  payload := json_build_object(
    'op', lower(tg_op),
    'data', json_build_object(
      'id', r.id,
      'campaignId', r.campaignId,
      'amountCents', r.amountCents,
      'donorName', r.donorName,
      'message', r.message,
      'createdAt', json_build_object('$type', 'Date', '$value', (extract(epoch from r.createdAt) * 1000)::bigint)
    )
  )::text;

  if octet_length(payload) >= 8000 then
    payload := json_build_object('op', lower(tg_op), 'id', r.id)::text;
  end if;

  perform pg_notify(channel_name('donations:campaignId=' || r.campaignId), payload);

  return r;
end;
$$;

create trigger donationsNotifyTrigger
  after insert or update or delete on donations
  for each row execute function donationsNotify();
