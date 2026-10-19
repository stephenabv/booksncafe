export type EventStatus = "upcoming" | "ongoing" | "past";

export function getEventStatus(startsAt: Date, endsAt: Date, now: Date = new Date()): EventStatus {
  if (now < startsAt) return "upcoming";
  if (now <= endsAt) return "ongoing";
  return "past";
}

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Happening now",
  past: "Past event",
};

export function formatEventDateRange(startsAt: Date, endsAt: Date, timeZone: string): string {
  const day = new Intl.DateTimeFormat("en-PH", { timeZone, weekday: "short", month: "long", day: "numeric", year: "numeric" });
  const time = new Intl.DateTimeFormat("en-PH", { timeZone, hour: "numeric", minute: "2-digit" });
  const sameDay = day.format(startsAt) === day.format(endsAt);
  return sameDay
    ? `${day.format(startsAt)}, ${time.format(startsAt)} – ${time.format(endsAt)}`
    : `${day.format(startsAt)}, ${time.format(startsAt)} – ${day.format(endsAt)}, ${time.format(endsAt)}`;
}
