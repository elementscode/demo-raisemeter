import { test, equal, sql } from "@elements/app";
import { listCampaigns } from "#app/shared/services/campaigns";
import { makeCampaign, makeOrganizer } from "#app/shared/fixtures";

test("home", () => {
  test("featured campaigns come first", () => {
    let org = makeOrganizer();
    makeCampaign(org.id, "plain");
    let star = makeCampaign(org.id, "star");
    sql(`update campaigns set featured = true where id = ${star.id}`);

    equal(listCampaigns().map((c) => c.slug), ["star", "plain"]);
  });

  test("seeded covers resolve to a static asset", () => {
    let org = makeOrganizer();
    makeCampaign(org.id, "garden");

    equal(listCampaigns()[0].coverUrl.startsWith("/assets/"), true);
  });
});
