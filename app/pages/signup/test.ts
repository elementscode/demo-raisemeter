import { test, assert, equal, session, sql } from "@elements/app";
import { signup } from "#app/shared/services/auth";

test("signup", () => {
  test("stores a bcrypt hash, never the password", () => {
    signup("Maya", "maya@example.com", "longenough");

    let row = sql<{ passwordHash: string }>(`select passwordHash from users where email = 'maya@example.com'`).firstOrThrow();
    assert(row.passwordHash.startsWith("$2"), "expected a bcrypt hash");
    assert(session.isLoggedIn());
    equal(session.get("userName"), "Maya");
  });
});
