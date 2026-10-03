import { test, assert, equal, errorf, sql, ForbiddenError, ValidationError } from "@elements/app";
import { recordPayment, startDonation } from "#app/shared/services/checkout";
import { testCheckout } from "#app/shared/stripe";
import { makeCampaign, makeOrganizer } from "#app/shared/fixtures";
import { getTestCheckout, payTestCheckout } from "./services";

function checkoutId(url: string): string {
  let match = /^\/checkout\/test\/([0-9a-f-]+)$/.exec(url);

  if (!match) {
    errorf(`expected a test checkout url, got ${url}`);
  }

  return match![1];
}

function receiptJobs(donationId: string): number {
  return sql<{ n: number }>(`
    select count(*)::int as n from elements.jobs where fields->>'donationId' = ${donationId}
  `).firstOrThrow().n;
}

// Tests run against the development config. With a Stripe key in
// development.env the test checkout is off and startDonation would call
// Stripe, so the end-to-end cases run only without a key.
test("checkout-test", () => {
  test("recordPayment records a gift once, with its receipt", () => {
    let org = makeOrganizer();
    let c = makeCampaign(org.id, "garden");
    let id = sql<{ id: string }>(`
      insert into checkouts (campaignId, amountCents, donorName, message)
           values (${c.id}, 2500, 'Ada', 'Hi') returning id
    `).firstOrThrow().id;

    // stripeSessionId is unique, and other test files run at the same time.
    let sessionId = `cs_${crypto.randomUUID()}`;
    recordPayment(sessionId, id, 2500, "ada@example.com");
    recordPayment(sessionId, id, 2500, "ada@example.com");

    let donations = sql<{ id: string; amountCents: number; donorName: string }>(`
      select id, amountCents, donorName from donations where checkoutId = ${id}
    `).all();
    equal(donations.length, 1);
    equal(donations[0].donorName, "Ada");
    equal(receiptJobs(donations[0].id), 1);
  });

  if (!testCheckout()) {
    test("the test checkout is off once a key is set", () => {
      try {
        payTestCheckout("00000000-0000-0000-0000-000000000000", "a@example.com");
        errorf("expected ForbiddenError");
      } catch (err) {
        assert(err instanceof ForbiddenError, "expected ForbiddenError");
      }
    });

    return;
  }

  test("a donation without a key goes to the test checkout and pays", async () => {
    let org = makeOrganizer();
    let c = makeCampaign(org.id, "garden", 100000, "Greenhouse");

    let url = await startDonation({ campaignId: c.id, amount: 40, name: "Ada", anonymous: false, message: "Grow on" });
    let id = checkoutId(url);

    let pending = getTestCheckout(id)!;
    equal(pending.status, "pending");
    equal(pending.amountCents, 4000);
    equal(pending.campaignTitle, "Greenhouse");

    equal(payTestCheckout(id, " Ada@Example.com "), c.slug);

    let checkout = sql<{ status: string; stripeSessionId: string }>(`
      select status, stripeSessionId from checkouts where id = ${id}
    `).firstOrThrow();
    equal(checkout.status, "paid");
    equal(checkout.stripeSessionId, `test_${id}`);

    let donation = sql<{ id: string; amountCents: number; donorName: string; message: string; email: string }>(`
      select id, amountCents, donorName, message, email from donations where checkoutId = ${id}
    `).firstOrThrow();
    equal(donation.amountCents, 4000);
    equal(donation.donorName, "Ada");
    equal(donation.message, "Grow on");
    equal(donation.email, "ada@example.com");

    // The receipt is scheduled, as it is for a Stripe payment.
    equal(receiptJobs(donation.id), 1);
  });

  test("paying twice records one donation", async () => {
    let org = makeOrganizer();
    let c = makeCampaign(org.id, "garden");
    let id = checkoutId(await startDonation({ campaignId: c.id, amount: 25, name: "", anonymous: true, message: "" }));

    payTestCheckout(id, "anon@example.com");

    try {
      payTestCheckout(id, "anon@example.com");
      errorf("expected the second payment to be refused");
    } catch (err: any) {
      assert(/already paid/.test(err.message), `unexpected error: ${err.message}`);
    }

    equal(sql<{ n: number }>(`select count(*)::int as n from donations where checkoutId = ${id}`).firstOrThrow().n, 1);
  });

  test("needs an email for the receipt", async () => {
    let org = makeOrganizer();
    let c = makeCampaign(org.id, "garden");
    let id = checkoutId(await startDonation({ campaignId: c.id, amount: 10, name: "Ada", anonymous: false, message: "" }));

    try {
      payTestCheckout(id, "not-an-email");
      errorf("expected a ValidationError");
    } catch (err) {
      assert(err instanceof ValidationError, "expected a ValidationError");
    }

    equal(getTestCheckout(id)!.status, "pending");
  });
});
