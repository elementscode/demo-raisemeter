import { getAppUrl, sql, tx, ValidationError } from "@elements/app";
import { stripe, testCheckout } from "#app/shared/stripe";
import { ensureWebhook } from "#app/shared/stripe-webhook";
import { SendReceiptJob } from "#app/jobs/send-receipt";

export const MIN_DONATION = 1;
export const MAX_DONATION = 50_000;
export const MAX_MESSAGE = 280;
export const MAX_NAME = 60;

export interface DonateForm {
  campaignId: string;
  amount: number;
  name: string;
  anonymous: boolean;
  message: string;
}

/** Validates a gift and returns it in cents, with the name to show. */
export function checkDonation(form: DonateForm): { amountCents: number; donorName: string | null; message: string } {
  let amount = Number(form.amount);

  if (!Number.isFinite(amount) || amount < MIN_DONATION) {
    throw new ValidationError<DonateForm>({ amount: [`Enter at least $${MIN_DONATION}.`] });
  }

  if (amount > MAX_DONATION) {
    throw new ValidationError<DonateForm>({ amount: [`The most one gift can be is $${MAX_DONATION.toLocaleString("en-US")}.`] });
  }

  let name = (form.name ?? "").trim();
  let message = (form.message ?? "").trim();

  if (!form.anonymous && !name) {
    throw new ValidationError<DonateForm>({ name: ["Add your name, or give anonymously."] });
  }

  if (name.length > MAX_NAME) {
    throw new ValidationError<DonateForm>({ name: [`Keep your name under ${MAX_NAME} characters.`] });
  }

  if (message.length > MAX_MESSAGE) {
    throw new ValidationError<DonateForm>({ message: [`Keep your message under ${MAX_MESSAGE} characters.`] });
  }

  return {
    amountCents: Math.round(amount * 100),
    donorName: form.anonymous ? null : name,
    message,
  };
}

/**
 * Records the pending gift and returns the url to send the donor to: Stripe
 * Checkout, or the in-app test checkout in development without a key.
 *
 * @rpc
 */
export async function startDonation(form: DonateForm): Promise<string> {
  let gift = checkDonation(form);

  let campaign = sql<{ id: string; slug: string; title: string }>(`
    select id, slug, title from campaigns where id = ${form.campaignId}
  `).firstOrThrow("That campaign no longer exists.");

  let pending = sql<{ id: string }>(`
    insert into checkouts (campaignId, amountCents, donorName, message)
         values (${campaign.id}, ${gift.amountCents}, ${gift.donorName}, ${gift.message})
      returning id
  `).firstOrThrow();

  if (testCheckout()) {
    return `/checkout/test/${pending.id}`;
  }

  await ensureWebhook();

  let session = await stripe().checkout.sessions.create({
    mode: "payment",
    submit_type: "donate",
    payment_method_types: ["card"],
    client_reference_id: pending.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: gift.amountCents,
          product_data: { name: `Donation to ${campaign.title}` },
        },
      },
    ],
    success_url: `${getAppUrl()}/donate/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/c/${campaign.slug}`,
  });

  sql(`update checkouts set stripeSessionId = ${session.id} where id = ${pending.id}`);

  return session.url!;
}

export interface Fulfillment {
  paid: boolean;
  slug: string;
}

/**
 * Turns a paid Checkout Session into a donation. Idempotent: the return page
 * and the webhook both call it, in either order, any number of times. It
 * trusts only what it reads back from Stripe.
 */
export async function fulfillDonation(sessionId: string): Promise<Fulfillment | undefined> {
  let checkout = await stripe().checkout.sessions.retrieve(sessionId);

  let row = sql<{ id: string; slug: string }>(`
    select k.id, c.slug
      from checkouts k join campaigns c on c.id = k.campaignId
     where k.id = ${checkout.client_reference_id} and k.stripeSessionId = ${checkout.id}
  `).first();

  if (!row) {
    return undefined;
  }

  if (checkout.payment_status !== "paid") {
    return { paid: false, slug: row.slug };
  }

  let email = checkout.customer_details?.email ?? checkout.customer_email ?? "";
  recordPayment(checkout.id, row.id, checkout.amount_total!, email);

  return { paid: true, slug: row.slug };
}

/**
 * The one place a gift is recorded, from Stripe or the test checkout: it marks
 * the checkout paid, adds the donation (which moves every open campaign page)
 * and schedules the receipt. The status guard makes the first caller the only
 * one that records it.
 */
export function recordPayment(sessionId: string, checkoutId: string, amountCents: number, email: string) {
  tx(() => {
    let claimed = sql<{ campaignId: string; donorName: string | null; message: string }>(`
      update checkouts
         set status = 'paid',
             stripeSessionId = coalesce(stripeSessionId, ${sessionId})
       where id = ${checkoutId} and status = 'pending'
      returning campaignId, donorName, message
    `).first();

    if (!claimed) {
      return;
    }

    let donation = sql<{ id: string }>(`
      insert into donations (campaignId, checkoutId, amountCents, donorName, message, email)
           values (${claimed.campaignId}, ${checkoutId}, ${amountCents}, ${claimed.donorName}, ${claimed.message}, ${email})
        returning id
    `).firstOrThrow();

    new SendReceiptJob({ donationId: donation.id }).schedule();
  });
}
