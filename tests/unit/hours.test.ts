import { describe, expect, it } from "vitest";
import { describeHours, formatClock, resolveToday, toOpeningHoursSpecification, weekFromMonday, zonedParts } from "@/lib/hours";

const TZ = "Asia/Manila";
const weekdays = [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, isClosed: false, opensAt: "08:00:00", closesAt: "20:00:00" }));

describe("hours helpers", () => {
  it("formats clock values in 12-hour time", () => {
    expect(formatClock("08:00:00")).toBe("8:00 AM");
    expect(formatClock("12:30")).toBe("12:30 PM");
    expect(formatClock("00:15")).toBe("12:15 AM");
    expect(describeHours({ isClosed: true, opensAt: null, closesAt: null })).toBe("Closed");
  });

  it("orders the week from Monday and flags unknown days", () => {
    const week = weekFromMonday(weekdays);
    expect(week.map((d) => d.name)).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
    expect(week.filter((d) => d.known)).toHaveLength(5);
  });

  it("computes wall-clock parts in the business time zone", () => {
    // 2026-10-19T00:30Z is 08:30 on Monday in Manila (UTC+8).
    expect(zonedParts(new Date("2026-10-19T00:30:00Z"), TZ)).toEqual({ date: "2026-10-19", dayOfWeek: 1, minutes: 510 });
  });

  it("reports open and closed states", () => {
    expect(resolveToday(weekdays, [], TZ, new Date("2026-10-19T00:30:00Z"))?.isOpen).toBe(true);
    expect(resolveToday(weekdays, [], TZ, new Date("2026-10-19T13:00:00Z"))?.isOpen).toBe(false); // 21:00 local
    expect(resolveToday(weekdays, [], TZ, new Date("2026-10-18T03:00:00Z"))).toBeNull(); // Sunday, no record
  });

  it("lets special hours override the weekly schedule", () => {
    const special = [{ date: "2026-10-19", label: "Staff training", isClosed: true, opensAt: null, closesAt: null }];
    expect(resolveToday(weekdays, special, TZ, new Date("2026-10-19T02:00:00Z"))).toEqual({ isOpen: false, label: "Closed today", note: "Staff training" });
  });

  it("handles closing times after midnight", () => {
    const late = [{ dayOfWeek: 5, isClosed: false, opensAt: "18:00", closesAt: "02:00" }];
    // Friday 23:00 Manila = 15:00Z
    expect(resolveToday(late, [], TZ, new Date("2026-10-23T15:00:00Z"))?.isOpen).toBe(true);
  });

  it("emits schema.org specs only for open days", () => {
    const spec = toOpeningHoursSpecification([...weekdays, { dayOfWeek: 0, isClosed: true, opensAt: null, closesAt: null }]);
    expect(spec).toHaveLength(5);
    expect(spec[0]).toEqual({ "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Monday", opens: "08:00", closes: "20:00" });
  });
});
