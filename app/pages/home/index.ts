import { Request, Response } from "@elements/app";
import { listCampaigns } from "#app/shared/services/campaigns";
import html from "./template";

export default function route(req: Request, res: Response) {
  return new html({ campaigns: listCampaigns() });
}
