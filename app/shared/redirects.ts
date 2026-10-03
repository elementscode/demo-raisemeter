/** Only a path on this site, so a crafted link cannot bounce a user elsewhere. */
export function safeNext(next: unknown): string {
  let path = typeof next === "string" ? next : "";

  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : "/dashboard";
}
