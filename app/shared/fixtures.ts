import { sql } from "@elements/app";

/** Rows for tests: the test database gets no development seed. */
export function makeOrganizer(email: string = "org@example.com", name: string = "Org"): { id: string; name: string } {
  return sql<{ id: string; name: string }>(`
    insert into users (email, name, passwordHash) values (${email}, ${name}, crypt('password1', genSalt('bf', 4))) returning id, name
  `).firstOrThrow();
}

export function makeCampaign(organizerId: string, slug: string, goalCents: number = 100000, title: string = "Fix the playground"): { id: string; slug: string } {
  return sql<{ id: string; slug: string }>(`
    insert into campaigns (organizerId, slug, title, summary, story, goalCents, coverAsset)
         values (${organizerId}, ${slug}, ${title}, 'A short summary', 'A **story** long enough to read.', ${goalCents}, 'garden')
      returning id, slug
  `).firstOrThrow();
}

export function makeDonation(campaignId: string, amountCents: number, email: string, donorName: string | null = "Ada", message: string = ""): void {
  sql(`
    insert into donations (campaignId, amountCents, donorName, message, email)
         values (${campaignId}, ${amountCents}, ${donorName}, ${message}, ${email})
  `);
}
