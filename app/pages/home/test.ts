import { test, equal, sql } from "@elements/app";
import { listCampaigns } from "#app/shared/services/campaigns";
import { makeCampaign, makeOrganizer } from "#app/shared/fixtures";

test("home", () => {
  test("featured campaigns come first", () => {
    let org = makeOrganizer();
    let plain = makeCampaign(org.id, "plain");
    let star = makeCampaign(org.id, "star");
    sql(`update campaigns set featured = true where id = ${star.id}`);

    let slugs = listCampaigns().map((c) => c.slug);
    equal(slugs.filter((s) => s === star.slug || s === plain.slug), [star.slug, plain.slug]);
  });

  test("seeded covers resolve to a static asset", () => {
    let org = makeOrganizer();
    let garden = makeCampaign(org.id, "garden");

    equal(listCampaigns().find((c) => c.slug === garden.slug)!.coverUrl.startsWith("/assets/"), true);
  });
});
