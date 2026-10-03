import { test, equal } from "@elements/app";
import { safeNext } from "#app/shared/redirects";

test("signin", () => {
  test("next stays on this site", () => {
    equal(safeNext("/campaigns/new"), "/campaigns/new");
    equal(safeNext("//evil.example"), "/dashboard");
    equal(safeNext("/\\evil.example"), "/dashboard");
    equal(safeNext("https://evil.example"), "/dashboard");
    equal(safeNext(undefined), "/dashboard");
  });
});
