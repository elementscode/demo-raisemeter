import { Job, email, sql } from "@elements/app";
import CampaignUpdateEmail from "#app/emails/campaign-update";
import { renderMarkdown } from "#app/shared/markdown";

export interface SendUpdateJobFields {
  updateId: string;
}

/** Emails an organizer's update to every distinct donor of the campaign. */
export class SendUpdateJob extends Job<SendUpdateJobFields> {
  static maxAttempts = 3;
  static timeoutMs = 300_000;

  run() {
    let update = sql<{ campaignId: string; title: string; body: string; campaignTitle: string; campaignSlug: string; organizerName: string }>(`
      select up.campaignId, up.title, up.body, c.title as campaignTitle, c.slug as campaignSlug, u.name as organizerName
        from updates up
        join campaigns c on c.id = up.campaignId
        join users u on u.id = c.organizerId
       where up.id = ${this.fields.updateId}
    `).firstOrThrow("update not found");

    let recipients = sql<{ email: string }>(`
      select distinct lower(email) as email from donations where campaignId = ${update.campaignId}
    `).all();

    let details = {
      campaignTitle: update.campaignTitle,
      campaignSlug: update.campaignSlug,
      organizerName: update.organizerName,
      title: update.title,
      bodyHtml: renderMarkdown(update.body),
    };

    // One message per donor, so no donor sees another's address.
    for (let r of recipients) {
      email({
        to: r.email,
        subject: `${update.campaignTitle}: ${update.title}`,
        body: new CampaignUpdateEmail({ update: details }),
      });
    }
  }
}
