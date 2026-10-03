import { LiveTable, ForbiddenError, sql } from "@elements/app";

/** What the public sees of a gift. The donor's email never leaves the server. */
export interface Donation {
  id: string;
  campaignId: string;
  amountCents: number;
  donorName: string | null;
  message: string;
  createdAt: Date;
}

// Rows arrive only from Stripe fulfillment, and the donationsNotify trigger
// broadcasts each one on this channel, so no browser writes through a view.
export let donations: LiveTable<Donation> = new LiveTable<Donation>({
  channel: (partition) => (partition ? `donations:${partition}` : "donations"),

  select: ({ campaignId }) => sql<Donation>(`
    select id, campaignId, amountCents, donorName, message, createdAt
      from donations
     where campaignId = ${campaignId}
  `),

  insert: () => {
    throw new ForbiddenError();
  },

  update: () => {
    throw new ForbiddenError();
  },

  delete: () => {
    throw new ForbiddenError();
  },
});
