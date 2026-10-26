![Fundraising campaigns with card donations, built by Claude Code on Elements: a campaign page for a community garden greenhouse with its cover photo, a progress bar at 93% of the goal, the donor count, and a live wall of recent donations with messages.](https://elements.dev/demos/01a0f443-f318-7f44-aa1b-ecda51aa76f5/poster?v=78cc5d0cc062)

# Fundraising campaigns with card donations, built by Claude Code on Elements

> Raisemeter is a full-stack app built with Claude Code on Elements.

Campaigns with a story, cover photo and live progress bar, card donations on a donor wall, emailed receipts, and updates to donors.

[Run this app on your machine](https://elements.dev/demos/01a0f443-f318-7f44-aa1b-ecda51aa76f5). Use this demo as inspiration, or as the starting point for your own app. Your agent creates a new app with this one as the scaffold, and you prompt it to add whatever features you want.

## Payments

Without a Stripe key, donations run through the app's built-in test checkout:
the Donate button opens a checkout page in the app with the gift, the total
and a Pay button, and paying records the gift through the same code a Stripe
payment uses, so the meter, the donor wall and the emailed receipt all work.
No card is charged.

For real Stripe Checkout, add a Stripe secret key. Sandbox keys are free: sign
up at dashboard.stripe.com/register, copy the secret key from Developers, API
keys, and set it in `config/env/development.env`:

```text
STRIPE_SECRET_KEY=
```

The same Donate button then goes to Stripe. In development a donation is
recorded when Stripe sends the donor back, so no webhook is needed.
Production requires the key: the build fails without it and the app refuses to
start with it empty. It registers its own Stripe webhook the first time a donor
starts a checkout.

## How it's built

Raisemeter needed campaign pages with a story and a cover photo, card donations, a progress bar and donor wall that move as gifts arrive, emailed receipts and updates to donors. Each of those is a part of Elements, so the agent spent its 17 minutes on the campaigns themselves.

- **A live meter and donor wall.** Donations are a LiveTable, one view per campaign. When a gift is recorded, every open campaign page moves its progress bar and adds the donor's name and message to the wall, and the donor's email stays on the server.

- **Donations by card.** A donor picks an amount and pays through Stripe. The gift is recorded when the donor returns and again when Stripe's webhook arrives, once either way. Until a Stripe key is added, an in-app test checkout stands in and records the gift the same way, and in production the app registers its own webhook on the first checkout.

- **Cover photos and stories.** An organizer uploads a cover photo straight from the campaign form and it is stored in the database. Stories and updates are written in Markdown.

- **Background work.** A job emails each donor a receipt once the gift is saved, and another sends an organizer's update to every donor as their own email.

- **Server calls as function calls.** Donating, creating a campaign, posting an update and searching call server functions straight from the page with `@rpc`.

- **Data and roles from SQL.** Migrations define the site and seed two organizers, four campaigns at different stages, their donations and updates. Sessions keep each campaign's dashboard and its donations export with its organizer.

## Why Elements

Elements is an integrated full-stack app framework and a project server. The project server checks the agent's work as it builds: it type-checks the server and browser code, analyzes the program, applies migrations and runs the tests, then reports the results to the agent. A security mistake, such as calling a server-only function from the browser, is a compile error. The agent reads the report and fixes its own mistakes before it tells you a feature is done. The same checks run on every feature you ask for next.
