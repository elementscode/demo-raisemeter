import { Request, Response } from "@elements/app";
import { getCampaign } from "#app/shared/services/campaigns";
import { donations } from "#app/shared/services/donations";
import html from "./template";

export default function route(req: Request, res: Response) {
  let campaign = getCampaign(req.params.slug);

  return new html({
    campaign,
    donations: donations.view({ campaignId: campaign.id }),
    thanks: req.query.thanks === "1",
    pending: req.query.pending === "1",
  });
}
