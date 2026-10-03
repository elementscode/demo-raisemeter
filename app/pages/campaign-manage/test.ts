import { test, equal } from "@elements/app";
import { listDonationRecords } from "#app/shared/services/organizer";
import { makeCampaign, makeDonation, makeOrganizer } from "#app/shared/fixtures";

test("campaign-manage", () => {
  test("lists this campaign's donations, newest first, with emails", () => {
    let org = makeOrganizer();
    let mine = makeCampaign(org.id, "mine");
    let other = makeCampaign(org.id, "other");
    makeDonation(mine.id, 100, "first@example.com");
    makeDonation(other.id, 100, "elsewhere@example.com");
    makeDonation(mine.id, 200, "second@example.com", null);

    let rows = listDonationRecords(mine.id);
    equal(rows.map((r) => r.email).sort(), ["first@example.com", "second@example.com"]);
    equal(rows.find((r) => r.email === "second@example.com")?.donorName, null);
  });
});
