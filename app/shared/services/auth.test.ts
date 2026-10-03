import { test, assert, equal, errorf, session, AuthError } from "@elements/app";
import { signin, signup } from "./auth";

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
    signup("Maya", " Maya@Example.com ", "longenough");
    assert(session.isLoggedIn());
    equal(session.get("userName"), "Maya");
  });

  test("signin checks the password", async () => {
    signup("Maya", "maya@example.com", "longenough");
    session.logout();

    equal(await authMessage(() => signin("maya@example.com", "wrongpassword")), "Invalid email or password.");
    equal(await authMessage(() => signin("MAYA@example.com", "longenough")), "");
    assert(session.isLoggedIn());
  });

  test("signup refuses a taken email and a short password", async () => {
    signup("Maya", "maya@example.com", "longenough");

    let duplicate = await authMessage(() => signup("Other", "maya@example.com", "longenough"));
    if (!duplicate.includes("already registered")) {
      errorf("expected a duplicate email to be refused");
    }

    assert((await authMessage(() => signup("Short", "s@example.com", "short"))).includes("at least"));
  });
});
