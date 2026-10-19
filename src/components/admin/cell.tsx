import type { ColumnKind } from "@/server/admin/resources";
import { formatPrice } from "@/lib/money";

export function Cell({ value, kind, timeZone }: { value: unknown; kind?: ColumnKind; timeZone: string }) {
  if (value === null || value === undefined || value === "") return <span className="text-stone-400">—</span>;
  switch (kind) {
    case "bool":
      return value ? (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">Yes</span>
      ) : (
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">No</span>
      );
    case "money":
      return <>{formatPrice(value as string)}</>;
    case "datetime":
      return <>{new Intl.DateTimeFormat("en-PH", { timeZone, dateStyle: "medium", timeStyle: "short" }).format(value as Date)}</>;
    case "date":
      return <>{new Date(`${String(value)}T00:00:00Z`).toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "UTC" })}</>;
    default:
      return <>{String(value)}</>;
  }
}
