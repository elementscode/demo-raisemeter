import { test, assert, equal, errorf, sql, NotFoundError } from "@elements/app";
import { getCampaign } from "#app/shared/services/campaigns";
import { makeCampaign, makeDonation, makeOrganizer } from "#app/shared/fixtures";

test("campaign", () => {
  test("an unknown slug is a 404", () => {
    try {
      getCampaign("nope");
      errorf("expected NotFoundError");
    } catch (err) {
      assert(err instanceof NotFoundError, "expected NotFoundError");
    }
  });

  test("updates are newest first and rendered", () => {
    let org = makeOrganizer();
    let c = makeCampaign(org.id, "garden");
    sql(`insert into updates (campaignId, title, body, createdAt) values (${c.id}, 'Old', 'first', now() - interval '2 days')`);
    sql(`insert into updates (campaignId, title, body) values (${c.id}, 'New', '**second**')`);

    let detail = getCampaign("garden");
    equal(detail.updates.map((u) => u.title), ["New", "Old"]);
    equal(detail.updates[0].bodyHtml.trim(), "<p><strong>second</strong></p>");
  });

  test("the donation trigger accepts a long message", () => {
    let org = makeOrganizer();
    let c = makeCampaign(org.id, "garden");
    makeDonation(c.id, 500, "a@example.com", "Ada", "x".repeat(9000));

    equal(sql<{ n: number }>(`select count(*)::int as n from donations`).firstOrThrow().n, 1);
  });
});
