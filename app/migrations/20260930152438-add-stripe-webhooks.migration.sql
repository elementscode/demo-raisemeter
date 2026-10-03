-- add stripe webhooks

-- The webhook endpoints the app registers with Stripe in production, one row
-- per url it has served from, and the signing secret Stripe returns once,
-- when an endpoint is created. A domain change adds a row and leaves the old
-- endpoint in place, so a cutover where both domains serve traffic loses no
-- events.
create table stripeWebhooks (
  url text primary key,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  endpointId text not null,
  secret text not null
);

create trigger stripeWebhooksTouchUpdatedAt
  before update on stripeWebhooks
  for each row execute function touchUpdatedAt();
