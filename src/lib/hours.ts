export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export interface DailyHours {
  dayOfWeek: number;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

export interface SpecialHoursEntry {
  date: string; // YYYY-MM-DD in the business time zone
  label: string;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

/** "08:00:00" -> "8:00 AM" */
export function formatClock(value: string | null): string {
  if (!value) return "";
  const [h = "0", m = "0"] = value.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m.padStart(2, "0")} ${suffix}`;
}

export function describeHours(entry: Pick<DailyHours, "isClosed" | "opensAt" | "closesAt">): string {
  if (entry.isClosed || !entry.opensAt || !entry.closesAt) return "Closed";
  return `${formatClock(entry.opensAt)} – ${formatClock(entry.closesAt)}`;
}

/** Returns the seven days ordered Monday → Sunday, including days with no record. */
export function weekFromMonday(hours: readonly DailyHours[]): Array<DailyHours & { name: string; known: boolean }> {
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
  return [1, 2, 3, 4, 5, 6, 0].map((day) => {
    const entry = byDay.get(day);
    return {
      dayOfWeek: day,
      name: DAY_NAMES[day]!,
      isClosed: entry?.isClosed ?? false,
      opensAt: entry?.opensAt ?? null,
      closesAt: entry?.closesAt ?? null,
      known: entry !== undefined,
    };
  });
}

/** Wall-clock date and time parts for `now` in the given IANA time zone. */
export function zonedParts(now: Date, timeZone: string): { date: string; dayOfWeek: number; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday ?? "");
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    dayOfWeek: weekday,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function toMinutes(value: string): number {
  const [h = "0", m = "0"] = value.split(":");
  return Number(h) * 60 + Number(m);
}

/**
 * Resolves today's effective hours (special hours override the weekly schedule)
 * and whether the venue is open at `now`. Returns null when no schedule exists.
 */
export function resolveToday(
  hours: readonly DailyHours[],
  special: readonly SpecialHoursEntry[],
  timeZone: string,
  now: Date = new Date(),
): { isOpen: boolean; label: string; note?: string } | null {
  const { date, dayOfWeek, minutes } = zonedParts(now, timeZone);
  const override = special.find((s) => s.date === date);
  const regular = hours.find((h) => h.dayOfWeek === dayOfWeek);
  const entry = override ?? regular;
  if (!entry) return null;
  if (entry.isClosed || !entry.opensAt || !entry.closesAt) {
    return { isOpen: false, label: "Closed today", note: override?.label };
  }
  const open = toMinutes(entry.opensAt);
  let close = toMinutes(entry.closesAt);
  if (close <= open) close += 24 * 60; // closes after midnight
  const isOpen = minutes >= open && minutes < close;
  return { isOpen, label: `Today ${describeHours(entry)}`, note: override?.label };
}

/** schema.org OpeningHoursSpecification entries for structured data. */
export function toOpeningHoursSpecification(hours: readonly DailyHours[]) {
  return hours
    .filter((h) => !h.isClosed && h.opensAt && h.closesAt)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAY_NAMES[h.dayOfWeek]}`,
      opens: h.opensAt!.slice(0, 5),
      closes: h.closesAt!.slice(0, 5),
    }));
}
