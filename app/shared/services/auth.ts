import { sql, session, AuthError, SqlError } from "@elements/app";

export const MIN_PASSWORD = 8;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/** @rpc */
export function signin(email: string, password: string) {
  let address = normalizeEmail(email);

  if (!address || !password) {
    throw new AuthError("Enter your email and password.");
  }

  let user = sql<{ id: string; name: string }>(`
    select id, name from users
     where email = ${address}
       and passwordHash = crypt(${password}, passwordHash)
  `).first();

  if (!user) {
    throw new AuthError("Invalid email or password.");
  }

  session.login({ userId: user.id, userName: user.name });
}

/** @rpc */
export function signup(name: string, email: string, password: string) {
  let address = normalizeEmail(email);
  let displayName = name.trim();

  if (!displayName) {
    throw new AuthError("Enter your name.");
  }

  if (!isEmail(address)) {
    throw new AuthError("Enter a valid email address.");
  }

  if (password.length < MIN_PASSWORD) {
    throw new AuthError(`Password must be at least ${MIN_PASSWORD} characters.`);
  }

  if (!sql(`select 1 from users where email = ${address}`).empty()) {
    throw new AuthError("That email is already registered.");
  }

  let user;
  try {
    user = sql<{ id: string }>(`
      insert into users (email, name, passwordHash)
           values (${address}, ${displayName}, crypt(${password}, genSalt('bf', 12)))
        returning id
    `).firstOrThrow();
  } catch (err) {
    if (err instanceof SqlError) {
      throw new AuthError("That email is already registered.");
    }

    throw err;
  }

  session.login({ userId: user.id, userName: displayName });
}

/** @rpc */
export function signout() {
  session.logout();
}
