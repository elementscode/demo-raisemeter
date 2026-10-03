/** Whole dollars when the amount is round, cents when it is not. */
export function formatMoney(cents: number): string {
  let dollars = cents / 100;

  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function percentOf(raisedCents: number, goalCents: number): number {
  return goalCents > 0 ? Math.round((raisedCents / goalCents) * 100) : 0;
}
