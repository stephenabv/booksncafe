import { describeHours, weekFromMonday, type DailyHours, type SpecialHoursEntry } from "@/lib/hours";

export function HoursTable({ hours, special, tone = "light" }: { hours: DailyHours[]; special: SpecialHoursEntry[]; tone?: "light" | "dark" }) {
  const week = weekFromMonday(hours).filter((d) => d.known);
  const muted = tone === "dark" ? "text-cream-300" : "text-espresso-600";
  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <caption className="sr-only">Opening hours</caption>
        <tbody>
          {week.map((day) => (
            <tr key={day.dayOfWeek} className="border-b border-current/10 last:border-0">
              <th scope="row" className="py-1.5 pr-4 text-left font-medium">
                {day.name}
              </th>
              <td className={`py-1.5 text-right ${muted}`}>{describeHours(day)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {special.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Holiday & special hours</h3>
          <ul className={`mt-1 space-y-1 text-sm ${muted}`}>
            {special.map((s) => (
              <li key={s.date}>
                <time dateTime={s.date}>
                  {new Date(`${s.date}T00:00:00Z`).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "UTC" })}
                </time>{" "}
                · {s.label}: {describeHours(s)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
