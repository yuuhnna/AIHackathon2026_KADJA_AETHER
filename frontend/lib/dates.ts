/**
 * Date helpers for the rehabilitation activity log.
 *
 * Activity dates are calendar dates ("2026-07-31"), not instants. Passing
 * one to `new Date()` parses it as UTC midnight, which then renders as the
 * *previous* day for any viewer west of UTC. These helpers build and read
 * dates in local time so a logged date always displays as the date entered.
 */

/** "2026-07-31" -> "July 31, 2026". Returns the input unchanged if unparseable. */
export function formatIsoDate(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return iso;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** "2026-07-31" -> "Jul 31, 2026", for tighter spaces like inline meta rows. */
export function formatIsoDateShort(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return iso;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Today as a local-time ISO date string, suitable for an <input type="date">. */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Descending comparator for ISO date strings. Lexicographic ordering is
 * correct for zero-padded yyyy-mm-dd, so this needs no Date parsing and is
 * unaffected by the viewer's timezone.
 */
export function byIsoDateDesc(a: string, b: string): number {
  return b.localeCompare(a);
}
