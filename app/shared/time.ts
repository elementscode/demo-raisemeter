export function timeAgo(date: Date, now: number = Date.now()): string {
  let seconds = Math.max(0, Math.round((now - +date) / 1000));

  if (seconds < 45) {
    return "just now";
  }

  let minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  let hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  let days = Math.round(hours / 24);
  if (days < 30) {
    return days === 1 ? "yesterday" : `${days} days ago`;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
