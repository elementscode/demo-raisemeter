![Raisemeter, a community fundraising site built with Elements: a campaign page for a community garden greenhouse with its cover photo, a progress bar at 93% of the goal, the donor count, and a live wall of recent donations with messages.](https://elements.dev/demos/01a0f443-f318-7f44-aa1b-ecda51aa76f5/poster?v=78cc5d0cc062)

# Raisemeter

> A demo app built with [Elements](https://elements.dev).

Campaigns with a story, cover photo and live progress bar, card donations on a donor wall, emailed receipts, and updates to donors.

**Demo:** [Raisemeter](https://elements.dev/demos/01a0f443-f318-7f44-aa1b-ecda51aa76f5)

## Agent specs

- **Agent:** Claude Code, Opus 5.5 Medium
- **Time:** 17 min
- **Cost:** $5.66 at API rates, September 2026

## Get started

```bash
elements create raisemeter -scaffold=elementscode/demo-raisemeter
```

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

### What Elements gave the app

- **A live meter and donor wall.** Donations are a LiveTable, one view per campaign. When a gift is recorded, every open campaign page moves its progress bar and adds the donor's name and message to the wall, and the donor's email stays on the server.

- **Donations by card.** A donor picks an amount and pays through Stripe. The gift is recorded when the donor returns and again when Stripe's webhook arrives, once either way. Until a Stripe key is added, an in-app test checkout stands in and records the gift the same way, and in production the app registers its own webhook on the first checkout.

- **Cover photos and stories.** An organizer uploads a cover photo straight from the campaign form and it is stored in the database. Stories and updates are written in Markdown.

- **Background work.** A job emails each donor a receipt once the gift is saved, and another sends an organizer's update to every donor as their own email.

- **Server calls as function calls.** Donating, creating a campaign, posting an update and searching call server functions straight from the page with `@rpc`.

- **Data and roles from SQL.** Migrations define the site and seed two organizers, four campaigns at different stages, their donations and updates. Sessions keep each campaign's dashboard and its donations export with its organizer.

### What the project server gave the agent

The project server runs alongside the agent and answers as soon as a file is saved: it type-checks the templates, TypeScript and SQL, applies migrations and reruns the tests, so every question came back right away and the agent kept building.

### What shipped

The app type-checks with zero errors and all 38 tests pass. Every page works on desktop and phone. A real sandbox payment went through Stripe end to end.

## Seed data and demo accounts

The seed loads in every environment: two organizers and four campaigns at
different stages, with 506 donations between them, the newest with names and
messages, and a few posted updates.

- A greenhouse for the Eastside Community Garden, 92% funded
- A kids' reading room at the Maple Street Library, 104%, past its goal
- Winter kennels for Riverside Animal Rescue, 48%
- Resurface the Lincoln Park basketball court, 12%

Both organizers use the password `raisemeter`, and the sign-in page lists them.
Donors don't need an account.

| Email                  | Name         | Campaigns                 |
| ---------------------- | ------------ | ------------------------- |
| maya@raisemeter.test   | Maya Okafor  | garden, library           |
| jordan@raisemeter.test | Jordan Reyes | animal rescue, basketball |

In development, receipt and update emails are written to the logs instead of
sent. Set the SMTP settings in `config/env/production.env` to send them.

The cover photos in `app/shared/assets/covers/` are public domain (US Forest
Service, FEMA) or CC0, from Wikimedia Commons. The causes and people are
fictional.

**Demo:** [Raisemeter](https://elements.dev/demos/01a0f443-f318-7f44-aa1b-ecda51aa76f5)

## License

MIT. See [LICENSE](LICENSE).
