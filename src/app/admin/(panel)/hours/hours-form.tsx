"use client";

import { startTransition, useActionState, useState } from "react";
import { IDLE_RESULT } from "@/lib/admin-fields";
import { DAY_NAMES } from "@/lib/hours";
import { saveOpeningHours } from "@/server/actions/admin";

interface DayRow {
  dayOfWeek: number;
  isClosed: boolean;
  opensAt: string;
  closesAt: string;
}

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function HoursForm({ hours }: { hours: DayRow[] }) {
  const [state, action, pending] = useActionState(saveOpeningHours, IDLE_RESULT);
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
  const [listed, setListed] = useState<Record<number, boolean>>(() => Object.fromEntries(ORDER.map((d) => [d, byDay.has(d)])));
  const [closed, setClosed] = useState<Record<number, boolean>>(() => Object.fromEntries(ORDER.map((d) => [d, byDay.get(d)?.isClosed ?? false])));
  const errors = state.fieldErrors ?? {};

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-6"
    >
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={`rounded-xl px-4 py-3 text-sm font-medium ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {state.message}
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th scope="col" className="px-4 py-3">Day</th>
              <th scope="col" className="px-4 py-3">Show on website</th>
              <th scope="col" className="px-4 py-3">Closed</th>
              <th scope="col" className="px-4 py-3">Opens</th>
              <th scope="col" className="px-4 py-3">Closes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {ORDER.map((day) => {
              const row = byDay.get(day);
              const name = DAY_NAMES[day];
              const disabled = !listed[day] || closed[day];
              return (
                <tr key={day} className={errors[`day-${day}`] ? "bg-red-50" : undefined}>
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    {name}
                    {errors[`day-${day}`] && <p className="mt-1 text-xs font-medium text-red-700">{errors[`day-${day}`]}</p>}
                  </th>
                  <td className="px-4 py-3">
                    <input type="checkbox" name={`listed-${day}`} aria-label={`Show ${name} on website`} checked={listed[day]} onChange={(e) => setListed((s) => ({ ...s, [day]: e.target.checked }))} className="size-5 accent-amber-600" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" name={`closed-${day}`} aria-label={`${name} closed`} checked={closed[day]} disabled={!listed[day]} onChange={(e) => setClosed((s) => ({ ...s, [day]: e.target.checked }))} className="size-5 accent-amber-600" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="time" name={`opens-${day}`} aria-label={`${name} opening time`} defaultValue={row?.opensAt} disabled={disabled} className="rounded-lg border border-stone-300 px-2 py-1.5 disabled:opacity-40" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="time" name={`closes-${day}`} aria-label={`${name} closing time`} defaultValue={row?.closesAt} disabled={disabled} className="rounded-lg border border-stone-300 px-2 py-1.5 disabled:opacity-40" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-full bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60">
        {pending ? "Saving…" : "Save opening hours"}
      </button>
    </form>
  );
}
