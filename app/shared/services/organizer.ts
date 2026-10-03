import { File, ForbiddenError, session, sql, tx, ValidationError } from "@elements/app";
import { SendUpdateJob } from "#app/jobs/send-update";

const COVER_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_COVER_BYTES = 5 * 1024 * 1024;

export interface CampaignForm {
  title: string;
  summary: string;
  story: string;
  goal: number;
  cover: File;
}

export interface UpdateForm {
  campaignId: string;
  title: string;
  body: string;
}

export interface DonationRecord {
  id: string;
  createdAt: Date;
  donorName: string | null;
  email: string;
  amountCents: number;
  message: string;
}

/** The signed-in organizer's campaign, or a 403 for anyone else's. */
export function requireOwnCampaign(campaignId: string): { id: string; slug: string; title: string; goalCents: number } {
  let userId = session.getOrThrow("userId");

  let campaign = sql<{ id: string; slug: string; title: string; goalCents: number; organizerId: string }>(`
    select id, slug, title, goalCents, organizerId from campaigns where id = ${campaignId}
  `).firstOrThrow("That campaign does not exist.");

  if (campaign.organizerId !== userId) {
    throw new ForbiddenError("That campaign belongs to another organizer.");
  }

  return campaign;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "") || "campaign";
}

export function checkCampaign(form: CampaignForm) {
  let errors: { title?: string[]; summary?: string[]; story?: string[]; goal?: string[]; cover?: string[] } = {};
  let title = (form.title ?? "").trim();
  let summary = (form.summary ?? "").trim();
  let story = (form.story ?? "").trim();
  let goal = Number(form.goal);

  if (title.length < 4 || title.length > 100) {
    errors.title = ["Give it a title between 4 and 100 characters."];
  }

  if (summary.length < 10 || summary.length > 200) {
    errors.summary = ["Write a one-line summary, 10 to 200 characters."];
  }

  if (story.length < 40) {
    errors.story = ["Tell the story in at least a few sentences."];
  }

  if (!Number.isFinite(goal) || goal < 100 || goal > 10_000_000) {
    errors.goal = ["Set a goal between $100 and $10,000,000."];
  }

  if (!form.cover) {
    errors.cover = ["Add a cover photo."];
  } else if (!COVER_TYPES.has(form.cover.contentType)) {
    errors.cover = ["The cover must be a JPEG, PNG, WebP or GIF."];
  } else if (form.cover.size > MAX_COVER_BYTES) {
    errors.cover = ["Keep the cover under 5 MB."];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  return { title, summary, story, goalCents: Math.round(goal) * 100 };
}

/**
 * Creates a campaign with its cover and returns its slug.
 *
 * @rpc
 */
export function createCampaign(form: CampaignForm): string {
  let organizerId = session.getOrThrow("userId");
  let c = checkCampaign(form);

  return tx(() => {
    let image = sql<{ id: string }>(`
      insert into images (contentType, data) values (${form.cover.contentType}, ${form.cover.data}) returning id
    `).firstOrThrow();

    let base = slugify(c.title);
    let taken = sql<{ slug: string }>(`
      select slug from campaigns where slug = ${base} or slug like ${base + "-%"}
    `).all().map((r) => r.slug);

    let slug = base;
    for (let n = 2; taken.includes(slug); n++) {
      slug = `${base}-${n}`;
    }

    sql(`
      insert into campaigns (organizerId, slug, title, summary, story, goalCents, coverImageId)
           values (${organizerId}, ${slug}, ${c.title}, ${c.summary}, ${c.story}, ${c.goalCents}, ${image.id})
    `);

    return slug;
  });
}

/**
 * Posts an update and queues the email to every donor. Returns how many
 * donors it goes to.
 *
 * @rpc
 */
export function postUpdate(form: UpdateForm): number {
  let campaign = requireOwnCampaign(form.campaignId);
  let title = (form.title ?? "").trim();
  let body = (form.body ?? "").trim();
  let errors: { title?: string[]; body?: string[] } = {};

  if (!title || title.length > 120) {
    errors.title = ["Give the update a title, up to 120 characters."];
  }

  if (!body) {
    errors.body = ["Write something for your donors."];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  return tx(() => {
    let update = sql<{ id: string }>(`
      insert into updates (campaignId, title, body) values (${campaign.id}, ${title}, ${body}) returning id
    `).firstOrThrow();

    new SendUpdateJob({ updateId: update.id }).schedule();

    return sql<{ n: number }>(`
      select count(distinct lower(email))::int as n from donations where campaignId = ${campaign.id}
    `).firstOrThrow().n;
  });
}

export function listDonationRecords(campaignId: string): DonationRecord[] {
  return sql<DonationRecord>(`
    select id, createdAt, donorName, email, amountCents, message
      from donations
     where campaignId = ${campaignId}
     order by createdAt desc
  `).all();
}

function csvCell(value: string): string {
  // A leading = + - @ would run as a formula when the file opens in a spreadsheet.
  let safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;

  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function donationsCsv(rows: DonationRecord[]): string {
  let lines = [["date", "name", "email", "amount_usd", "message", "donation_id"].join(",")];

  for (let r of rows) {
    lines.push([
      r.createdAt.toISOString(),
      r.donorName ?? "Anonymous",
      r.email,
      (r.amountCents / 100).toFixed(2),
      r.message,
      r.id,
    ].map(csvCell).join(","));
  }

  return lines.join("\r\n") + "\r\n";
}
