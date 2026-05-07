import type { RequestStatus } from "@/types";

export type TimelineEvent = { status: RequestStatus; note: string | null; created_at: string };

export function RequestTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative border-l border-slate-200 pl-6">
      {events.map((e, i) => (
        <li key={i} className="mb-6 ml-1">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-blue-600" />
          <p className="text-sm font-medium text-slate-900">{e.status.replace(/_/g, " ")}</p>
          <p className="text-xs text-slate-500">{new Date(e.created_at).toLocaleString()}</p>
          {e.note && <p className="mt-1 text-sm text-slate-600">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
