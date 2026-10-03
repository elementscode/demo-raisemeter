import { Request, Response, redirect, session } from "@elements/app";
import { listOrganizerCampaigns } from "#app/shared/services/campaigns";
import html from "./template";

export default function route(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect("/signin?next=/dashboard");
    return;
  }

  return new html({
    name: session.getOrThrow("userName"),
    campaigns: listOrganizerCampaigns(session.getOrThrow("userId")),
  });
}
