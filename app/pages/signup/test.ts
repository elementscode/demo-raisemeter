import { test, assert, equal, session, sql } from "@elements/app";
import { signup } from "#app/shared/services/auth";
import { unique } from "#app/shared/fixtures";

test("signup", () => {
  test("stores a bcrypt hash, never the password", () => {
    let email = unique("maya@example.com");
    signup("Maya", email, "longenough");

    let row = sql<{ passwordHash: string }>(`select passwordHash from users where email = ${email}`).firstOrThrow();
    assert(row.passwordHash.startsWith("$2"), "expected a bcrypt hash");
    assert(session.isLoggedIn());
    equal(session.get("userName"), "Maya");
  });
});
