import { test, assert, equal, errorf, session, sql, ForbiddenError } from "@elements/app";
import { donationsCsv, postUpdate, requireOwnCampaign, slugify } from "./organizer";
import { makeCampaign, makeDonation, makeOrganizer } from "#app/shared/fixtures";

test("slugify", () => {
  equal(slugify("A Kids' Reading Room!"), "a-kids-reading-room");
  equal(slugify("Café  Olé"), "cafe-ole");
  equal(slugify("!!!"), "campaign");
});

test("donationsCsv", () => {
  test("quotes commas and quotes", () => {
    let csv = donationsCsv([{ id: "1", createdAt: new Date("2026-01-02T03:04:05Z"), donorName: "Lee, Ann", email: "a@x.com", amountCents: 2550, message: 'say "hi"' }]);
    equal(csv.split("\r\n")[1], '2026-01-02T03:04:05.000Z,"Lee, Ann",a@x.com,25.50,"say ""hi""",1');
  });

  test("neutralizes spreadsheet formulas", () => {
    let csv = donationsCsv([{ id: "1", createdAt: new Date(), donorName: null, email: "a@x.com", amountCents: 100, message: "=HYPERLINK(1)" }]);
    assert(csv.includes(",'=HYPERLINK(1),"), "formula cell should be prefixed");
    assert(csv.includes(",Anonymous,"), "no name reads as Anonymous");
  });
});

test("organizer access", () => {
  test("an organizer can open only their own campaign", () => {
    let maya = makeOrganizer("maya@example.com", "Maya");
    let jordan = makeOrganizer("jordan@example.com", "Jordan");
    let garden = makeCampaign(maya.id, "garden");

    session.login({ userId: jordan.id, userName: jordan.name });

    try {
      requireOwnCampaign(garden.id);
      errorf("expected ForbiddenError");
    } catch (err) {
      assert(err instanceof ForbiddenError, "expected ForbiddenError");
    }

    session.login({ userId: maya.id, userName: maya.name });
    equal(requireOwnCampaign(garden.id).slug, garden.slug);
  });

  test("posting an update queues the email to each distinct donor", () => {
    let maya = makeOrganizer("maya@example.com", "Maya");
    let garden = makeCampaign(maya.id, "garden");
    makeDonation(garden.id, 1000, "a@example.com");
    makeDonation(garden.id, 2000, "A@example.com");
    makeDonation(garden.id, 3000, "b@example.com");

    session.login({ userId: maya.id, userName: maya.name });
    let recipients = postUpdate({ campaignId: garden.id, title: "Frame is up", body: "Thanks!" });

    equal(recipients, 2);
    equal(sql<{ n: number }>(`select count(*)::int as n from updates where campaignId = ${garden.id}`).firstOrThrow().n, 1);
  });
});
