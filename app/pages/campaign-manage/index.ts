import { Request, Response, redirect, session, sql } from "@elements/app";
import { donations } from "#app/shared/services/donations";
import { listDonationRecords, requireOwnCampaign } from "#app/shared/services/organizer";
import html from "./template";

export default function route(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect(`/signin?next=/dashboard/c/${req.params.id}`);
    return;
  }

  let campaign = requireOwnCampaign(req.params.id);

  let updates = sql<{ id: string; title: string; createdAt: Date }>(`
    select id, title, createdAt from updates where campaignId = ${campaign.id} order by createdAt desc
  `).all();

  return new html({
    campaign,
    live: donations.view({ campaignId: campaign.id }),
    records: listDonationRecords(campaign.id),
    updates,
  });
}
