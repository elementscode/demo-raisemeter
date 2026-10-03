import { sql } from "@elements/app";

/**
 * Makes a value for a unique column unique to this call. Test files run in
 * parallel against one database, and two open transactions inserting the same
 * key block each other.
 */
export function unique(value: string): string {
  let suffix = crypto.randomUUID().slice(0, 8);
  let at = value.indexOf("@");

  return at < 0 ? `${value}-${suffix}` : `${value.slice(0, at)}-${suffix}${value.slice(at)}`;
}

/** Rows for tests, made inside each test's rolled-back transaction. */
export function makeOrganizer(email: string = "org@example.com", name: string = "Org"): { id: string; name: string } {
  return sql<{ id: string; name: string }>(`
    insert into users (email, name, passwordHash) values (${unique(email)}, ${name}, crypt('password1', genSalt('bf', 4))) returning id, name
  `).firstOrThrow();
}

export function makeCampaign(organizerId: string, slug: string, goalCents: number = 100000, title: string = "Fix the playground"): { id: string; slug: string } {
  return sql<{ id: string; slug: string }>(`
    insert into campaigns (organizerId, slug, title, summary, story, goalCents, coverAsset)
         values (${organizerId}, ${unique(slug)}, ${title}, 'A short summary', 'A **story** long enough to read.', ${goalCents}, 'garden')
      returning id, slug
  `).firstOrThrow();
}

export function makeDonation(campaignId: string, amountCents: number, email: string, donorName: string | null = "Ada", message: string = ""): void {
  sql(`
    insert into donations (campaignId, amountCents, donorName, message, email)
         values (${campaignId}, ${amountCents}, ${donorName}, ${message}, ${email})
  `);
}
