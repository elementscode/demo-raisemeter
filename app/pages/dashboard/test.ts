import { test, equal } from "@elements/app";
import { listOrganizerCampaigns } from "#app/shared/services/campaigns";
import { makeCampaign, makeOrganizer } from "#app/shared/fixtures";

test("dashboard", () => {
  test("shows only the organizer's own campaigns", () => {
    let maya = makeOrganizer("maya@example.com", "Maya");
    let jordan = makeOrganizer("jordan@example.com", "Jordan");
    let garden = makeCampaign(maya.id, "garden");
    makeCampaign(jordan.id, "court");

    equal(listOrganizerCampaigns(maya.id).map((c) => c.slug), [garden.slug]);
  });
});
