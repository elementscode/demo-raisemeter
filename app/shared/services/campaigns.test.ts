import { test, equal } from "@elements/app";
import { getCampaign, listCampaigns, searchCampaigns } from "./campaigns";
import { makeCampaign, makeDonation, makeOrganizer } from "#app/shared/fixtures";

test("campaigns", () => {
  test("cards total what was raised and count donors", () => {
    let org = makeOrganizer();
    let c = makeCampaign(org.id, "court", 100000);
    makeDonation(c.id, 2500, "a@example.com");
    makeDonation(c.id, 7500, "b@example.com", null);

    let card = listCampaigns().find((x) => x.slug === "court")!;
    equal(card.raisedCents, 10000);
    equal(card.donorCount, 2);
    equal(card.organizerName, "Org");
  });

  test("a campaign with no donations reads zero", () => {
    let org = makeOrganizer();
    makeCampaign(org.id, "empty");

    equal(listCampaigns()[0].raisedCents, 0);
  });

  test("search matches title and treats % literally", () => {
    let org = makeOrganizer();
    makeCampaign(org.id, "library", 1000, "Library reading room");
    makeCampaign(org.id, "court", 1000, "Basketball court");

    equal(searchCampaigns("READING").map((c) => c.slug), ["library"]);
    equal(searchCampaigns("%").length, 0);
    equal(searchCampaigns("  ").length, 2);
  });

  test("the story renders as markdown", () => {
    let org = makeOrganizer();
    makeCampaign(org.id, "garden");

    equal(getCampaign("garden").storyHtml.trim(), "<p>A <strong>story</strong> long enough to read.</p>");
  });
});
