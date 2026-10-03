import { Request, Response } from "@elements/app";
import { donationsCsv, listDonationRecords, requireOwnCampaign } from "#app/shared/services/organizer";

export default function donationsCsvRoute(req: Request, res: Response) {
  let campaign = requireOwnCampaign(req.params.id);
  let csv = donationsCsv(listDonationRecords(campaign.id));

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${campaign.slug}-donations.csv"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.end(csv);
}
