import { test, assert, equal, errorf, session, AuthError } from "@elements/app";
import { signin, signup } from "./auth";
import { unique } from "#app/shared/fixtures";

async function authMessage(fn: () => void | Promise<void>): Promise<string> {
  try {
    await fn();
  } catch (err) {
    if (err instanceof AuthError) {
      return err.message;
    }

    throw err;
  }

  return "";
}

test("auth", () => {
  test("signup logs the organizer in with a lowercased email", () => {
    signup("Maya", ` ${unique("Maya@Example.com")} `, "longenough");
    assert(session.isLoggedIn());
    equal(session.get("userName"), "Maya");
  });

  test("signin checks the password", async () => {
    let email = unique("maya@example.com");
    signup("Maya", email, "longenough");
    session.logout();

    equal(await authMessage(() => signin(email, "wrongpassword")), "Invalid email or password.");
    equal(await authMessage(() => signin(email.toUpperCase(), "longenough")), "");
    assert(session.isLoggedIn());
  });

  test("signup refuses a taken email and a short password", async () => {
    let email = unique("maya@example.com");
    signup("Maya", email, "longenough");

    let duplicate = await authMessage(() => signup("Other", email, "longenough"));
    if (!duplicate.includes("already registered")) {
      errorf("expected a duplicate email to be refused");
    }

    assert((await authMessage(() => signup("Short", unique("s@example.com"), "short"))).includes("at least"));
  });
});
