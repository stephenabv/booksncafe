/**
 * Conversions between UTC instants and wall-clock values in the business time
 * zone, used by admin <input type="datetime-local"> fields.
 */

function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** "2026-03-10T18:00" in `timeZone` -> UTC Date. Returns null for malformed input. */
export function zonedLocalToUtc(local: string, timeZone: string): Date | null {
  const m = LOCAL_PATTERN.exec(local);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number) as [number, number, number, number, number, number];
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi));
  if (Number.isNaN(guess.getTime())) return null;
  // Two passes handle DST transitions in zones that observe them.
  let result = new Date(guess.getTime() - offsetMinutes(guess, timeZone) * 60000);
  result = new Date(guess.getTime() - offsetMinutes(result, timeZone) * 60000);
  return result;
}

/** UTC Date -> "YYYY-MM-DDTHH:mm" wall-clock string in `timeZone`. */
export function utcToZonedLocal(instant: Date, timeZone: string): string {
  const shifted = new Date(instant.getTime() + offsetMinutes(instant, timeZone) * 60000);
  return shifted.toISOString().slice(0, 16);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
