import { Job, email, sql } from "@elements/app";
import ReceiptEmail, { ReceiptDetails } from "#app/emails/receipt";

export interface SendReceiptJobFields {
  donationId: string;
}

/** Thanks the donor and sends the receipt, once the donation row exists. */
export class SendReceiptJob extends Job<SendReceiptJobFields> {
  static maxAttempts = 5;

  run() {
    let row = sql<ReceiptDetails & { email: string }>(`
      select d.email, d.donorName, d.amountCents, d.message, d.createdAt as paidAt,
             c.title as campaignTitle, c.slug as campaignSlug, u.name as organizerName,
             'RM-' || upper(right(replace(d.id::text, '-', ''), 10)) as receiptNumber
        from donations d
        join campaigns c on c.id = d.campaignId
        join users u on u.id = c.organizerId
       where d.id = ${this.fields.donationId}
    `).firstOrThrow("donation not found");

    email({
      to: row.email,
      subject: `Your receipt for ${row.campaignTitle}`,
      body: new ReceiptEmail({ receipt: row }),
    });
  }
}
