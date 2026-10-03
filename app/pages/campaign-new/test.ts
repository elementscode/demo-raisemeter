import { test, assert, equal, errorf, session, sql, File, ValidationError } from "@elements/app";
import { createCampaign, CampaignForm } from "#app/shared/services/organizer";
import { makeOrganizer } from "#app/shared/fixtures";

function cover(contentType: string = "image/png"): File {
  let data = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  return new File({ name: "cover.png", size: data.length, contentType, data, lastModified: new Date() });
}

function form(overrides: Partial<CampaignForm> = {}): CampaignForm {
  return {
    title: "Paint the mural",
    summary: "A mural for the underpass on 5th.",
    story: "The underpass on 5th is grey and sad. Local artists will paint it with kids from the block.",
    goal: 2500,
    cover: cover(),
    ...overrides,
  };
}

test("campaign-new", () => {
  test("creates the campaign with its cover and a unique slug", () => {
    let org = makeOrganizer();
    session.login({ userId: org.id, userName: org.name });

    equal(createCampaign(form()), "paint-the-mural");
    equal(createCampaign(form()), "paint-the-mural-2");

    let row = sql<{ goalCents: number; hasCover: boolean }>(`
      select goalCents, coverImageId is not null as hasCover from campaigns where organizerId = ${org.id} and slug = 'paint-the-mural'
    `).firstOrThrow();
    equal(row.goalCents, 250000);
    assert(row.hasCover);
  });

  test("rejects a cover that is not an image", () => {
    let org = makeOrganizer();
    session.login({ userId: org.id, userName: org.name });

    try {
      createCampaign(form({ cover: cover("text/html") }));
      errorf("expected ValidationError");
    } catch (err) {
      assert(err instanceof ValidationError && !!err.errors?.cover, "expected a cover error");
    }
  });

  test("requires a signed-in organizer", () => {
    let count = () => sql<{ n: number }>(`select count(*)::int as n from campaigns where title = 'Paint the mural'`).firstOrThrow().n;
    let before = count();

    try {
      createCampaign(form());
      errorf("expected an error when signed out");
    } catch {
      equal(count(), before);
    }
  });
});
