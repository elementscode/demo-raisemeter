import { ForbiddenError, sql, ValidationError } from "@elements/app";
import { coverUrl, CoverSource } from "#app/shared/covers";
import { recordPayment } from "#app/shared/services/checkout";
import { testCheckout } from "#app/shared/stripe";

export interface TestCheckout {
  id: string;
  amountCents: number;
  donorName: string | null;
  message: string;
  status: "pending" | "paid";
  campaignTitle: string;
  campaignSlug: string;
  organizerName: string;
  coverUrl: string;
}

/** The pending gift the test checkout stands in for Stripe on. */
export function getTestCheckout(checkoutId: string): TestCheckout | undefined {
  let row = sql<Omit<TestCheckout, "coverUrl"> & CoverSource>(`
    select k.id, k.amountCents, k.donorName, k.message, k.status,
           c.title as campaignTitle, c.slug as campaignSlug, u.name as organizerName,
           c.coverAsset, c.coverImageId, i.hash as coverHash
      from checkouts k
      join campaigns c on c.id = k.campaignId
      join users u on u.id = c.organizerId
      left join images i on i.id = c.coverImageId
     where k.id = ${checkoutId}
  `).first();

  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    amountCents: row.amountCents,
    donorName: row.donorName,
    message: row.message,
    status: row.status,
    campaignTitle: row.campaignTitle,
    campaignSlug: row.campaignSlug,
    organizerName: row.organizerName,
    coverUrl: coverUrl(row),
  };
}

function isEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/**
 * Pays a pending gift without Stripe, in development with no key. It records
 * through the same recordPayment a Stripe payment does, so the wall, the
 * meter and the receipt all follow. Returns the campaign slug.
 *
 * @rpc
 */
export function payTestCheckout(checkoutId: string, email: string): string {
  if (!testCheckout()) {
    throw new ForbiddenError("The test checkout is off.");
  }

  let address = (email ?? "").trim().toLowerCase();

  if (!isEmail(address)) {
    throw new ValidationError<{ email: string }>({ email: ["Enter the email to send your receipt to."] });
  }

  // The amount comes from the pending row, never from the browser.
  let checkout = sql<{ id: string; amountCents: number; slug: string }>(`
    select k.id, k.amountCents, c.slug
      from checkouts k join campaigns c on c.id = k.campaignId
     where k.id = ${checkoutId} and k.status = 'pending'
  `).firstOrThrow("This donation was already paid or no longer exists.");

  recordPayment(`test_${checkout.id}`, checkout.id, checkout.amountCents, address);

  return checkout.slug;
}
